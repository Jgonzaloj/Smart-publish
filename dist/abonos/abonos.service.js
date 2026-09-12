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
exports.AbonosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const mora_service_1 = require("../mora/mora.service");
let AbonosService = class AbonosService {
    constructor(prisma, moraService) {
        this.prisma = prisma;
        this.moraService = moraService;
    }
    async crear(dto, user) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            const credito = await tx.credito.findFirst({
                where: { id: dto.creditoId },
                include: { cliente: true },
            });
            if (!credito)
                throw new common_1.NotFoundException('Crédito no encontrado');
            if (user.rol === 'VENDEDOR' && credito.vendedorId !== user.sub) {
                throw new common_1.ForbiddenException('No puedes cobrar créditos de otro vendedor');
            }
            if (dto.valorAbonado > Number(credito.saldoActual)) {
                throw new common_1.BadRequestException('El abono no puede ser mayor al saldo pendiente');
            }
            const saldoAnterior = Number(credito.saldoActual);
            const saldoNuevo = Number((saldoAnterior - dto.valorAbonado).toFixed(2));
            const cuotasPagadas = credito.cuotasPagadas + 1;
            const quedaPagado = saldoNuevo <= 0;
            const calculoMora = this.moraService.calcularAtraso({
                ...credito,
                cuotasPagadas,
                saldoActual: saldoNuevo,
            }, new Date());
            const nuevoEstadoCredito = quedaPagado ? 'PAGADO' : calculoMora.nuevoEstado;
            const abono = await tx.abono.create({
                data: {
                    tenantId: user.tenantId,
                    creditoId: credito.id,
                    usuarioId: user.sub,
                    saldoAnterior,
                    valorAbonado: dto.valorAbonado,
                    saldoNuevo,
                    fecha: new Date(),
                    numeroCuota: cuotasPagadas,
                    cuotasAtrasadas: quedaPagado ? 0 : calculoMora.cuotasAtrasadas,
                    latitud: dto.latitud,
                    longitud: dto.longitud,
                    precisionGps: dto.precisionGps,
                },
            });
            await tx.credito.update({
                where: { id: credito.id },
                data: {
                    saldoActual: saldoNuevo,
                    cuotasPagadas,
                    estado: nuevoEstadoCredito,
                },
            });
            if (credito.cliente) {
                if (quedaPagado || !calculoMora.estaEnMora) {
                    if (credito.cliente.estadoVisita === 'ATRASADO') {
                        await tx.cliente.update({
                            where: { id: credito.cliente.id },
                            data: { estadoVisita: 'AL_DIA' },
                        });
                    }
                }
            }
            const recibo = {
                fecha: new Date().toISOString().slice(0, 10),
                hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
                usuario: user.nombre || 'Cobrador',
                documento: credito.cliente?.documento || '',
                cliente: `${credito.cliente?.nombresAlias || ''} ${credito.cliente?.apellidos || ''}`.trim(),
                movil: credito.cliente?.movil || '',
                tipoAbono: quedaPagado ? 'Liquidación total' : 'Abono normal',
                codigoCredito: credito.codigoCredito,
                saldoAnterior,
                valorAbonado: dto.valorAbonado,
                saldoNuevo,
                formaPago: credito.formaPago ? credito.formaPago.charAt(0).toUpperCase() + credito.formaPago.slice(1) : 'Diario',
                cuotasPagadas,
                numeroCuotasTotal: credito.numeroCuotasTotal,
                cuotasAtrasadas: quedaPagado ? 0 : calculoMora.cuotasAtrasadas,
                fechaVencimiento: credito.fechaVencimiento ? new Date(credito.fechaVencimiento).toISOString().slice(0, 10) : '',
                latitud: dto.latitud,
                longitud: dto.longitud,
                precisionGps: dto.precisionGps,
            };
            return {
                ...abono,
                recibo,
            };
        });
    }
    async listarPorCredito(creditoId, user) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            return tx.abono.findMany({ where: { creditoId }, orderBy: { fecha: 'desc' } });
        });
    }
    async obtenerExtractoCredito(creditoId, user) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            const credito = await tx.credito.findFirst({
                where: { id: creditoId },
                include: { cliente: true },
            });
            if (!credito) {
                throw new common_1.NotFoundException('Crédito no encontrado');
            }
            const cliente = credito.cliente || (await tx.cliente.findFirst({ where: { id: credito.clienteId } }));
            const abonos = await tx.abono.findMany({
                where: { creditoId },
                orderBy: { fecha: 'asc' },
            });
            const usuarios = await tx.usuario.findMany({
                select: { id: true, nombre: true },
            });
            const usuariosMap = new Map();
            usuarios.forEach((u) => usuariosMap.set(u.id, u.nombre));
            const totalAbonado = abonos.reduce((sum, a) => sum + Number(a.valorAbonado), 0);
            const totalPagar = Number(credito.valorPrestamo) * (1 + Number(credito.interes) / 100);
            const porcentajePagado = totalPagar > 0 ? Math.min(100, Math.round((totalAbonado / totalPagar) * 100)) : 0;
            const historialAbonos = abonos.map((a, idx) => {
                const rawDate = a.fecha || a.createdAt || new Date();
                const dateObj = new Date(rawDate);
                const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
                return {
                    numero: idx + 1,
                    id: a.id,
                    fecha: validDate.toISOString().slice(0, 10),
                    hora: validDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    valorAbonado: Number(a.valorAbonado),
                    saldoAnterior: Number(a.saldoAnterior),
                    saldoNuevo: Number(a.saldoNuevo),
                    cobrador: usuariosMap.get(a.usuarioId) || 'Cobrador',
                    latitud: a.latitud,
                    longitud: a.longitud,
                    precisionGps: a.precisionGps,
                };
            });
            const calculoMora = this.moraService.calcularAtraso(credito);
            return {
                cliente: {
                    id: cliente?.id,
                    nombre: `${cliente?.nombresAlias || ''} ${cliente?.apellidos || ''}`.trim(),
                    documento: cliente?.documento,
                    movil: cliente?.movil,
                    telefono: cliente?.telefono,
                    direccion: cliente?.direccion,
                },
                credito: {
                    id: credito.id,
                    codigoCredito: credito.codigoCredito,
                    valorPrestamo: Number(credito.valorPrestamo),
                    interes: Number(credito.interes),
                    totalPagar,
                    valorCuota: Number(credito.valorCuota),
                    formaPago: credito.formaPago,
                    cuotasTotal: credito.numeroCuotasTotal,
                    cuotasPagadas: credito.cuotasPagadas || abonos.length,
                    cuotasAtrasadas: calculoMora.cuotasAtrasadas,
                    saldoActual: Number(credito.saldoActual),
                    estado: credito.estado,
                    fechaInicio: credito.fechaInicio ? new Date(credito.fechaInicio).toISOString().slice(0, 10) : '',
                    fechaVencimiento: credito.fechaVencimiento ? new Date(credito.fechaVencimiento).toISOString().slice(0, 10) : '',
                },
                resumenAmortizacion: {
                    totalAbonado,
                    porcentajePagado,
                    saldoPendiente: Number(credito.saldoActual),
                    totalAbonosRegistrados: abonos.length,
                },
                historialAbonos,
            };
        });
    }
};
exports.AbonosService = AbonosService;
exports.AbonosService = AbonosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mora_service_1.MoraService])
], AbonosService);
//# sourceMappingURL=abonos.service.js.map