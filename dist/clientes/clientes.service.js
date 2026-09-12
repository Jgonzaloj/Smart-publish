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
exports.ClientesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ClientesService = class ClientesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    generarCodigoCredito() {
        return Math.floor(1000000 + Math.random() * 8999999).toString();
    }
    calcularFechaVencimiento(formaPago, numeroCuotas) {
        const fecha = new Date();
        const dias = formaPago === 'diario' ? numeroCuotas : formaPago === 'semanal' ? numeroCuotas * 7 : numeroCuotas * 15;
        fecha.setDate(fecha.getDate() + dias);
        return fecha;
    }
    async crear(dto, user) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            const producto = await tx.productoCredito.findFirst({
                where: { id: dto.productoId, tenantId: user.tenantId },
            });
            if (!producto)
                throw new common_1.NotFoundException('Producto de crédito no encontrado');
            const valorConInteres = dto.valorPrestamo * (1 + dto.interes / 100);
            const valorCuota = Number((valorConInteres / dto.numeroCuotas).toFixed(2));
            const cliente = await tx.cliente.create({
                data: {
                    tenantId: user.tenantId,
                    vendedorId: user.sub,
                    documento: dto.documento,
                    nombresAlias: dto.nombresAlias,
                    apellidos: dto.apellidos,
                    movil: dto.movil,
                    telefono: dto.telefono,
                    direccion: dto.direccion,
                },
            });
            const credito = await tx.credito.create({
                data: {
                    tenantId: user.tenantId,
                    clienteId: cliente.id,
                    vendedorId: user.sub,
                    productoId: dto.productoId,
                    codigoCredito: this.generarCodigoCredito(),
                    valorPrestamo: dto.valorPrestamo,
                    valorCuota,
                    interes: dto.interes,
                    numeroCuotasTotal: dto.numeroCuotas,
                    formaPago: dto.formaPago,
                    saldoActual: valorConInteres,
                    fechaVencimiento: this.calcularFechaVencimiento(dto.formaPago, dto.numeroCuotas),
                },
            });
            if (dto.codeudorNombresAlias) {
                await tx.codeudor.create({
                    data: {
                        tenantId: user.tenantId,
                        creditoId: credito.id,
                        nombresAlias: dto.codeudorNombresAlias,
                        documento: dto.codeudorDocumento,
                        movil: dto.codeudorMovil,
                    },
                });
            }
            return { cliente, credito };
        });
    }
    async listar(user) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            const where = user.rol === 'VENDEDOR' ? { vendedorId: user.sub } : {};
            return tx.cliente.findMany({
                where,
                include: { creditos: { orderBy: { fechaInicio: 'desc' }, take: 1 } },
                orderBy: { createdAt: 'desc' },
            });
        });
    }
    async obtener(id, user) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            const cliente = await tx.cliente.findFirst({
                where: { id },
                include: { creditos: { include: { abonos: true, codeudores: true, seguro: true } } },
            });
            if (!cliente)
                throw new common_1.NotFoundException('Cliente no encontrado');
            if (user.rol === 'VENDEDOR' && cliente.vendedorId !== user.sub) {
                throw new common_1.ForbiddenException('No puedes ver clientes de otro vendedor');
            }
            return cliente;
        });
    }
    async renovarCredito(dto, user) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            const creditoAnterior = await tx.credito.findFirst({
                where: { id: dto.creditoAnteriorId, tenantId: user.tenantId },
                include: { cliente: true },
            });
            if (!creditoAnterior) {
                throw new common_1.NotFoundException('Crédito anterior a renovar no encontrado');
            }
            if (user.rol === 'VENDEDOR' && creditoAnterior.vendedorId !== user.sub) {
                throw new common_1.ForbiddenException('No puedes renovar créditos de otro vendedor');
            }
            if (['CANCELADO', 'RENOVADO'].includes(creditoAnterior.estado)) {
                throw new common_1.BadRequestException(`El crédito ya se encuentra en estado ${creditoAnterior.estado}`);
            }
            const saldoPendienteAnterior = Number(creditoAnterior.saldoActual);
            const descontar = dto.descontarSaldoAnterior !== false;
            if (descontar && dto.valorPrestamo < saldoPendienteAnterior) {
                throw new common_1.BadRequestException(`El valor del nuevo préstamo ($${dto.valorPrestamo}) no puede ser inferior al saldo a cancelar ($${saldoPendienteAnterior})`);
            }
            const netoEntregado = descontar
                ? Number((dto.valorPrestamo - saldoPendienteAnterior).toFixed(2))
                : dto.valorPrestamo;
            const valorConInteres = dto.valorPrestamo * (1 + dto.interes / 100);
            const valorCuota = Number((valorConInteres / dto.numeroCuotas).toFixed(2));
            await tx.credito.update({
                where: { id: creditoAnterior.id },
                data: {
                    saldoActual: 0,
                    estado: 'RENOVADO',
                },
            });
            if (saldoPendienteAnterior > 0) {
                await tx.abono.create({
                    data: {
                        tenantId: user.tenantId,
                        creditoId: creditoAnterior.id,
                        usuarioId: user.sub,
                        saldoAnterior: saldoPendienteAnterior,
                        valorAbonado: saldoPendienteAnterior,
                        saldoNuevo: 0,
                        numeroCuota: creditoAnterior.cuotasPagadas + 1,
                        cuotasAtrasadas: 0,
                    },
                });
            }
            const codigoNuevo = this.generarCodigoCredito();
            const creditoNuevo = await tx.credito.create({
                data: {
                    tenantId: user.tenantId,
                    clienteId: creditoAnterior.clienteId,
                    vendedorId: user.sub,
                    productoId: dto.productoId,
                    codigoCredito: codigoNuevo,
                    valorPrestamo: dto.valorPrestamo,
                    valorCuota,
                    interes: dto.interes,
                    numeroCuotasTotal: dto.numeroCuotas,
                    formaPago: dto.formaPago,
                    saldoActual: valorConInteres,
                    fechaVencimiento: this.calcularFechaVencimiento(dto.formaPago, dto.numeroCuotas),
                    estado: 'ACTIVO',
                    renovadoDeId: creditoAnterior.id,
                },
            });
            await tx.cliente.update({
                where: { id: creditoAnterior.clienteId },
                data: { estadoVisita: 'AL_DIA' },
            });
            if (netoEntregado > 0) {
                await tx.movimientoCaja.create({
                    data: {
                        tenantId: user.tenantId,
                        vendedorId: user.sub,
                        tipo: 'EGRESO',
                        concepto: `Desembolso neto renovación ${creditoAnterior.codigoCredito} -> ${codigoNuevo}`,
                        valor: netoEntregado,
                    },
                });
            }
            return {
                message: 'Crédito renovado exitosamente',
                creditoNuevo,
                creditoAnteriorId: creditoAnterior.id,
                saldoLiquidado: saldoPendienteAnterior,
                netoEntregadoCliente: netoEntregado,
            };
        });
    }
};
exports.ClientesService = ClientesService;
exports.ClientesService = ClientesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClientesService);
//# sourceMappingURL=clientes.service.js.map