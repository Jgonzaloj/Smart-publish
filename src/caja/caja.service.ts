import { Injectable, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/jwt.strategy';
import { CrearMovimientoDto, RetiroCajaDto, CerrarCuadreDto } from './dto/caja.dto';

function toDecimal(val: any): Prisma.Decimal {
  if (val === null || val === undefined) return new Prisma.Decimal(0);
  if (val instanceof Prisma.Decimal) return val;
  return new Prisma.Decimal(val);
}

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
        const nuevoTotal = toDecimal(cuadreExistente.totalRetiros).plus(toDecimal(dto.valor));
        await tx.cuadreCaja.update({
          where: { id: cuadreExistente.id },
          data: { totalRetiros: nuevoTotal },
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

      const totalCobradoDec = abonosDia.reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new Prisma.Decimal(0));
      const recaudoEfectivoDec = abonosDia
        .filter((a: any) => !a.metodoPago || a.metodoPago === 'EFECTIVO')
        .reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new Prisma.Decimal(0));
      const recaudoTransferenciaDec = abonosDia
        .filter((a: any) => a.metodoPago && a.metodoPago !== 'EFECTIVO')
        .reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new Prisma.Decimal(0));

      const totalPrestadoNuevoDec = creditosNuevos.reduce((sum, c) => sum.plus(toDecimal(c.valorPrestamo)), new Prisma.Decimal(0));
      const totalIngresosDec = movimientos
        .filter((m) => m.tipo === 'INGRESO' && !(m as any).esSeguro)
        .reduce((s, m) => s.plus(toDecimal(m.valor)), new Prisma.Decimal(0));
      const totalEgresosDec = movimientos
        .filter((m) => m.tipo === 'EGRESO' && !(m as any).esSeguro)
        .reduce((s, m) => s.plus(toDecimal(m.valor)), new Prisma.Decimal(0));
      const ingresosSegurosDec = movimientos
        .filter((m) => m.tipo === 'INGRESO' && (m as any).esSeguro)
        .reduce((s, m) => s.plus(toDecimal(m.valor)), new Prisma.Decimal(0));
      const retirosSegurosDec = movimientos
        .filter((m) => m.tipo === 'EGRESO' && (m as any).esSeguro)
        .reduce((s, m) => s.plus(toDecimal(m.valor)), new Prisma.Decimal(0));

      const totalRetirosDec = toDecimal(cuadrePersistido?.totalRetiros);
      const cajaInicialDec = toDecimal((cuadrePersistido as any)?.cajaInicial);
      const cajaSegurosDec = ingresosSegurosDec.minus(retirosSegurosDec);

      const saldoEsperadoEnCajaDec = cajaInicialDec
        .plus(recaudoEfectivoDec)
        .plus(totalIngresosDec)
        .minus(totalPrestadoNuevoDec)
        .minus(totalEgresosDec)
        .minus(totalRetirosDec);

      return {
        fecha: inicio.toISOString().slice(0, 10),
        vendedorId: vendedorId ?? null,
        cajaInicial: cajaInicialDec.toNumber(),
        totalCobrado: totalCobradoDec.toNumber(),
        recaudoEfectivo: recaudoEfectivoDec.toNumber(),
        recaudoTransferencia: recaudoTransferenciaDec.toNumber(),
        totalPrestadoNuevo: totalPrestadoNuevoDec.toNumber(),
        totalIngresos: totalIngresosDec.toNumber(),
        totalEgresos: totalEgresosDec.toNumber(),
        totalRetiros: totalRetirosDec.toNumber(),
        ingresosSeguros: ingresosSegurosDec.toNumber(),
        retirosSeguros: retirosSegurosDec.toNumber(),
        cajaSeguros: cajaSegurosDec.toNumber(),
        saldoEsperadoEnCaja: saldoEsperadoEnCajaDec.toNumber(),
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

      const cajaInicialDec = toDecimal((cuadrePersistido as any)?.cajaInicial);
      const recaudoEsperadoDec = creditosActivos.reduce((s, c) => s.plus(toDecimal(c.valorCuota)), new Prisma.Decimal(0));
      const recaudoDiaDec = abonosDia.reduce((s, a) => s.plus(toDecimal(a.valorAbonado)), new Prisma.Decimal(0));
      
      const porcentajeRecaudo = recaudoEsperadoDec.gt(0)
        ? Number(recaudoDiaDec.dividedBy(recaudoEsperadoDec).times(100).toFixed(1))
        : 0;

      const efectivoDec = abonosDia
        .filter((a: any) => !a.metodoPago || a.metodoPago === 'EFECTIVO')
        .reduce((s, a) => s.plus(toDecimal(a.valorAbonado)), new Prisma.Decimal(0));
      const transferenciaDec = abonosDia
        .filter((a: any) => a.metodoPago && a.metodoPago !== 'EFECTIVO')
        .reduce((s, a) => s.plus(toDecimal(a.valorAbonado)), new Prisma.Decimal(0));

      const totalVentasDec = creditosNuevos.reduce((s, c) => s.plus(toDecimal(c.valorPrestamo)), new Prisma.Decimal(0));
      const retirosCajaDec = toDecimal(cuadrePersistido?.totalRetiros);
      const egresosDec = movimientos
        .filter((m) => m.tipo === 'EGRESO' && !(m as any).esSeguro)
        .reduce((s, m) => s.plus(toDecimal(m.valor)), new Prisma.Decimal(0));
      const ingresosDec = movimientos
        .filter((m) => m.tipo === 'INGRESO' && !(m as any).esSeguro)
        .reduce((s, m) => s.plus(toDecimal(m.valor)), new Prisma.Decimal(0));

      const ingresosSegurosDec = movimientos
        .filter((m) => m.tipo === 'INGRESO' && (m as any).esSeguro)
        .reduce((s, m) => s.plus(toDecimal(m.valor)), new Prisma.Decimal(0));
      const retiroCajaSegurosDec = movimientos
        .filter((m) => m.tipo === 'EGRESO' && (m as any).esSeguro)
        .reduce((s, m) => s.plus(toDecimal(m.valor)), new Prisma.Decimal(0));
      const cajaSegurosDec = ingresosSegurosDec.minus(retiroCajaSegurosDec);

      const saldoEnCajaDec = cajaInicialDec
        .plus(efectivoDec)
        .plus(ingresosDec)
        .minus(totalVentasDec)
        .minus(retirosCajaDec)
        .minus(egresosDec);

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
            valorCuota: toDecimal(cr.valorCuota).toNumber(),
            saldoActual: toDecimal(cr.saldoActual).toNumber(),
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
        cajaInicial: cajaInicialDec.toNumber(),
        recaudoEsperado: recaudoEsperadoDec.toNumber(),
        recaudoDia: recaudoDiaDec.toNumber(),
        porcentajeRecaudo,
        efectivo: efectivoDec.toNumber(),
        transferencia: transferenciaDec.toNumber(),
        totalVentas: totalVentasDec.toNumber(),
        retirosCaja: retirosCajaDec.toNumber(),
        egresos: egresosDec.toNumber(),
        ingresos: ingresosDec.toNumber(),
        retiroCajaSeguros: retiroCajaSegurosDec.toNumber(),
        ingresosSeguros: ingresosSegurosDec.toNumber(),
        cajaSeguros: cajaSegurosDec.toNumber(),
        saldoEnCaja: saldoEnCajaDec.toNumber(),
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

  /** Vista consolidada del administrador optimizada: consulta en una sola pasada para todos los vendedores (evita N+1). */
  async resumenAdmin(user: JwtPayload, fecha?: string) {
    const { inicio, fin } = this.rangoDia(fecha);

    return this.prisma.withTenant(user.tenantId, async (tx) => {
      const [vendedores, abonosTodos, creditosTodos, movimientosTodos, cuadresTodos] = await Promise.all([
        tx.usuario.findMany({ where: { rol: 'VENDEDOR', activo: true } }),
        tx.abono.findMany({ where: { fecha: { gte: inicio, lte: fin } } }),
        tx.credito.findMany({ where: { fechaInicio: { gte: inicio, lte: fin } } }),
        tx.movimientoCaja.findMany({ where: { fecha: { gte: inicio, lte: fin } } }),
        tx.cuadreCaja.findMany({ where: { fecha: { gte: inicio, lte: fin } } }),
      ]);

      return vendedores.map((v) => {
        const abonosVendedor = abonosTodos.filter((a) => a.usuarioId === v.id);
        const creditosVendedor = creditosTodos.filter((c) => c.vendedorId === v.id);
        const movimientosVendedor = movimientosTodos.filter((m) => m.vendedorId === v.id);
        const cuadreVendedor = cuadresTodos.find((c) => c.vendedorId === v.id);

        const totalCobradoDec = abonosVendedor.reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new Prisma.Decimal(0));
        const recaudoEfectivoDec = abonosVendedor
          .filter((a: any) => !a.metodoPago || a.metodoPago === 'EFECTIVO')
          .reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new Prisma.Decimal(0));
        const recaudoTransferenciaDec = abonosVendedor
          .filter((a: any) => a.metodoPago && a.metodoPago !== 'EFECTIVO')
          .reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new Prisma.Decimal(0));

        const totalPrestadoNuevoDec = creditosVendedor.reduce((sum, c) => sum.plus(toDecimal(c.valorPrestamo)), new Prisma.Decimal(0));
        const totalIngresosDec = movimientosVendedor
          .filter((m) => m.tipo === 'INGRESO' && !(m as any).esSeguro)
          .reduce((s, m) => s.plus(toDecimal(m.valor)), new Prisma.Decimal(0));
        const totalEgresosDec = movimientosVendedor
          .filter((m) => m.tipo === 'EGRESO' && !(m as any).esSeguro)
          .reduce((s, m) => s.plus(toDecimal(m.valor)), new Prisma.Decimal(0));
        const ingresosSegurosDec = movimientosVendedor
          .filter((m) => m.tipo === 'INGRESO' && (m as any).esSeguro)
          .reduce((s, m) => s.plus(toDecimal(m.valor)), new Prisma.Decimal(0));
        const retirosSegurosDec = movimientosVendedor
          .filter((m) => m.tipo === 'EGRESO' && (m as any).esSeguro)
          .reduce((s, m) => s.plus(toDecimal(m.valor)), new Prisma.Decimal(0));

        const totalRetirosDec = toDecimal(cuadreVendedor?.totalRetiros);
        const cajaInicialDec = toDecimal((cuadreVendedor as any)?.cajaInicial);
        const cajaSegurosDec = ingresosSegurosDec.minus(retirosSegurosDec);

        const saldoEsperadoEnCajaDec = cajaInicialDec
          .plus(recaudoEfectivoDec)
          .plus(totalIngresosDec)
          .minus(totalPrestadoNuevoDec)
          .minus(totalEgresosDec)
          .minus(totalRetirosDec);

        return {
          vendedor: { id: v.id, nombre: v.nombre },
          fecha: inicio.toISOString().slice(0, 10),
          vendedorId: v.id,
          cajaInicial: cajaInicialDec.toNumber(),
          totalCobrado: totalCobradoDec.toNumber(),
          recaudoEfectivo: recaudoEfectivoDec.toNumber(),
          recaudoTransferencia: recaudoTransferenciaDec.toNumber(),
          totalPrestadoNuevo: totalPrestadoNuevoDec.toNumber(),
          totalIngresos: totalIngresosDec.toNumber(),
          totalEgresos: totalEgresosDec.toNumber(),
          totalRetiros: totalRetirosDec.toNumber(),
          ingresosSeguros: ingresosSegurosDec.toNumber(),
          retirosSeguros: retirosSegurosDec.toNumber(),
          cajaSeguros: cajaSegurosDec.toNumber(),
          saldoEsperadoEnCaja: saldoEsperadoEnCajaDec.toNumber(),
          cerrado: !!cuadreVendedor?.observaciones,
        };
      });
    });
  }
}

