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
exports.ConsultaRutaDto = exports.CambiarEstadoVisitaDto = exports.MarcarAusenteDto = exports.ActualizarOrdenRutaDto = void 0;
const class_validator_1 = require("class-validator");
class ActualizarOrdenRutaDto {
}
exports.ActualizarOrdenRutaDto = ActualizarOrdenRutaDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ActualizarOrdenRutaDto.prototype, "ordenClienteIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActualizarOrdenRutaDto.prototype, "nombreRuta", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActualizarOrdenRutaDto.prototype, "vendedorId", void 0);
class MarcarAusenteDto {
}
exports.MarcarAusenteDto = MarcarAusenteDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarcarAusenteDto.prototype, "observaciones", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], MarcarAusenteDto.prototype, "latitud", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], MarcarAusenteDto.prototype, "longitud", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], MarcarAusenteDto.prototype, "precisionGps", void 0);
class CambiarEstadoVisitaDto {
}
exports.CambiarEstadoVisitaDto = CambiarEstadoVisitaDto;
__decorate([
    (0, class_validator_1.IsIn)(['AL_DIA', 'ATRASADO', 'AUSENTE']),
    __metadata("design:type", String)
], CambiarEstadoVisitaDto.prototype, "estadoVisita", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CambiarEstadoVisitaDto.prototype, "observaciones", void 0);
class ConsultaRutaDto {
}
exports.ConsultaRutaDto = ConsultaRutaDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConsultaRutaDto.prototype, "vendedorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ConsultaRutaDto.prototype, "fecha", void 0);
//# sourceMappingURL=rutas.dto.js.map