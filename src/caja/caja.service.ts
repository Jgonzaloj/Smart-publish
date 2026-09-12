import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/jwt.strategy';
import { CrearMovimientoDto, RetiroCajaDto, CerrarCuadreDto } from './dto/caja.dto';

@Injectable()
export class CajaService {
  constructor(private prisma: PrismaService) {}

  /** Devuelve el rango [00:00, 23:59:59] del día consultado (o de hoy si no se especifica). */
  private rangoDia(fecha?: string): { inicio: Date; fin: Date } {
    const base = fecha ? new Date(fecha + 'T00:00:00') : new Date();
    const inicio = new Date(base);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(base);
    fin.setHours(23, 59, 59, 999);
    return { inicio, fin };
  }

  // ---------- Skill 10: Gestión de ingresos y egresos ----------

  async registrarMovimiento(dto: CrearMovimientoDto, user: JwtPayload) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      return tx.movimientoCaja.create({
        data: {
          tenantId: user.tenantId,
          vendedorId: user.sub,
          tipo: dto.tipo,
          concepto: dto.concepto,
          valor: dto.valor,
        },
      });
    });
  }

  async listarMovimientos(user: JwtPayload, fecha?: string) {
    const { inicio, fin } = this.rangoDia(fecha);
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const where: any = { fecha: { gte: inicio, lte: fin } };
      if (user.rol === 'VENDEDOR') where.vendedorId = user.sub;
      return tx.movimientoCaja.findMany({ where, orderBy: { fecha: 'desc' } });
    });
  }

  // ---------- Skill 16: Retiro de caja ----------

  async registrarRetiro(dto: RetiroCajaDto, user: JwtPayload) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const movimiento = await tx.movimientoCaja.create({
        data: {
          tenantId: user.tenantId,
          vendedorId: user.sub,
          tipo: 'EGRESO',
          concepto: dto.concepto || 'Retiro de caja',
          valor: dto.valor,
        },
      });

      // Acumula el retiro en el cuadre del día (se crea si aún no existe).
      const { inicio, fin } = this.rangoDia();
      const cuadreExistente = await tx.cuadreCaja.findFirst({
        where: { vendedorId: user.sub, fecha: { gte: inicio, lte: fin } },
      });

      if (cuadreExistente) {
        await tx.cuadreCaja.update({
          where: { id: cuadreExistente.id },
          data: { totalRetiros: Number(cuadreExistente.totalRetiros) + dto.valor },
        });
      } else {
        await tx.cuadreCaja.create({
          data: {
            tenantId: user.tenantId,
            vendedorId: user.sub,
            totalRetiros: dto.valor,
          },
        });
      }

      return movimiento;
    });
  }

  // ---------- Skill 6: Cuadre de caja diario ----------

  /** Calcula en vivo los totales del día (sin persistir), útil para mostrar el resumen antes de cerrar. */
  async obtenerCuadreDia(user: JwtPayload, fecha?: string, vendedorIdParam?: string) {
    const { inicio, fin } = this.rangoDia(fecha);
    const vendedorId = user.rol === 'VENDEDOR' ? user.sub : vendedorIdParam;

    if (user.rol === 'VENDEDOR' && vendedorIdParam && vendedorIdParam !== user.sub) {
      throw new ForbiddenException('No puedes consultar el cuadre de otro vendedor');
    }

    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const filtroVendedor = vendedorId ? { vendedorId } : {};

      const [abonosDia, creditosNuevos, movimientos, cuadrePersistido] = await Promise.all([
        tx.abono.findMany({
          where: { fecha: { gte: inicio, lte: fin }, ...(vendedorId ? { usuarioId: vendedorId } : {}) },
        }),
        tx.credito.findMany({
          where: { fechaInicio: { gte: inicio, lte: fin }, ...filtroVendedor },
        }),
        tx.movimientoCaja.findMany({
          where: { fecha: { gte: inicio, lte: fin }, ...filtroVendedor },
        }),
        vendedorId
          ? tx.cuadreCaja.findFirst({ where: { vendedorId, fecha: { gte: inicio, lte: fin } } })
          : null,
      ]);

      const totalCobrado = abonosDia.reduce((sum, a) => sum + Number(a.valorAbonado), 0);
      const totalPrestadoNuevo = creditosNuevos.reduce((sum, c) => sum + Number(c.valorPrestamo), 0);
      const totalIngresos = movimientos.filter((m) => m.tipo === 'INGRESO').reduce((s, m) => s + Number(m.valor), 0);
      const totalEgresos = movimientos.filter((m) => m.tipo === 'EGRESO').reduce((s, m) => s + Number(m.valor), 0);
      const totalRetiros = cuadrePersistido ? Number(cuadrePersistido.totalRetiros) : 0;

      const saldoEsperadoEnCaja = totalCobrado + totalIngresos - totalPrestadoNuevo - totalEgresos - totalRetiros;

      return {
        fecha: inicio.toISOString().slice(0, 10),
        vendedorId: vendedorId ?? null,
        totalCobrado,
        totalPrestadoNuevo,
        totalIngresos,
        totalEgresos,
        totalRetiros,
        saldoEsperadoEnCaja,
        cerrado: !!cuadrePersistido?.observaciones,
      };
    });
  }

  /** El vendedor cierra su día: persiste el snapshot del cuadre. */
  async cerrarCuadre(dto: CerrarCuadreDto, user: JwtPayload) {
    const resumen = await this.obtenerCuadreDia(user);
    const { inicio, fin } = this.rangoDia();

    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const existente = await tx.cuadreCaja.findFirst({
        where: { vendedorId: user.sub, fecha: { gte: inicio, lte: fin } },
      });

      const data = {
        totalCobrado: resumen.totalCobrado,
        totalPrestadoNuevo: resumen.totalPrestadoNuevo,
        totalRetiros: resumen.totalRetiros,
        observaciones: dto.observaciones || 'Cuadre cerrado',
      };

      if (existente) {
        return tx.cuadreCaja.update({ where: { id: existente.id }, data });
      }
      return tx.cuadreCaja.create({
        data: { tenantId: user.tenantId, vendedorId: user.sub, ...data },
      });
    });
  }

  /** Vista consolidada del administrador: cuadre de todos los vendedores en una fecha. */
  async resumenAdmin(user: JwtPayload, fecha?: string) {
    // Nota: para negocios con muchos vendedores conviene optimizar esto con una
    // sola consulta agregada (GROUP BY) en vez de una transacción por vendedor.
    // Se deja así por claridad en esta primera versión.
    const vendedores = await this.prisma.withTenant(user.tenantId, async (tx) =>
      tx.usuario.findMany({ where: { rol: 'VENDEDOR', activo: true } }),
    );

    const resultados = await Promise.all(
      vendedores.map(async (v) => {
        const resumen = await this.obtenerCuadreDia(user, fecha, v.id);
        return { vendedor: { id: v.id, nombre: v.nombre }, ...resumen };
      }),
    );

    return resultados;
  }
}
