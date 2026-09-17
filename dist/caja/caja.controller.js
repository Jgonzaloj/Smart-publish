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
exports.CajaController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const caja_service_1 = require("./caja.service");
const caja_dto_1 = require("./dto/caja.dto");
let CajaController = class CajaController {
    constructor(cajaService) {
        this.cajaService = cajaService;
    }
    registrarMovimiento(dto, user) {
        return this.cajaService.registrarMovimiento(dto, user);
    }
    listarMovimientos(fecha, user) {
        return this.cajaService.listarMovimientos(user, fecha);
    }
    registrarRetiro(dto, user) {
        return this.cajaService.registrarRetiro(dto, user);
    }
    obtenerResumenDia(fecha, vendedorId, user) {
        return this.cajaService.obtenerResumenDia(user, fecha, vendedorId);
    }
    setCajaInicial(dto, user) {
        return this.cajaService.setCajaInicial(dto, user);
    }
    registrarMovimientoSeguro(dto, user) {
        return this.cajaService.registrarMovimientoSeguro(dto, user);
    }
    obtenerCuadreDia(fecha, user) {
        return this.cajaService.obtenerCuadreDia(user, fecha);
    }
    cerrarCuadre(dto, user) {
        return this.cajaService.cerrarCuadre(dto, user);
    }
    resumenAdmin(fecha, user) {
        return this.cajaService.resumenAdmin(user, fecha);
    }
};
exports.CajaController = CajaController;
__decorate([
    (0, common_1.Post)('movimientos'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [caja_dto_1.CrearMovimientoDto, Object]),
    __metadata("design:returntype", void 0)
], CajaController.prototype, "registrarMovimiento", null);
__decorate([
    (0, common_1.Get)('movimientos'),
    __param(0, (0, common_1.Query)('fecha')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CajaController.prototype, "listarMovimientos", null);
__decorate([
    (0, common_1.Post)('retiro'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [caja_dto_1.RetiroCajaDto, Object]),
    __metadata("design:returntype", void 0)
], CajaController.prototype, "registrarRetiro", null);
__decorate([
    (0, common_1.Get)('resumen-dia'),
    __param(0, (0, common_1.Query)('fecha')),
    __param(1, (0, common_1.Query)('vendedorId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], CajaController.prototype, "obtenerResumenDia", null);
__decorate([
    (0, common_1.Post)('caja-inicial'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [caja_dto_1.SetCajaInicialDto, Object]),
    __metadata("design:returntype", void 0)
], CajaController.prototype, "setCajaInicial", null);
__decorate([
    (0, common_1.Post)('movimiento-seguro'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [caja_dto_1.MovimientoSeguroDto, Object]),
    __metadata("design:returntype", void 0)
], CajaController.prototype, "registrarMovimientoSeguro", null);
__decorate([
    (0, common_1.Get)('cuadre/hoy'),
    __param(0, (0, common_1.Query)('fecha')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CajaController.prototype, "obtenerCuadreDia", null);
__decorate([
    (0, common_1.Post)('cuadre/cerrar'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [caja_dto_1.CerrarCuadreDto, Object]),
    __metadata("design:returntype", void 0)
], CajaController.prototype, "cerrarCuadre", null);
__decorate([
    (0, common_1.Get)('cuadre/resumen-admin'),
    (0, common_1.UseGuards)(roles_decorator_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Query)('fecha')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CajaController.prototype, "resumenAdmin", null);
exports.CajaController = CajaController = __decorate([
    (0, common_1.Controller)('caja'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [caja_service_1.CajaService])
], CajaController);
//# sourceMappingURL=caja.controller.js.map