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
exports.AbonosController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const abonos_service_1 = require("./abonos.service");
const crear_abono_dto_1 = require("./dto/crear-abono.dto");
let AbonosController = class AbonosController {
    constructor(abonosService) {
        this.abonosService = abonosService;
    }
    crear(dto, user) {
        return this.abonosService.crear(dto, user);
    }
    listarPorCredito(creditoId, user) {
        return this.abonosService.listarPorCredito(creditoId, user);
    }
    obtenerExtracto(creditoId, user) {
        return this.abonosService.obtenerExtractoCredito(creditoId, user);
    }
};
exports.AbonosController = AbonosController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [crear_abono_dto_1.CrearAbonoDto, Object]),
    __metadata("design:returntype", void 0)
], AbonosController.prototype, "crear", null);
__decorate([
    (0, common_1.Get)('credito/:creditoId'),
    __param(0, (0, common_1.Param)('creditoId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AbonosController.prototype, "listarPorCredito", null);
__decorate([
    (0, common_1.Get)('credito/:creditoId/extracto'),
    __param(0, (0, common_1.Param)('creditoId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AbonosController.prototype, "obtenerExtracto", null);
exports.AbonosController = AbonosController = __decorate([
    (0, common_1.Controller)('abonos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [abonos_service_1.AbonosService])
], AbonosController);
//# sourceMappingURL=abonos.controller.js.map