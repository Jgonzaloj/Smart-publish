import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/auth.schemas';

export const authRoutes = Router();

authRoutes.post('/login', validate(loginSchema), AuthController.login);
authRoutes.post('/register', validate(registerSchema), AuthController.register);
authRoutes.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
authRoutes.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);
