import { Router } from 'express';
import { ObservabilityController } from '../controllers/observability.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

export const observabilityRoutes = Router();

observabilityRoutes.use(authMiddleware, tenantMiddleware);

observabilityRoutes.get('/metrics', ObservabilityController.getMetrics);
