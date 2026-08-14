import { Router } from 'express';
import { getEngagement } from '../controllers/analytics.controller';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

const router = Router();

// Protegemos todas las rutas de este router con el tenant middleware
router.use(tenantMiddleware);

router.get('/overview', getEngagement);

export { router as analyticsRoutes };
