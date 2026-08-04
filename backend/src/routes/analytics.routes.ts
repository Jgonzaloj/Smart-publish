import { Router } from 'express';
import { getEngagement } from '../controllers/analytics.controller';

const router = Router();

router.get('/overview', getEngagement);

export { router as analyticsRoutes };
