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
var MoraService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoraService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
let MoraService = MoraService_1 = class MoraService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(MoraService_1.name);
    }
    calcularAtraso(credito, fechaReferencia = new Date()) {
        const inicio = new Date(credito.fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        const ref = new Date(fechaReferencia);
        ref.setHours(0, 0, 0, 0);
        const msPorDia = 1000 * 60 * 60 * 24;
        const diasTranscurridos = Math.max(0, Math.floor((ref.getTime() - inicio.getTime()) / msPorDia));
        let cuotasEsperadas = 0;
        const forma = (credito.formaPago || 'diario').toLowerCase();
        if (forma === 'diario') {
            cuotasEsperadas = diasTranscurridos;
        }
        else if (forma === 'semanal') {
            cuotasEsperadas = Math.floor(diasTranscurridos / 7);
        }
        else if (forma === 'quincenal') {
            cuotasEsperadas = Math.floor(diasTranscurridos / 15);
        }
        else if (forma === 'mensual') {
            cuotasEsperadas = Math.floor(diasTranscurridos / 30);
        }
        else {
            cuotasEsperadas = diasTranscurridos;
        }
        const cuotasEsperadasClamped = Math.min(Math.max(0, cuotasEsperadas), credito.numeroCuotasTotal);
        let cuotasAtrasadas = Math.max(0, cuotasEsperadasClamped - credito.cuotasPagadas);
        const vencimiento = new Date(credito.fechaVencimiento);
        vencimiento.setHours(0, 0, 0, 0);
        const haVencido = ref.getTime() > vencimiento.getTime() && Number(credito.saldoActual) > 0;
        if (haVencido) {
            cuotasAtrasadas = Math.max(cuotasAtrasadas, credito.numeroCuotasTotal - credito.cuotasPagadas);
        }
        const estaEnMora = cuotasAtrasadas > 0 || haVencido;
        const nuevoEstado = estaEnMora ? 'EN_MORA' : 'ACTIVO';
        return {
            cuotasEsperadas: cuotasEsperadasClamped,
            cuotasAtrasadas,
            estaEnMora,
            nuevoEstado,
        };
    }
    async recalcularCreditoEnTx(tx, creditoId, tenantId, fechaReferencia = new Date()) {
        const credito = await tx.credito.findFirst({
            where: { id: creditoId, tenantId },
            include: { cliente: true },
        });
        if (!credito) {
            throw new Error(`Crédito no encontrado: ${creditoId}`);
        }
        const resultado = this.calcularAtraso(credito, fechaReferencia);
        if (credito.saldoActual <= 0) {
            await tx.credito.update({
                where: { id: creditoId },
                data: { estado: 'PAGADO' },
            });
            if (credito.cliente && credito.cliente.estadoVisita === 'ATRASADO') {
                await tx.cliente.update({
                    where: { id: credito.cliente.id },
                    data: { estadoVisita: 'AL_DIA' },
                });
            }
            return resultado;
        }
        if (credito.estado !== resultado.nuevoEstado) {
            await tx.credito.update({
                where: { id: creditoId },
                data: { estado: resultado.nuevoEstado },
            });
        }
        if (credito.cliente) {
            if (resultado.estaEnMora && credito.cliente.estadoVisita !== 'AUSENTE') {
                await tx.cliente.update({
                    where: { id: credito.cliente.id },
                    data: { estadoVisita: 'ATRASADO' },
                });
            }
            else if (!resultado.estaEnMora && credito.cliente.estadoVisita === 'ATRASADO') {
                await tx.cliente.update({
                    where: { id: credito.cliente.id },
                    data: { estadoVisita: 'AL_DIA' },
                });
            }
        }
        return resultado;
    }
    async ejecutarParaTenant(tenantId, fechaStr) {
        const fechaRef = fechaStr ? new Date(fechaStr + 'T00:00:00') : new Date();
        return this.prisma.withTenant(tenantId, async (tx) => {
            const creditos = await tx.credito.findMany({
                where: {
                    tenantId,
                    estado: { in: ['ACTIVO', 'EN_MORA'] },
                    saldoActual: { gt: 0 },
                },
                include: {
                    cliente: true,
                },
            });
            let pasanAEnMora = 0;
            let recuperadosAActivo = 0;
            let alDia = 0;
            const detalles = [];
            for (const c of creditos) {
                const calculo = this.calcularAtraso(c, fechaRef);
                const estadoAnterior = c.estado;
                if (c.estado !== calculo.nuevoEstado) {
                    await tx.credito.update({
                        where: { id: c.id },
                        data: { estado: calculo.nuevoEstado },
                    });
                    if (calculo.nuevoEstado === 'EN_MORA') {
                        pasanAEnMora++;
                    }
                    else {
                        recuperadosAActivo++;
                    }
                }
                else if (!calculo.estaEnMora) {
                    alDia++;
                }
                if (c.cliente) {
                    if (calculo.estaEnMora) {
                        if (c.cliente.estadoVisita !== 'ATRASADO') {
                            await tx.cliente.update({
                                where: { id: c.cliente.id },
                                data: { estadoVisita: 'ATRASADO' },
                            });
                        }
                    }
                    else {
                        if (c.cliente.estadoVisita === 'ATRASADO') {
                            await tx.cliente.update({
                                where: { id: c.cliente.id },
                                data: { estadoVisita: 'AL_DIA' },
                            });
                        }
                    }
                }
                detalles.push({
                    creditoId: c.id,
                    codigoCredito: c.codigoCredito,
                    clienteId: c.clienteId,
                    clienteNombre: c.cliente ? `${c.cliente.nombresAlias} ${c.cliente.apellidos || ''}`.trim() : 'N/A',
                    formaPago: c.formaPago,
                    cuotasEsperadas: calculo.cuotasEsperadas,
                    cuotasPagadas: c.cuotasPagadas,
                    cuotasAtrasadas: calculo.cuotasAtrasadas,
                    estadoAnterior,
                    nuevoEstado: calculo.nuevoEstado,
                    saldoActual: Number(c.saldoActual),
                });
            }
            return {
                tenantId,
                fechaReferencia: fechaRef.toISOString().split('T')[0],
                totalEvaluados: creditos.length,
                pasanAEnMora,
                recuperadosAActivo,
                alDia,
                detalles,
            };
        });
    }
    async ejecutarJobGlobal() {
        this.logger.log('Iniciando Job automático de Mora y Cuotas Atrasadas...');
        try {
            const tenants = await this.prisma.tenant.findMany({
                where: { activo: true },
                select: { id: true, nombreNegocio: true },
            });
            for (const tenant of tenants) {
                try {
                    const resultado = await this.ejecutarParaTenant(tenant.id);
                    this.logger.log(`Mora procesada para ${tenant.nombreNegocio} (${tenant.id}): ` +
                        `${resultado.totalEvaluados} evaluados, ${resultado.pasanAEnMora} en mora, ` +
                        `${resultado.recuperadosAActivo} recuperados, ${resultado.alDia} al día.`);
                    await this.prisma.withTenant(tenant.id, async (tx) => {
                        const clientesAusentes = await tx.cliente.findMany({
                            where: { tenantId: tenant.id, estadoVisita: 'AUSENTE' },
                            include: {
                                creditos: {
                                    where: { estado: { in: ['ACTIVO', 'EN_MORA'] } },
                                    take: 1,
                                },
                            },
                        });
                        for (const cl of clientesAusentes) {
                            const creditoActivo = cl.creditos[0];
                            const nuevoEstadoVisita = creditoActivo && creditoActivo.estado === 'EN_MORA'
                                ? 'ATRASADO'
                                : 'AL_DIA';
                            await tx.cliente.update({
                                where: { id: cl.id },
                                data: { estadoVisita: nuevoEstadoVisita },
                            });
                        }
                    });
                }
                catch (tenantErr) {
                    this.logger.error(`Error procesando mora para tenant ${tenant.id}:`, tenantErr);
                }
            }
            this.logger.log('Job de Mora completado con éxito.');
        }
        catch (err) {
            this.logger.error('Error general en Job automático de Mora:', err);
        }
    }
};
exports.MoraService = MoraService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MoraService.prototype, "ejecutarJobGlobal", null);
exports.MoraService = MoraService = MoraService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MoraService);
//# sourceMappingURL=mora.service.js.map