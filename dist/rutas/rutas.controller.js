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
exports.RutasController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const rutas_service_1 = require("./rutas.service");
const rutas_dto_1 = require("./dto/rutas.dto");
let RutasController = class RutasController {
    constructor(rutasService) {
        this.rutasService = rutasService;
    }
    obtenerRutaHoy(query, user) {
        return this.rutasService.obtenerRutaHoy(user, query);
    }
    marcarAusente(clienteId, dto, user) {
        return this.rutasService.marcarAusente(clienteId, user, dto);
    }
    cambiarEstadoVisita(clienteId, dto, user) {
        return this.rutasService.cambiarEstadoVisita(clienteId, dto, user);
    }
    guardarOrdenRuta(dto, user) {
        return this.rutasService.guardarOrdenRuta(dto, user);
    }
};
exports.RutasController = RutasController;
__decorate([
    (0, common_1.Get)('hoy'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rutas_dto_1.ConsultaRutaDto, Object]),
    __metadata("design:returntype", void 0)
], RutasController.prototype, "obtenerRutaHoy", null);
__decorate([
    (0, common_1.Patch)('clientes/:clienteId/ausente'),
    __param(0, (0, common_1.Param)('clienteId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rutas_dto_1.MarcarAusenteDto, Object]),
    __metadata("design:returntype", void 0)
], RutasController.prototype, "marcarAusente", null);
__decorate([
    (0, common_1.Patch)('clientes/:clienteId/estado'),
    __param(0, (0, common_1.Param)('clienteId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rutas_dto_1.CambiarEstadoVisitaDto, Object]),
    __metadata("design:returntype", void 0)
], RutasController.prototype, "cambiarEstadoVisita", null);
__decorate([
    (0, common_1.Put)('orden'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rutas_dto_1.ActualizarOrdenRutaDto, Object]),
    __metadata("design:returntype", void 0)
], RutasController.prototype, "guardarOrdenRuta", null);
exports.RutasController = RutasController = __decorate([
    (0, common_1.Controller)('rutas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [rutas_service_1.RutasService])
], RutasController);
//# sourceMappingURL=rutas.controller.js.map