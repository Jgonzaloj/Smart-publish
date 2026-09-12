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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuariosController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const usuarios_service_1 = require("./usuarios.service");
const usuarios_dto_1 = require("./dto/usuarios.dto");
let UsuariosController = class UsuariosController {
    constructor(usuariosService) {
        this.usuariosService = usuariosService;
    }
    listar(user, filtroRol) {
        return this.usuariosService.listar(user, filtroRol);
    }
    crearUsuario(dto, user) {
        return this.usuariosService.crearUsuario(user, dto);
    }
    obtenerPorId(id, user) {
        return this.usuariosService.obtenerPorId(id, user);
    }
    actualizar(id, dto, user) {
        return this.usuariosService.actualizarUsuario(id, user, dto);
    }
    alternarEstado(id, dto, user) {
        return this.usuariosService.alternarEstado(id, user, dto.activo);
    }
    cambiarPassword(id, dto, user) {
        return this.usuariosService.cambiarPassword(id, user, dto.password);
    }
    cambiarPin(id, dto, user) {
        return this.usuariosService.cambiarPin(id, user, dto.pin);
    }
    eliminarUsuario(id, user) {
        return this.usuariosService.eliminarUsuario(id, user);
    }
    crearVendedor(body, user) {
        return this.usuariosService.crearVendedor(user, body.nombre, body.email, body.password, body.posicion);
    }
    listarVendedores(user) {
        return this.usuariosService.listar(user, usuarios_dto_1.RolUsuario.VENDEDOR);
    }
    desactivar(id, user) {
        return this.usuariosService.desactivar(id, user);
    }
};
exports.UsuariosController = UsuariosController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('rol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuarios_dto_1.CrearUsuarioDto, Object]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "crearUsuario", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "obtenerPorId", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuarios_dto_1.ActualizarUsuarioDto, Object]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "actualizar", null);
__decorate([
    (0, common_1.Patch)(':id/estado'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuarios_dto_1.AlternarEstadoDto, Object]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "alternarEstado", null);
__decorate([
    (0, common_1.Patch)(':id/password'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuarios_dto_1.CambiarPasswordDto, Object]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "cambiarPassword", null);
__decorate([
    (0, common_1.Patch)(':id/pin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuarios_dto_1.CambiarPinDto, Object]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "cambiarPin", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "eliminarUsuario", null);
__decorate([
    (0, common_1.Post)('vendedores'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "crearVendedor", null);
__decorate([
    (0, common_1.Get)('vendedores'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "listarVendedores", null);
__decorate([
    (0, common_1.Patch)('vendedores/:id/desactivar'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "desactivar", null);
exports.UsuariosController = UsuariosController = __decorate([
    (0, common_1.Controller)('usuarios'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_decorator_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [usuarios_service_1.UsuariosService])
], UsuariosController);
//# sourceMappingURL=usuarios.controller.js.map