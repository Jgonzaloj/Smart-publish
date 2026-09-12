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
exports.AlternarEstadoDto = exports.CambiarPinDto = exports.CambiarPasswordDto = exports.ActualizarUsuarioDto = exports.CrearUsuarioDto = exports.RolUsuario = void 0;
const class_validator_1 = require("class-validator");
var RolUsuario;
(function (RolUsuario) {
    RolUsuario["ADMIN"] = "ADMIN";
    RolUsuario["VENDEDOR"] = "VENDEDOR";
})(RolUsuario || (exports.RolUsuario = RolUsuario = {}));
class CrearUsuarioDto {
}
exports.CrearUsuarioDto = CrearUsuarioDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre es obligatorio' }),
    __metadata("design:type", String)
], CrearUsuarioDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'El correo electrónico debe ser válido' }),
    __metadata("design:type", String)
], CrearUsuarioDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6, { message: 'La contraseña debe tener mínimo 6 caracteres' }),
    __metadata("design:type", String)
], CrearUsuarioDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(RolUsuario, { message: 'El rol debe ser ADMIN o VENDEDOR' }),
    __metadata("design:type", String)
], CrearUsuarioDto.prototype, "rol", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CrearUsuarioDto.prototype, "telefono", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CrearUsuarioDto.prototype, "posicion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CrearUsuarioDto.prototype, "pin", void 0);
class ActualizarUsuarioDto {
}
exports.ActualizarUsuarioDto = ActualizarUsuarioDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActualizarUsuarioDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActualizarUsuarioDto.prototype, "telefono", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActualizarUsuarioDto.prototype, "posicion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(RolUsuario, { message: 'El rol debe ser ADMIN o VENDEDOR' }),
    __metadata("design:type", String)
], ActualizarUsuarioDto.prototype, "rol", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ActualizarUsuarioDto.prototype, "activo", void 0);
class CambiarPasswordDto {
}
exports.CambiarPasswordDto = CambiarPasswordDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6, { message: 'La nueva contraseña debe tener mínimo 6 caracteres' }),
    __metadata("design:type", String)
], CambiarPasswordDto.prototype, "password", void 0);
class CambiarPinDto {
}
exports.CambiarPinDto = CambiarPinDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4, { message: 'El PIN debe tener mínimo 4 dígitos' }),
    __metadata("design:type", String)
], CambiarPinDto.prototype, "pin", void 0);
class AlternarEstadoDto {
}
exports.AlternarEstadoDto = AlternarEstadoDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AlternarEstadoDto.prototype, "activo", void 0);
//# sourceMappingURL=usuarios.dto.js.map