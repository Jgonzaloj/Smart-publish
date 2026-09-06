import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().trim().email('Formato de correo electrónico inválido'),
    password: z.string().min(1, 'La contraseña es requerida')
});

export const registerSchema = z.object({
    email: z.string().trim().email('Formato de correo electrónico inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').optional()
});

export const forgotPasswordSchema = z.object({
    email: z.string().trim().email('Formato de correo electrónico inválido')
});

export const resetPasswordSchema = z.object({
    token: z.string().min(10, 'Token de restablecimiento inválido'),
    newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
});
