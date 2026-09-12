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
const prisma_service_1 = require("../prisma/prisma.service");
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
                await tx.cuadreCaja.update({
                    where: { id: cuadreExistente.id },
                    data: { totalRetiros: Number(cuadreExistente.totalRetiros) + dto.valor },
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
    async cerrarCuadre(dto, user) {
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
    async resumenAdmin(user, fecha) {
        const vendedores = await this.prisma.withTenant(user.tenantId, async (tx) => tx.usuario.findMany({ where: { rol: 'VENDEDOR', activo: true } }));
        const resultados = await Promise.all(vendedores.map(async (v) => {
            const resumen = await this.obtenerCuadreDia(user, fecha, v.id);
            return { vendedor: { id: v.id, nombre: v.nombre }, ...resumen };
        }));
        return resultados;
    }
};
exports.CajaService = CajaService;
exports.CajaService = CajaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CajaService);
//# sourceMappingURL=caja.service.js.map