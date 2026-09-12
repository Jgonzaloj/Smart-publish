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
exports.ConsultaFechaDto = exports.CerrarCuadreDto = exports.RetiroCajaDto = exports.CrearMovimientoDto = void 0;
const class_validator_1 = require("class-validator");
class CrearMovimientoDto {
}
exports.CrearMovimientoDto = CrearMovimientoDto;
__decorate([
    (0, class_validator_1.IsIn)(['INGRESO', 'EGRESO']),
    __metadata("design:type", String)
], CrearMovimientoDto.prototype, "tipo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CrearMovimientoDto.prototype, "concepto", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], CrearMovimientoDto.prototype, "valor", void 0);
class RetiroCajaDto {
}
exports.RetiroCajaDto = RetiroCajaDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], RetiroCajaDto.prototype, "valor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RetiroCajaDto.prototype, "concepto", void 0);
class CerrarCuadreDto {
}
exports.CerrarCuadreDto = CerrarCuadreDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CerrarCuadreDto.prototype, "observaciones", void 0);
class ConsultaFechaDto {
}
exports.ConsultaFechaDto = ConsultaFechaDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ConsultaFechaDto.prototype, "fecha", void 0);
//# sourceMappingURL=caja.dto.js.map