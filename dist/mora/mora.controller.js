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
exports.MoraController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const mora_service_1 = require("./mora.service");
const mora_dto_1 = require("./dto/mora.dto");
let MoraController = class MoraController {
    constructor(moraService) {
        this.moraService = moraService;
    }
    ejecutarMora(dto, user) {
        return this.moraService.ejecutarParaTenant(user.tenantId, dto.fechaReferencia);
    }
};
exports.MoraController = MoraController;
__decorate([
    (0, common_1.Post)('ejecutar'),
    (0, common_1.UseGuards)(roles_decorator_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mora_dto_1.EjecutarMoraDto, Object]),
    __metadata("design:returntype", void 0)
], MoraController.prototype, "ejecutarMora", null);
exports.MoraController = MoraController = __decorate([
    (0, common_1.Controller)('mora'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [mora_service_1.MoraService])
], MoraController);
//# sourceMappingURL=mora.controller.js.map