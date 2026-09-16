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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const mora_service_1 = require("../mora/mora.service");

function toDecimal(val) {
    if (val === null || val === undefined) return new client_1.Prisma.Decimal(0);
    if (val instanceof client_1.Prisma.Decimal) return val;
    return new client_1.Prisma.Decimal(val);
}

let DashboardService = class DashboardService {
    constructor(prisma, moraService) {
        this.prisma = prisma;
        this.moraService = moraService;
    }
    async obtenerResumenEjecutivo(user) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            const now = new Date();
            const inicioHoy = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            const finHoy = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            const [creditos, abonos, usuarios, clientes] = await Promise.all([
                tx.credito.findMany({
                    include: { cliente: true },
                }),
                tx.abono.findMany({
                    orderBy: { fecha: 'desc' },
                }),
                tx.usuario.findMany({
                    where: { rol: 'VENDEDOR' },
                }),
                tx.cliente.findMany(),
            ]);
            const creditosActivos = creditos.filter((c) => c.estado === 'ACTIVO' || c.estado === 'EN_MORA');
            const totalPrestadoHistoricoDec = creditos.reduce((sum, c) => sum.plus(toDecimal(c.valorPrestamo)), new client_1.Prisma.Decimal(0));
            const totalRecuperadoHistoricoDec = abonos.reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new client_1.Prisma.Decimal(0));
            const carteraActivaTotalDec = creditosActivos.reduce((sum, c) => sum.plus(toDecimal(c.saldoActual)), new client_1.Prisma.Decimal(0));
            const abonosHoy = abonos.filter((a) => {
                const raw = a.fecha || a.createdAt;
                if (!raw)
                    return false;
                const f = new Date(raw);
                return !isNaN(f.getTime()) && f >= inicioHoy && f <= finHoy;
            });
            const totalCobradoHoyDec = abonosHoy.reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new client_1.Prisma.Decimal(0));
            const totalEsperadoHoyDec = creditosActivos.reduce((sum, c) => sum.plus(toDecimal(c.valorCuota)), new client_1.Prisma.Decimal(0));
            const porcentajeCumplimientoHoy = totalEsperadoHoyDec.gt(0)
                ? Math.min(100, Math.round(totalCobradoHoyDec.dividedBy(totalEsperadoHoyDec).times(100).toNumber()))
                : 0;
            let saldoPar30Dec = new client_1.Prisma.Decimal(0);
            let saldoPar60Dec = new client_1.Prisma.Decimal(0);
            let creditosAlDia = 0;
            let creditosEnAtraso = 0;
            let creditosEnMoraSevera = 0;
            creditosActivos.forEach((c) => {
                const calculoMora = this.moraService.calcularAtraso(c);
                const atrasadas = calculoMora.cuotasAtrasadas;
                const saldoDec = toDecimal(c.saldoActual);
                if (atrasadas === 0) {
                    creditosAlDia++;
                }
                else if (atrasadas < 30) {
                    creditosEnAtraso++;
                }
                else if (atrasadas >= 30 && atrasadas < 60) {
                    creditosEnMoraSevera++;
                    saldoPar30Dec = saldoPar30Dec.plus(saldoDec);
                }
                else if (atrasadas >= 60) {
                    creditosEnMoraSevera++;
                    saldoPar30Dec = saldoPar30Dec.plus(saldoDec);
                    saldoPar60Dec = saldoPar60Dec.plus(saldoDec);
                }
            });
            const porcentajePar30 = carteraActivaTotalDec.gt(0)
                ? Number(saldoPar30Dec.dividedBy(carteraActivaTotalDec).times(100).toFixed(2))
                : 0;
            const porcentajePar60 = carteraActivaTotalDec.gt(0)
                ? Number(saldoPar60Dec.dividedBy(carteraActivaTotalDec).times(100).toFixed(2))
                : 0;
            const ultimos7Dias = [];
            const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const inicioDia = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
                const finDia = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
                const abonosDelDia = abonos.filter((a) => {
                    const raw = a.fecha || a.createdAt;
                    if (!raw)
                        return false;
                    const fa = new Date(raw);
                    return !isNaN(fa.getTime()) && fa >= inicioDia && fa <= finDia;
                });
                const totalDiaDec = abonosDelDia.reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new client_1.Prisma.Decimal(0));
                const fechaStr = inicioDia.toISOString().slice(0, 10);
                const diaNombre = diasSemana[inicioDia.getDay()];
                ultimos7Dias.push({
                    fecha: fechaStr,
                    dia: `${diaNombre} ${inicioDia.getDate()}`,
                    total: totalDiaDec.toNumber(),
                    abonosCount: abonosDelDia.length,
                });
            }
            const rankingCobradores = usuarios.map((u) => {
                const clientesCobrador = clientes.filter((cl) => cl.vendedorId === u.id);
                const creditosCobrador = creditosActivos.filter((cr) => cr.vendedorId === u.id);
                const carteraCobradorDec = creditosCobrador.reduce((sum, cr) => sum.plus(toDecimal(cr.saldoActual)), new client_1.Prisma.Decimal(0));
                const abonosCobradorHoy = abonosHoy.filter((a) => a.usuarioId === u.id);
                const cobradoHoyDec = abonosCobradorHoy.reduce((sum, a) => sum.plus(toDecimal(a.valorAbonado)), new client_1.Prisma.Decimal(0));
                const esperadoCobradorHoyDec = creditosCobrador.reduce((sum, cr) => sum.plus(toDecimal(cr.valorCuota)), new client_1.Prisma.Decimal(0));
                const efectividad = esperadoCobradorHoyDec.gt(0)
                    ? Math.min(100, Math.round(cobradoHoyDec.dividedBy(esperadoCobradorHoyDec).times(100).toNumber()))
                    : 0;
                return {
                    id: u.id,
                    nombre: u.nombre,
                    posicion: u.posicion || 'Ruta General',
                    totalClientes: clientesCobrador.length,
                    creditosActivos: creditosCobrador.length,
                    carteraTotal: carteraCobradorDec.toNumber(),
                    cobradoHoy: cobradoHoyDec.toNumber(),
                    efectividad,
                    activo: u.activo,
                };
            });
            rankingCobradores.sort((a, b) => b.cobradoHoy - a.cobradoHoy);
            return {
                financiero: {
                    totalPrestadoHistorico: totalPrestadoHistoricoDec.toNumber(),
                    totalRecuperadoHistorico: totalRecuperadoHistoricoDec.toNumber(),
                    carteraActivaTotal: carteraActivaTotalDec.toNumber(),
                    totalCobradoHoy: totalCobradoHoyDec.toNumber(),
                    totalEsperadoHoy: totalEsperadoHoyDec.toNumber(),
                    porcentajeCumplimientoHoy,
                    clientesTotal: clientes.length,
                    creditosActivosTotal: creditosActivos.length,
                },
                riesgo: {
                    saldoPar30: saldoPar30Dec.toNumber(),
                    porcentajePar30,
                    saldoPar60: saldoPar60Dec.toNumber(),
                    porcentajePar60,
                    creditosAlDia,
                    creditosEnAtraso,
                    creditosEnMoraSevera,
                },
                ultimos7Dias,
                rankingCobradores,
            };
        });
    }
};
DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, mora_service_1.MoraService])
], DashboardService);
exports.DashboardService = DashboardService;
//# sourceMappingURL=dashboard.service.js.map