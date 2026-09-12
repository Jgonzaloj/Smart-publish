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
exports.RutasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const mora_service_1 = require("../mora/mora.service");
let RutasService = class RutasService {
    constructor(prisma, moraService) {
        this.prisma = prisma;
        this.moraService = moraService;
    }
    parsearRangoDia(fechaStr) {
        const d = fechaStr ? new Date(fechaStr + 'T00:00:00') : new Date();
        const inicioDia = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        const finDia = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        const fechaTexto = inicioDia.toISOString().split('T')[0];
        return { inicioDia, finDia, fechaTexto };
    }
    async obtenerRutaHoy(user, query) {
        const vendedorId = user.rol === 'VENDEDOR' ? user.sub : query.vendedorId || user.sub;
        const { inicioDia, finDia, fechaTexto } = this.parsearRangoDia(query.fecha);
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            const vendedor = await tx.usuario.findFirst({
                where: { id: vendedorId, tenantId: user.tenantId },
                select: { id: true, nombre: true },
            });
            if (!vendedor) {
                throw new common_1.NotFoundException('Vendedor no encontrado');
            }
            const ruta = await tx.ruta.findFirst({
                where: { tenantId: user.tenantId, vendedorId },
            });
            const ordenConfig = Array.isArray(ruta?.ordenVisitas)
                ? ruta.ordenVisitas
                : [];
            const clientes = await tx.cliente.findMany({
                where: {
                    tenantId: user.tenantId,
                    vendedorId,
                },
                include: {
                    creditos: {
                        where: {
                            estado: { in: ['ACTIVO', 'EN_MORA'] },
                            saldoActual: { gt: 0 },
                        },
                        orderBy: { fechaInicio: 'desc' },
                        take: 1,
                    },
                },
            });
            const creditosIds = clientes
                .flatMap((c) => c.creditos)
                .map((cr) => cr.id);
            const abonosHoy = creditosIds.length > 0
                ? await tx.abono.findMany({
                    where: {
                        tenantId: user.tenantId,
                        creditoId: { in: creditosIds },
                        fecha: { gte: inicioDia, lte: finDia },
                    },
                })
                : [];
            const mapaAbonosPorCredito = new Map();
            for (const abono of abonosHoy) {
                const actual = mapaAbonosPorCredito.get(abono.creditoId) || 0;
                mapaAbonosPorCredito.set(abono.creditoId, actual + Number(abono.valorAbonado));
            }
            const mapaOrden = new Map();
            ordenConfig.forEach((id, idx) => mapaOrden.set(id, idx));
            const items = [];
            let totalRecaudadoHoy = 0;
            let totalEsperadoHoy = 0;
            let cobradosHoy = 0;
            let ausentesHoy = 0;
            let atrasadosHoy = 0;
            for (const c of clientes) {
                const creditoActivo = c.creditos[0] || null;
                let creditoItem = null;
                let totalAbonadoHoy = 0;
                if (creditoActivo) {
                    totalAbonadoHoy = mapaAbonosPorCredito.get(creditoActivo.id) || 0;
                    totalRecaudadoHoy += totalAbonadoHoy;
                    totalEsperadoHoy += Number(creditoActivo.valorCuota);
                    const calculoMora = this.moraService.calcularAtraso(creditoActivo, inicioDia);
                    creditoItem = {
                        id: creditoActivo.id,
                        codigoCredito: creditoActivo.codigoCredito,
                        valorPrestamo: Number(creditoActivo.valorPrestamo),
                        valorCuota: Number(creditoActivo.valorCuota),
                        formaPago: creditoActivo.formaPago,
                        saldoActual: Number(creditoActivo.saldoActual),
                        cuotasTotal: creditoActivo.numeroCuotasTotal,
                        cuotasPagadas: creditoActivo.cuotasPagadas,
                        cuotasAtrasadas: calculoMora.cuotasAtrasadas,
                        estado: calculoMora.nuevoEstado,
                        fechaVencimiento: creditoActivo.fechaVencimiento,
                    };
                }
                const haPagadoHoy = totalAbonadoHoy > 0;
                if (haPagadoHoy)
                    cobradosHoy++;
                if (c.estadoVisita === 'AUSENTE')
                    ausentesHoy++;
                if (c.estadoVisita === 'ATRASADO' || (creditoItem && creditoItem.cuotasAtrasadas > 0)) {
                    atrasadosHoy++;
                }
                const ordenPos = mapaOrden.has(c.id) ? mapaOrden.get(c.id) : 999999;
                items.push({
                    clienteId: c.id,
                    nombresAlias: c.nombresAlias,
                    apellidos: c.apellidos,
                    documento: c.documento,
                    movil: c.movil,
                    telefono: c.telefono,
                    direccion: c.direccion,
                    estadoVisita: c.estadoVisita,
                    orden: ordenPos,
                    haPagadoHoy,
                    totalAbonadoHoy,
                    creditoActivo: creditoItem,
                });
            }
            items.sort((a, b) => a.orden - b.orden);
            items.forEach((item, index) => {
                item.orden = index + 1;
            });
            const totalClientes = items.length;
            const pendientesHoy = Math.max(0, totalClientes - cobradosHoy - ausentesHoy);
            return {
                vendedorId,
                vendedorNombre: vendedor.nombre,
                nombreRuta: ruta?.nombreRuta || 'Ruta Principal',
                fecha: fechaTexto,
                metricas: {
                    totalClientes,
                    clientesCobradosHoy: cobradosHoy,
                    clientesPendientesHoy: pendientesHoy,
                    clientesAusentesHoy: ausentesHoy,
                    clientesAtrasadosHoy: atrasadosHoy,
                    totalRecaudadoHoy: Number(totalRecaudadoHoy.toFixed(2)),
                    totalEsperadoHoy: Number(totalEsperadoHoy.toFixed(2)),
                },
                clientes: items,
            };
        });
    }
    async marcarAusente(clienteId, user, dto) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            const cliente = await tx.cliente.findFirst({
                where: { id: clienteId, tenantId: user.tenantId },
            });
            if (!cliente) {
                throw new common_1.NotFoundException('Cliente no encontrado');
            }
            if (user.rol === 'VENDEDOR' && cliente.vendedorId !== user.sub) {
                throw new common_1.ForbiddenException('No puedes marcar ausente a un cliente de otro vendedor');
            }
            const actualizado = await tx.cliente.update({
                where: { id: clienteId },
                data: {
                    estadoVisita: 'AUSENTE',
                },
            });
            return {
                message: 'Cliente marcado como AUSENTE para la visita de hoy',
                clienteId: actualizado.id,
                estadoVisita: actualizado.estadoVisita,
                observaciones: dto?.observaciones,
                latitud: dto?.latitud,
                longitud: dto?.longitud,
                precisionGps: dto?.precisionGps,
            };
        });
    }
    async cambiarEstadoVisita(clienteId, dto, user) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            const cliente = await tx.cliente.findFirst({
                where: { id: clienteId, tenantId: user.tenantId },
            });
            if (!cliente) {
                throw new common_1.NotFoundException('Cliente no encontrado');
            }
            if (user.rol === 'VENDEDOR' && cliente.vendedorId !== user.sub) {
                throw new common_1.ForbiddenException('No puedes modificar el estado de un cliente de otro vendedor');
            }
            const actualizado = await tx.cliente.update({
                where: { id: clienteId },
                data: {
                    estadoVisita: dto.estadoVisita,
                },
            });
            return {
                message: `Estado de visita actualizado a ${dto.estadoVisita}`,
                clienteId: actualizado.id,
                estadoVisita: actualizado.estadoVisita,
            };
        });
    }
    async guardarOrdenRuta(dto, user) {
        const vendedorId = user.rol === 'VENDEDOR' ? user.sub : dto.vendedorId || user.sub;
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            if (dto.ordenClienteIds.length > 0) {
                const clientesCount = await tx.cliente.count({
                    where: {
                        id: { in: dto.ordenClienteIds },
                        tenantId: user.tenantId,
                    },
                });
                if (clientesCount !== dto.ordenClienteIds.length) {
                    throw new common_1.BadRequestException('Algunos IDs de clientes son inválidos o no pertenecen a este negocio');
                }
            }
            const rutaExistente = await tx.ruta.findFirst({
                where: { tenantId: user.tenantId, vendedorId },
            });
            if (rutaExistente) {
                return tx.ruta.update({
                    where: { id: rutaExistente.id },
                    data: {
                        ordenVisitas: dto.ordenClienteIds,
                        nombreRuta: dto.nombreRuta || rutaExistente.nombreRuta,
                    },
                });
            }
            else {
                return tx.ruta.create({
                    data: {
                        tenantId: user.tenantId,
                        vendedorId,
                        nombreRuta: dto.nombreRuta || 'Ruta Principal',
                        ordenVisitas: dto.ordenClienteIds,
                    },
                });
            }
        });
    }
};
exports.RutasService = RutasService;
exports.RutasService = RutasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mora_service_1.MoraService])
], RutasService);
//# sourceMappingURL=rutas.service.js.map