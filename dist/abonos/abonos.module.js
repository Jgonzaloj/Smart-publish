"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbonosModule = void 0;
const common_1 = require("@nestjs/common");
const abonos_controller_1 = require("./abonos.controller");
const abonos_service_1 = require("./abonos.service");
const prisma_module_1 = require("../prisma/prisma.module");
const mora_module_1 = require("../mora/mora.module");
let AbonosModule = class AbonosModule {
};
exports.AbonosModule = AbonosModule;
exports.AbonosModule = AbonosModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, mora_module_1.MoraModule],
        controllers: [abonos_controller_1.AbonosController],
        providers: [abonos_service_1.AbonosService],
        exports: [abonos_service_1.AbonosService],
    })
], AbonosModule);
//# sourceMappingURL=abonos.module.js.map