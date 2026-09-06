"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email('Formato de correo electrónico inválido'),
    password: zod_1.z.string().min(1, 'La contraseña es requerida')
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email('Formato de correo electrónico inválido'),
    password: zod_1.z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    name: zod_1.z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').optional()
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email('Formato de correo electrónico inválido')
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(10, 'Token de restablecimiento inválido'),
    newPassword: zod_1.z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
});
