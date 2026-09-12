import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  /**
   * Login: busca las credenciales por email mediante buscarCredencialesLogin()
   * (ver PrismaService), que es la única vía autorizada para leer usuarios()
   * sin conocer aún el tenant. Valida SOLO la contraseña real -- el PIN de
   * 4 dígitos ("Proteger Aplicación") nunca debe aceptarse aquí (hallazgo
   * crítico 1.2): usar /auth/verificar-pin, que exige una sesión ya iniciada.
   */
  async login(dto: LoginDto) {
    const cred = await this.prisma.buscarCredencialesLogin(dto.email);

    if (!cred || !cred.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatch = await bcrypt.compare(dto.password, cred.passwordHash).catch(() => false);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: cred.tenantId },
    });

    if (tenant && tenant.activo === false) {
      throw new UnauthorizedException('Empresa suspendida por falta de pago de suscripción. Comunícate con el proveedor del software para reactivar tu cuenta.');
    }

    const payload = {
      sub: cred.id,
      tenantId: cred.tenantId,
      rol: cred.rol,
      nombre: cred.nombre,
    };

    return {
      accessToken: this.jwt.sign(payload),
      usuario: {
        id: cred.id,
        nombre: cred.nombre,
        rol: cred.rol,
        tenantId: cred.tenantId,
      },
      tenant: {
        id: tenant?.id || cred.tenantId,
        nombreNegocio: tenant?.nombreNegocio || 'CrediYa',
        moneda: (tenant as any)?.moneda || 'PEN',
        pais: (tenant as any)?.pais || 'Perú',
      },
    };
  }

  /**
   * Registro del primer administrador de un negocio nuevo con su país y moneda.
   * Crea el tenant y el usuario admin en un solo paso (onboarding).
   */
  async registrarNegocio(
    nombreNegocio: string,
    adminNombre: string,
    email: string,
    password: string,
    moneda: string = 'PEN',
    pais: string = 'Perú',
  ) {
    const passwordHash = await bcrypt.hash(password, 10);

    const tenant = await this.prisma.tenant.create({
      data: { nombreNegocio, activo: true, moneda, pais } as any,
    });

    const usuario = await this.prisma.usuario.create({
      data: {
        tenantId: tenant.id,
        nombre: adminNombre,
        email,
        rol: 'ADMIN',
        passwordHash,
        activo: true,
      },
    });

    return this.login({ email, password });
  }

  /**
   * Actualiza la moneda y país de operación de la empresa.
   */
  async actualizarMonedaTenant(tenantId: string, moneda: string) {
    const pais = moneda === 'PEN' ? 'Perú' : moneda === 'COP' ? 'Colombia' : moneda === 'MXN' ? 'México' : 'Internacional';
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { moneda, pais } as any,
    });
    return { mensaje: 'Moneda actualizada exitosamente', moneda, pais };
  }

  /**
   * Configura o actualiza el PIN de 4 dígitos para proteger la aplicación.
   */
  async configurarPin(usuarioId: string, tenantId: string, pin: string) {
    if (!/^\d{4}$/.test(pin)) {
      throw new UnauthorizedException('El PIN debe contener exactamente 4 dígitos numéricos');
    }
    const pinHash = await bcrypt.hash(pin, 10);
    return this.prisma.withTenant(tenantId, async (tx) => {
      await tx.usuario.update({
        where: { id: usuarioId },
        data: { pinHash },
      });
      return { message: 'PIN configurado exitosamente', configurado: true };
    });
  }

  /**
   * Verifica el PIN para desbloquear la aplicación.
   */
  async verificarPin(usuarioId: string, tenantId: string, pin: string) {
    return this.prisma.withTenant(tenantId, async (tx) => {
      const usuario = await tx.usuario.findFirst({
        where: { id: usuarioId },
        select: { pinHash: true },
      });
      if (!usuario || !usuario.pinHash) {
        return { valido: false, configurado: false, message: 'No hay PIN configurado' };
      }
      const valido = await bcrypt.compare(pin, usuario.pinHash);
      return { valido, configurado: true };
    });
  }
}
