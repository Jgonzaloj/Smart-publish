"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CajaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");

function toDecimal(val) {
    if (val === null || val === undefined) return new client_1.Prisma.Decimal(0);
    if (val instanceof client_1.Prisma.Decimal) return val;
    return new client_1.Prisma.Decimal(val);
}

let CajaService = class CajaService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    rangoDia(fecha) {
        const base = fecha ? new Date(fecha + 'T00:00:00') : new Date();
        const inicio = new Date(base);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(base);
        fin.setHours(23, 59, 59, 999);
        return { inicio, fin };
    }
    async registrarMovimiento(dto, user) {
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
    async listarMovimientos(user, fecha) {
        const { inicio, fin } = this.rangoDia(fecha);
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            const where = { fecha: { gte: inicio, lte: fin } };
            if (user.rol === 'VENDEDOR')
                where.vendedorId = user.sub;
            return tx.movimientoCaja.findMany({ where, orderBy: { fecha: 'desc' } });
        });
    }
    async registrarRetiro(dto, user) {
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
            }
            else {
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
    async obtenerCuadreDia(user, fecha, vendedorIdParam) {
        const { inicio, fin } = this.rangoDia(fecha);
        const vendedorId = user.rol === 'VENDEDOR' ? user.sub : vendedorIdParam;
        if (user.rol === 'VENDEDOR' && vendedorIdParam && vendedorIdParam !== user.sub) {
            throw new common_1.ForbiddenException('No puedes consultar el cuadre de otro vendedor');
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
            const totalCobradoDec = abonosDia.reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new client_1.Prisma.Decimal(0));
            const recaudoEfectivoDec = abonosDia
                .filter((a) => !a.metodoPago || a.metodoPago === 'EFECTIVO')
                .reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new client_1.Prisma.Decimal(0));
            const recaudoTransferenciaDec = abonosDia
                .filter((a) => a.metodoPago && a.metodoPago !== 'EFECTIVO')
                .reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new client_1.Prisma.Decimal(0));
            const totalPrestadoNuevoDec = creditosNuevos.reduce((sum, c) => sum.plus(toDecimal(c.valorPrestamo)), new client_1.Prisma.Decimal(0));
            const totalIngresosDec = movimientos
                .filter((m) => m.tipo === 'INGRESO' && !m.esSeguro)
                .reduce((s, m) => s.plus(toDecimal(m.valor)), new client_1.Prisma.Decimal(0));
            const totalEgresosDec = movimientos
                .filter((m) => m.tipo === 'EGRESO' && !m.esSeguro)
                .reduce((s, m) => s.plus(toDecimal(m.valor)), new client_1.Prisma.Decimal(0));
            const ingresosSegurosDec = movimientos
                .filter((m) => m.tipo === 'INGRESO' && m.esSeguro)
                .reduce((s, m) => s.plus(toDecimal(m.valor)), new client_1.Prisma.Decimal(0));
            const retirosSegurosDec = movimientos
                .filter((m) => m.tipo === 'EGRESO' && m.esSeguro)
                .reduce((s, m) => s.plus(toDecimal(m.valor)), new client_1.Prisma.Decimal(0));
            const totalRetirosDec = toDecimal(cuadrePersistido?.totalRetiros);
            const cajaInicialDec = toDecimal(cuadrePersistido?.cajaInicial);
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
    async obtenerResumenDia(user, fecha, vendedorIdParam) {
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
                if (v)
                    vendedorNombre = v.posicion ? `${v.nombre} (${v.posicion})` : v.nombre;
            }
            const [clientes, clientesNuevos, creditosActivos, creditosNuevos, abonosDia, movimientos, cuadrePersistido] = await Promise.all([
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
            const aplazadosSiguienteDia = clientes.filter((c) => c.estadoVisita === 'APLAZADO').length;
            const numeroClientes = clientes.length;
            const pagosEnRuta = abonosDia.filter((a) => !a.esAdicional).length;
            const pagosAdicionales = abonosDia.filter((a) => a.esAdicional).length;
            const cajaInicialDec = toDecimal(cuadrePersistido?.cajaInicial);
            const recaudoEsperadoDec = creditosActivos.reduce((s, c) => s.plus(toDecimal(c.valorCuota)), new client_1.Prisma.Decimal(0));
            const recaudoDiaDec = abonosDia.reduce((s, a) => s.plus(toDecimal(a.valorAbonado)), new client_1.Prisma.Decimal(0));
            const porcentajeRecaudo = recaudoEsperadoDec.gt(0)
                ? Number(recaudoDiaDec.dividedBy(recaudoEsperadoDec).times(100).toFixed(1))
                : 0;
            const efectivoDec = abonosDia
                .filter((a) => !a.metodoPago || a.metodoPago === 'EFECTIVO')
                .reduce((s, a) => s.plus(toDecimal(a.valorAbonado)), new client_1.Prisma.Decimal(0));
            const transferenciaDec = abonosDia
                .filter((a) => a.metodoPago && a.metodoPago !== 'EFECTIVO')
                .reduce((s, a) => s.plus(toDecimal(a.valorAbonado)), new client_1.Prisma.Decimal(0));
            const totalVentasDec = creditosNuevos.reduce((s, c) => s.plus(toDecimal(c.valorPrestamo)), new client_1.Prisma.Decimal(0));
            const retirosCajaDec = toDecimal(cuadrePersistido?.totalRetiros);
            const egresosDec = movimientos
                .filter((m) => m.tipo === 'EGRESO' && !m.esSeguro)
                .reduce((s, m) => s.plus(toDecimal(m.valor)), new client_1.Prisma.Decimal(0));
            const ingresosDec = movimientos
                .filter((m) => m.tipo === 'INGRESO' && !m.esSeguro)
                .reduce((s, m) => s.plus(toDecimal(m.valor)), new client_1.Prisma.Decimal(0));
            const ingresosSegurosDec = movimientos
                .filter((m) => m.tipo === 'INGRESO' && m.esSeguro)
                .reduce((s, m) => s.plus(toDecimal(m.valor)), new client_1.Prisma.Decimal(0));
            const retiroCajaSegurosDec = movimientos
                .filter((m) => m.tipo === 'EGRESO' && m.esSeguro)
                .reduce((s, m) => s.plus(toDecimal(m.valor)), new client_1.Prisma.Decimal(0));
            const cajaSegurosDec = ingresosSegurosDec.minus(retiroCajaSegurosDec);
            const saldoEnCajaDec = cajaInicialDec
                .plus(efectivoDec)
                .plus(ingresosDec)
                .minus(totalVentasDec)
                .minus(retirosCajaDec)
                .minus(egresosDec);
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
    async setCajaInicial(dto, user) {
        const { inicio, fin } = this.rangoDia(dto.fecha);
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            const existente = await tx.cuadreCaja.findFirst({
                where: { vendedorId: user.sub, fecha: { gte: inicio, lte: fin } },
            });
            if (existente) {
                return tx.cuadreCaja.update({
                    where: { id: existente.id },
                    data: { cajaInicial: dto.cajaInicial },
                });
            }
            return tx.cuadreCaja.create({
                data: {
                    tenantId: user.tenantId,
                    vendedorId: user.sub,
                    cajaInicial: dto.cajaInicial,
                },
            });
        });
    }
    async registrarMovimientoSeguro(dto, user) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            return tx.movimientoCaja.create({
                data: {
                    tenantId: user.tenantId,
                    vendedorId: user.sub,
                    tipo: dto.tipo,
                    concepto: dto.concepto || (dto.tipo === 'INGRESO' ? 'Ingreso de seguro' : 'Retiro de caja seguro'),
                    valor: dto.valor,
                    esSeguro: true,
                },
            });
        });
    }
    async cerrarCuadre(dto, user) {
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
                return tx.cuadreCaja.update({ where: { id: existente.id }, data });
            }
            return tx.cuadreCaja.create({
                data: { tenantId: user.tenantId, vendedorId: user.sub, ...data },
            });
        });
    }
    async resumenAdmin(user, fecha) {
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
                const totalCobradoDec = abonosVendedor.reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new client_1.Prisma.Decimal(0));
                const recaudoEfectivoDec = abonosVendedor
                    .filter((a) => !a.metodoPago || a.metodoPago === 'EFECTIVO')
                    .reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new client_1.Prisma.Decimal(0));
                const recaudoTransferenciaDec = abonosVendedor
                    .filter((a) => a.metodoPago && a.metodoPago !== 'EFECTIVO')
                    .reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new client_1.Prisma.Decimal(0));
                const totalPrestadoNuevoDec = creditosVendedor.reduce((sum, c) => sum.plus(toDecimal(c.valorPrestamo)), new client_1.Prisma.Decimal(0));
                const totalIngresosDec = movimientosVendedor
                    .filter((m) => m.tipo === 'INGRESO' && !m.esSeguro)
                    .reduce((s, m) => s.plus(toDecimal(m.valor)), new client_1.Prisma.Decimal(0));
                const totalEgresosDec = movimientosVendedor
                    .filter((m) => m.tipo === 'EGRESO' && !m.esSeguro)
                    .reduce((s, m) => s.plus(toDecimal(m.valor)), new client_1.Prisma.Decimal(0));
                const ingresosSegurosDec = movimientosVendedor
                    .filter((m) => m.tipo === 'INGRESO' && m.esSeguro)
                    .reduce((s, m) => s.plus(toDecimal(m.valor)), new client_1.Prisma.Decimal(0));
                const retirosSegurosDec = movimientosVendedor
                    .filter((m) => m.tipo === 'EGRESO' && m.esSeguro)
                    .reduce((s, m) => s.plus(toDecimal(m.valor)), new client_1.Prisma.Decimal(0));
                const totalRetirosDec = toDecimal(cuadreVendedor?.totalRetiros);
                const cajaInicialDec = toDecimal(cuadreVendedor?.cajaInicial);
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
};
exports.CajaService = CajaService;
exports.CajaService = CajaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CajaService);
//# sourceMappingURL=caja.service.js.map