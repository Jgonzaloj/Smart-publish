import { Router } from 'express';
import { SuperAdminController } from '../controllers/superadmin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { superAdminMiddleware } from '../middlewares/superadmin.middleware';

export const superAdminRoutes = Router();

// Apply auth first, then superadmin check
superAdminRoutes.use(authMiddleware);
superAdminRoutes.use(superAdminMiddleware);

superAdminRoutes.get('/dashboard', SuperAdminController.getDashboardData);
