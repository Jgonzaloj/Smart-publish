import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/jwt.strategy';
import {
  CrearUsuarioDto,
  ActualizarUsuarioDto,
  RolUsuario,
} from './dto/usuarios.dto';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todos los usuarios del tenant (Admins y Vendedores) con métricas de clientes asignados.
   */
  async listar(user: JwtPayload, filtroRol?: RolUsuario) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const where: any = {};
      if (filtroRol) {
        where.rol = filtroRol;
      }

      const usuarios = await tx.usuario.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          rol: true,
          posicion: true,
          activo: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Enriquecer con métricas de clientes y créditos asignados
      const clientes = await tx.cliente.findMany({
        select: { id: true, vendedorId: true },
      });
      const creditos = await tx.credito.findMany({
        where: { estado: 'ACTIVO' },
        select: { id: true, vendedorId: true, saldoActual: true },
      });

      return usuarios.map((u) => {
        const misClientes = clientes.filter((c) => c.vendedorId === u.id);
        const misCreditos = creditos.filter((cr) => cr.vendedorId === u.id);
        const carteraActiva = misCreditos
          .reduce((sum, cr) => sum.plus(new Prisma.Decimal(cr.saldoActual || 0)), new Prisma.Decimal(0))
          .toNumber();

        return {
          ...u,
          totalClientes: misClientes.length,
          creditosActivos: misCreditos.length,
          carteraActiva,
        };
      });
    });
  }

  /**
   * Obtiene un usuario específico por su ID.
   */
  async obtenerPorId(id: string, user: JwtPayload) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const usuario = await tx.usuario.findFirst({
        where: { id, tenantId: user.tenantId },
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          rol: true,
          posicion: true,
          activo: true,
          createdAt: true,
        },
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      return usuario;
    });
  }

  /**
   * Crea un nuevo usuario (ADMIN o VENDEDOR) para el tenant.
   */
  async crearUsuario(user: JwtPayload, dto: CrearUsuarioDto) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      // Validar si ya existe usuario con el mismo email en el tenant
      const existente = await tx.usuario.findFirst({
        where: { email: dto.email.toLowerCase().trim() },
      });
      if (existente) {
        throw new ConflictException('Ya existe un usuario con este correo electrónico');
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);
      const pinHash = dto.pin ? await bcrypt.hash(dto.pin, 10) : undefined;

      const nuevo = await tx.usuario.create({
        data: {
          tenantId: user.tenantId,
          nombre: dto.nombre.trim(),
          email: dto.email.toLowerCase().trim(),
          passwordHash,
          pinHash,
          rol: dto.rol,
          telefono: dto.telefono?.trim() || null,
          posicion: dto.posicion?.trim() || null,
          activo: true,
        },
      });

      return {
        id: nuevo.id,
        nombre: nuevo.nombre,
        email: nuevo.email,
        rol: nuevo.rol,
        telefono: nuevo.telefono,
        posicion: nuevo.posicion,
        activo: nuevo.activo,
        createdAt: nuevo.createdAt,
      };
    });
  }

  /**
   * Retrocompatibilidad para endpoint anterior de crear vendedor.
   */
  async crearVendedor(user: JwtPayload, nombre: string, email: string, password: string, posicion?: string) {
    return this.crearUsuario(user, {
      nombre,
      email,
      password,
      rol: RolUsuario.VENDEDOR,
      posicion,
    });
  }

  /**
   * Actualiza datos generales de un usuario.
   */
  async actualizarUsuario(id: string, user: JwtPayload, dto: ActualizarUsuarioDto) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const actual = await tx.usuario.findFirst({
        where: { id, tenantId: user.tenantId },
      });
      if (!actual) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Evitar que el administrador se cambie su propio rol a VENDEDOR
      if (actual.id === user.sub && dto.rol && dto.rol !== RolUsuario.ADMIN) {
        throw new BadRequestException('No puedes degradar tu propio rol de administrador');
      }

      return tx.usuario.update({
        where: { id },
        data: {
          ...(dto.nombre ? { nombre: dto.nombre.trim() } : {}),
          ...(dto.telefono !== undefined ? { telefono: dto.telefono ? dto.telefono.trim() : null } : {}),
          ...(dto.posicion !== undefined ? { posicion: dto.posicion ? dto.posicion.trim() : null } : {}),
          ...(dto.rol ? { rol: dto.rol } : {}),
          ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          rol: true,
          posicion: true,
          activo: true,
          createdAt: true,
        },
      });
    });
  }

  /**
   * Activa o desactiva a un usuario.
   */
  async alternarEstado(id: string, user: JwtPayload, activo: boolean) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      if (id === user.sub && !activo) {
        throw new BadRequestException('No puedes desactivar tu propia cuenta de administrador');
      }

      const usuario = await tx.usuario.findFirst({
        where: { id, tenantId: user.tenantId },
      });
      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      return tx.usuario.update({
        where: { id },
        data: { activo },
        select: { id: true, nombre: true, activo: true },
      });
    });
  }

  /**
   * Retrocompatibilidad para desactivar vendedor.
   */
  async desactivar(id: string, user: JwtPayload) {
    return this.alternarEstado(id, user, false);
  }

  /**
   * Restablece la contraseña de un usuario.
   */
  async cambiarPassword(id: string, user: JwtPayload, nuevaClave: string) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const usuario = await tx.usuario.findFirst({
        where: { id, tenantId: user.tenantId },
      });
      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const passwordHash = await bcrypt.hash(nuevaClave, 10);
      await tx.usuario.update({
        where: { id },
        data: { passwordHash },
      });

      return { mensaje: 'Contraseña actualizada exitosamente', usuarioId: id };
    });
  }

  /**
   * Restablece el PIN de protección de aplicación de un usuario.
   */
  async cambiarPin(id: string, user: JwtPayload, nuevoPin: string) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const usuario = await tx.usuario.findFirst({
        where: { id, tenantId: user.tenantId },
      });
      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const pinHash = await bcrypt.hash(nuevoPin, 10);
      await tx.usuario.update({
        where: { id },
        data: { pinHash },
      });

      return { mensaje: 'PIN actualizado exitosamente', usuarioId: id };
    });
  }

  /**
   * Elimina a un usuario sólo si no tiene registros históricos vinculados
   * (abonos o créditos). Si tiene historial, exige desactivarlo para proteger la auditoría contable.
   */
  async eliminarUsuario(id: string, user: JwtPayload) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      if (id === user.sub) {
        throw new BadRequestException('No puedes eliminar tu propia cuenta de administrador');
      }

      const usuario = await tx.usuario.findFirst({
        where: { id, tenantId: user.tenantId },
      });
      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const abonosCount = await tx.abono.count({ where: { usuarioId: id } });
      const creditosCount = await tx.credito.count({ where: { vendedorId: id } });

      if (abonosCount > 0 || creditosCount > 0) {
        throw new BadRequestException(
          `No se puede eliminar físicamente: tiene ${abonosCount} abono(s) y ${creditosCount} crédito(s) vinculados en el historial financiero. Utiliza el botón de desactivar (🚫) para revocar su acceso sin corromper la contabilidad.`
        );
      }

      await tx.usuario.delete({ where: { id } });
      return { mensaje: 'Usuario eliminado exitosamente', id };
    });
  }
}
