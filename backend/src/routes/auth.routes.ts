import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

export const authRoutes = Router();

authRoutes.post('/login', AuthController.login);
authRoutes.post('/register', AuthController.register);
authRoutes.post('/forgot-password', AuthController.forgotPassword);
authRoutes.post('/reset-password', AuthController.resetPassword);
