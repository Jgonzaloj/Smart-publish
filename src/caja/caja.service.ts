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
      const recaudoEfectivo = abonosDia.filter((a: any) => !a.metodoPago || a.metodoPago === 'EFECTIVO').reduce((sum, a) => sum + Number(a.valorAbonado), 0);
      const recaudoTransferencia = abonosDia.filter((a: any) => a.metodoPago && a.metodoPago !== 'EFECTIVO').reduce((sum, a) => sum + Number(a.valorAbonado), 0);
      const totalPrestadoNuevo = creditosNuevos.reduce((sum, c) => sum + Number(c.valorPrestamo), 0);
      const totalIngresos = movimientos.filter((m) => m.tipo === 'INGRESO' && !(m as any).esSeguro).reduce((s, m) => s + Number(m.valor), 0);
      const totalEgresos = movimientos.filter((m) => m.tipo === 'EGRESO' && !(m as any).esSeguro).reduce((s, m) => s + Number(m.valor), 0);
      const ingresosSeguros = movimientos.filter((m) => m.tipo === 'INGRESO' && (m as any).esSeguro).reduce((s, m) => s + Number(m.valor), 0);
      const retirosSeguros = movimientos.filter((m) => m.tipo === 'EGRESO' && (m as any).esSeguro).reduce((s, m) => s + Number(m.valor), 0);
      const totalRetiros = cuadrePersistido ? Number(cuadrePersistido.totalRetiros) : 0;
      const cajaInicial = cuadrePersistido ? Number((cuadrePersistido as any).cajaInicial || 0) : 0;
      const cajaSeguros = ingresosSeguros - retirosSeguros;

      const saldoEsperadoEnCaja = cajaInicial + recaudoEfectivo + totalIngresos - totalPrestadoNuevo - totalEgresos - totalRetiros;

      return {
        fecha: inicio.toISOString().slice(0, 10),
        vendedorId: vendedorId ?? null,
        cajaInicial,
        totalCobrado,
        recaudoEfectivo,
        recaudoTransferencia,
        totalPrestadoNuevo,
        totalIngresos,
        totalEgresos,
        totalRetiros,
        ingresosSeguros,
        retirosSeguros,
        cajaSeguros,
        saldoEsperadoEnCaja,
        cerrado: !!cuadrePersistido?.observaciones,
      };
    });
  }

  /**
   * Resumen del Día completo estilo V13 con todas las métricas operativas y financieras
   */
  async obtenerResumenDia(user: JwtPayload, fecha?: string, vendedorIdParam?: string) {
    const { inicio, fin } = this.rangoDia(fecha);
    const vendedorId = user.rol === 'VENDEDOR' ? user.sub : (vendedorIdParam === 'todos' ? undefined : vendedorIdParam);

    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const filtroVendedor = vendedorId ? { vendedorId } : {};

      let vendedorNombre = 'Todos los Cobradores (Supervisión)';
      if (vendedorId) {
        const v = await tx.usuario.findFirst({
          where: { id: vendedorId, tenantId: user.tenantId },
          select: { nombre: true, posicion: true },
        });
        if (v) vendedorNombre = v.posicion ? `${v.nombre} (${v.posicion})` : v.nombre;
      }

      const [
        clientes,
        clientesNuevos,
        creditosActivos,
        creditosNuevos,
        abonosDia,
        movimientos,
        cuadrePersistido,
      ] = await Promise.all([
        tx.cliente.findMany({
          where: { tenantId: user.tenantId, ...filtroVendedor },
          select: { id: true, estadoVisita: true, nombresAlias: true, apellidos: true, movil: true, direccion: true },
        }),
        tx.cliente.count({
          where: { tenantId: user.tenantId, ...filtroVendedor, createdAt: { gte: inicio, lte: fin } },
        }),
        tx.credito.findMany({
          where: {
            tenantId: user.tenantId,
            ...filtroVendedor,
            estado: { in: ['ACTIVO', 'EN_MORA'] },
            saldoActual: { gt: 0 },
          },
          select: { id: true, clienteId: true, valorCuota: true, saldoActual: true },
        }),
        tx.credito.findMany({
          where: { tenantId: user.tenantId, ...filtroVendedor, fechaInicio: { gte: inicio, lte: fin } },
          select: { valorPrestamo: true },
        }),
        tx.abono.findMany({
          where: {
            tenantId: user.tenantId,
            fecha: { gte: inicio, lte: fin },
            ...(vendedorId ? { usuarioId: vendedorId } : {}),
          },
          select: { id: true, creditoId: true, valorAbonado: true, metodoPago: true, esAdicional: true },
        }),
        tx.movimientoCaja.findMany({
          where: { tenantId: user.tenantId, fecha: { gte: inicio, lte: fin }, ...filtroVendedor },
        }),
        vendedorId
          ? tx.cuadreCaja.findFirst({ where: { vendedorId, fecha: { gte: inicio, lte: fin } } })
          : null,
      ]);

      const creditosIdsConAbono = new Set(abonosDia.map((a) => a.creditoId));

      const clientesAusentes = clientes.filter((c) => c.estadoVisita === 'AUSENTE').length;
      const aplazadosSiguienteDia = clientes.filter((c) => (c.estadoVisita as any) === 'APLAZADO').length;
      const numeroClientes = clientes.length;

      // Pagos Registrados en ruta vs adicionales
      const pagosEnRuta = abonosDia.filter((a: any) => !a.esAdicional).length;
      const pagosAdicionales = abonosDia.filter((a: any) => a.esAdicional).length;

      const cajaInicial = cuadrePersistido ? Number((cuadrePersistido as any).cajaInicial || 0) : 0;
      const recaudoEsperado = creditosActivos.reduce((s, c) => s + Number(c.valorCuota), 0);
      const recaudoDia = abonosDia.reduce((s, a) => s + Number(a.valorAbonado), 0);
      const porcentajeRecaudo = recaudoEsperado > 0 ? Number(((recaudoDia / recaudoEsperado) * 100).toFixed(1)) : 0;

      const efectivo = abonosDia
        .filter((a: any) => !a.metodoPago || a.metodoPago === 'EFECTIVO')
        .reduce((s, a) => s + Number(a.valorAbonado), 0);
      const transferencia = abonosDia
        .filter((a: any) => a.metodoPago && a.metodoPago !== 'EFECTIVO')
        .reduce((s, a) => s + Number(a.valorAbonado), 0);

      const totalVentas = creditosNuevos.reduce((s, c) => s + Number(c.valorPrestamo), 0);
      const retirosCaja = cuadrePersistido ? Number(cuadrePersistido.totalRetiros) : 0;
      const egresos = movimientos.filter((m) => m.tipo === 'EGRESO' && !(m as any).esSeguro).reduce((s, m) => s + Number(m.valor), 0);
      const ingresos = movimientos.filter((m) => m.tipo === 'INGRESO' && !(m as any).esSeguro).reduce((s, m) => s + Number(m.valor), 0);

      const ingresosSeguros = movimientos.filter((m) => m.tipo === 'INGRESO' && (m as any).esSeguro).reduce((s, m) => s + Number(m.valor), 0);
      const retiroCajaSeguros = movimientos.filter((m) => m.tipo === 'EGRESO' && (m as any).esSeguro).reduce((s, m) => s + Number(m.valor), 0);
      const cajaSeguros = ingresosSeguros - retiroCajaSeguros;

      const saldoEnCaja = Number((cajaInicial + efectivo + ingresos - totalVentas - retirosCaja - egresos).toFixed(2));

      // Clientes no pagados para el botón "[✔️ No Pagos]"
      const clientesNoPagados = creditosActivos
        .filter((cr) => !creditosIdsConAbono.has(cr.id))
        .map((cr) => {
          const cli = clientes.find((c) => c.id === cr.clienteId);
          return {
            clienteId: cr.clienteId,
            nombre: cli ? `${cli.nombresAlias} ${cli.apellidos || ''}`.trim() : 'Cliente',
            movil: cli?.movil || '',
            direccion: cli?.direccion || '',
            estadoVisita: cli?.estadoVisita || 'AL_DIA',
            valorCuota: Number(cr.valorCuota),
            saldoActual: Number(cr.saldoActual),
          };
        });

      return {
        vendedorNombre,
        fechaRuta: inicio.toISOString().slice(0, 10),
        clientesAusentes,
        aplazadosSiguienteDia,
        numeroClientes,
        clientesNuevos,
        pagosRegistradosTexto: `${pagosEnRuta}/${numeroClientes} Adicionales: ${pagosAdicionales}`,
        pagosEnRuta,
        pagosAdicionales,
        cajaInicial,
        recaudoEsperado,
        recaudoDia,
        porcentajeRecaudo,
        efectivo,
        transferencia,
        totalVentas,
        retirosCaja,
        egresos,
        ingresos,
        retiroCajaSeguros,
        ingresosSeguros,
        cajaSeguros,
        saldoEnCaja,
        sincronizacionAutomatica: true,
        clientesNoPagados,
      };
    });
  }

  /** Establece la base o caja inicial del día */
  async setCajaInicial(dto: { cajaInicial: number; fecha?: string }, user: JwtPayload) {
    const { inicio, fin } = this.rangoDia(dto.fecha);

    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const existente = await tx.cuadreCaja.findFirst({
        where: { vendedorId: user.sub, fecha: { gte: inicio, lte: fin } },
      });

      if (existente) {
        return tx.cuadreCaja.update({
          where: { id: existente.id },
          data: { cajaInicial: dto.cajaInicial } as any,
        });
      }

      return tx.cuadreCaja.create({
        data: {
          tenantId: user.tenantId,
          vendedorId: user.sub,
          cajaInicial: dto.cajaInicial,
        } as any,
      });
    });
  }

  /** Registra un movimiento específico de la caja de seguros */
  async registrarMovimientoSeguro(dto: { tipo: 'INGRESO' | 'EGRESO'; valor: number; concepto?: string }, user: JwtPayload) {
    return this.prisma.withTenant(user.tenantId, async (tx) => {
      return tx.movimientoCaja.create({
        data: {
          tenantId: user.tenantId,
          vendedorId: user.sub,
          tipo: dto.tipo,
          concepto: dto.concepto || (dto.tipo === 'INGRESO' ? 'Ingreso de seguro' : 'Retiro de caja seguro'),
          valor: dto.valor,
          esSeguro: true,
        } as any,
      });
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
        cajaInicial: resumen.cajaInicial,
        totalCobrado: resumen.totalCobrado,
        recaudoEfectivo: resumen.recaudoEfectivo,
        recaudoTransferencia: resumen.recaudoTransferencia,
        totalPrestadoNuevo: resumen.totalPrestadoNuevo,
        totalRetiros: resumen.totalRetiros,
        cajaSeguros: resumen.cajaSeguros,
        ingresosSeguros: resumen.ingresosSeguros,
        retirosSeguros: resumen.retirosSeguros,
        observaciones: dto.observaciones || 'Cuadre cerrado',
      };

      if (existente) {
        return tx.cuadreCaja.update({ where: { id: existente.id }, data: data as any });
      }
      return tx.cuadreCaja.create({
        data: { tenantId: user.tenantId, vendedorId: user.sub, ...data } as any,
      });
    });
  }

  /** Vista consolidada del administrador: cuadre de todos los vendedores en una fecha. */
  async resumenAdmin(user: JwtPayload, fecha?: string) {
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
