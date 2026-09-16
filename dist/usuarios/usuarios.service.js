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
exports.UsuariosService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
const usuarios_dto_1 = require("./dto/usuarios.dto");
let UsuariosService = class UsuariosService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listar(user, filtroRol) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            const where = {};
            if (filtroRol) {
                where.rol = filtroRol;
            }
            const usuarios = await tx.usuario.findMany({
                where,
                select: {
                    id: true,
                    nombre: true,
                    email: true,
                    telefono: true,
                    rol: true,
                    posicion: true,
                    activo: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            const clientes = await tx.cliente.findMany({
                select: { id: true, vendedorId: true },
            });
            const creditos = await tx.credito.findMany({
                where: { estado: 'ACTIVO' },
                select: { id: true, vendedorId: true, saldoActual: true },
            });
            return usuarios.map((u) => {
                const misClientes = clientes.filter((c) => c.vendedorId === u.id);
                const misCreditos = creditos.filter((cr) => cr.vendedorId === u.id);
                const carteraActiva = misCreditos
                    .reduce((sum, cr) => sum.plus(new client_1.Prisma.Decimal(cr.saldoActual || 0)), new client_1.Prisma.Decimal(0))
                    .toNumber();
                return {
                    ...u,
                    totalClientes: misClientes.length,
                    creditosActivos: misCreditos.length,
                    carteraActiva,
                };
            });
        });
    }
    async obtenerPorId(id, user) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            const usuario = await tx.usuario.findFirst({
                where: { id, tenantId: user.tenantId },
                select: {
                    id: true,
                    nombre: true,
                    email: true,
                    telefono: true,
                    rol: true,
                    posicion: true,
                    activo: true,
                    createdAt: true,
                },
            });
            if (!usuario) {
                throw new common_1.NotFoundException('Usuario no encontrado');
            }
            return usuario;
        });
    }
    async crearUsuario(user, dto) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            const existente = await tx.usuario.findFirst({
                where: { email: dto.email.toLowerCase().trim() },
            });
            if (existente) {
                throw new common_1.ConflictException('Ya existe un usuario con este correo electrónico');
            }
            const passwordHash = await bcrypt.hash(dto.password, 10);
            const pinHash = dto.pin ? await bcrypt.hash(dto.pin, 10) : undefined;
            const nuevo = await tx.usuario.create({
                data: {
                    tenantId: user.tenantId,
                    nombre: dto.nombre.trim(),
                    email: dto.email.toLowerCase().trim(),
                    passwordHash,
                    pinHash,
                    rol: dto.rol,
                    telefono: dto.telefono?.trim() || null,
                    posicion: dto.posicion?.trim() || null,
                    activo: true,
                },
            });
            return {
                id: nuevo.id,
                nombre: nuevo.nombre,
                email: nuevo.email,
                rol: nuevo.rol,
                telefono: nuevo.telefono,
                posicion: nuevo.posicion,
                activo: nuevo.activo,
                createdAt: nuevo.createdAt,
            };
        });
    }
    async crearVendedor(user, nombre, email, password, posicion) {
        return this.crearUsuario(user, {
            nombre,
            email,
            password,
            rol: usuarios_dto_1.RolUsuario.VENDEDOR,
            posicion,
        });
    }
    async actualizarUsuario(id, user, dto) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            const actual = await tx.usuario.findFirst({
                where: { id, tenantId: user.tenantId },
            });
            if (!actual) {
                throw new common_1.NotFoundException('Usuario no encontrado');
            }
            if (actual.id === user.sub && dto.rol && dto.rol !== usuarios_dto_1.RolUsuario.ADMIN) {
                throw new common_1.BadRequestException('No puedes degradar tu propio rol de administrador');
            }
            return tx.usuario.update({
                where: { id },
                data: {
                    ...(dto.nombre ? { nombre: dto.nombre.trim() } : {}),
                    ...(dto.telefono !== undefined ? { telefono: dto.telefono ? dto.telefono.trim() : null } : {}),
                    ...(dto.posicion !== undefined ? { posicion: dto.posicion ? dto.posicion.trim() : null } : {}),
                    ...(dto.rol ? { rol: dto.rol } : {}),
                    ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
                },
                select: {
                    id: true,
                    nombre: true,
                    email: true,
                    telefono: true,
                    rol: true,
                    posicion: true,
                    activo: true,
                    createdAt: true,
                },
            });
        });
    }
    async alternarEstado(id, user, activo) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            if (id === user.sub && !activo) {
                throw new common_1.BadRequestException('No puedes desactivar tu propia cuenta de administrador');
            }
            const usuario = await tx.usuario.findFirst({
                where: { id, tenantId: user.tenantId },
            });
            if (!usuario) {
                throw new common_1.NotFoundException('Usuario no encontrado');
            }
            return tx.usuario.update({
                where: { id },
                data: { activo },
                select: { id: true, nombre: true, activo: true },
            });
        });
    }
    async desactivar(id, user) {
        return this.alternarEstado(id, user, false);
    }
    async cambiarPassword(id, user, nuevaClave) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            const usuario = await tx.usuario.findFirst({
                where: { id, tenantId: user.tenantId },
            });
            if (!usuario) {
                throw new common_1.NotFoundException('Usuario no encontrado');
            }
            const passwordHash = await bcrypt.hash(nuevaClave, 10);
            await tx.usuario.update({
                where: { id },
                data: { passwordHash },
            });
            return { mensaje: 'Contraseña actualizada exitosamente', usuarioId: id };
        });
    }
    async cambiarPin(id, user, nuevoPin) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            const usuario = await tx.usuario.findFirst({
                where: { id, tenantId: user.tenantId },
            });
            if (!usuario) {
                throw new common_1.NotFoundException('Usuario no encontrado');
            }
            const pinHash = await bcrypt.hash(nuevoPin, 10);
            await tx.usuario.update({
                where: { id },
                data: { pinHash },
            });
            return { mensaje: 'PIN actualizado exitosamente', usuarioId: id };
        });
    }
    async eliminarUsuario(id, user) {
        return this.prisma.withTenant(user.tenantId, async (tx) => {
            if (id === user.sub) {
                throw new common_1.BadRequestException('No puedes eliminar tu propia cuenta de administrador');
            }
            const usuario = await tx.usuario.findFirst({
                where: { id, tenantId: user.tenantId },
            });
            if (!usuario) {
                throw new common_1.NotFoundException('Usuario no encontrado');
            }
            const abonosCount = await tx.abono.count({ where: { usuarioId: id } });
            const creditosCount = await tx.credito.count({ where: { vendedorId: id } });
            if (abonosCount > 0 || creditosCount > 0) {
                throw new common_1.BadRequestException(`No se puede eliminar físicamente: tiene ${abonosCount} abono(s) y ${creditosCount} crédito(s) vinculados en el historial financiero. Utiliza el botón de desactivar (🚫) para revocar su acceso sin corromper la contabilidad.`);
            }
            await tx.usuario.delete({ where: { id } });
            return { mensaje: 'Usuario eliminado exitosamente', id };
        });
    }
};
exports.UsuariosService = UsuariosService;
exports.UsuariosService = UsuariosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsuariosService);
//# sourceMappingURL=usuarios.service.js.map