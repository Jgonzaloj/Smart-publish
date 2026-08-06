import { Router } from 'express';
import { AutomationController } from '../controllers/automation.controller';
import { CampaignController } from '../controllers/campaign.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkPostUsageLimit } from '../middlewares/usage.middleware';

export const automationRoutes = Router();

automationRoutes.post('/schedule', authMiddleware, checkPostUsageLimit, uploadMiddleware.single('image'), AutomationController.schedulePost);
automationRoutes.post('/cancel/:postId', authMiddleware, AutomationController.cancelPost);
automationRoutes.post('/retry/:postId', authMiddleware, checkPostUsageLimit, AutomationController.retryPost);

// Rutas para campañas
automationRoutes.post('/campaigns', authMiddleware, CampaignController.createCampaign);
automationRoutes.get('/campaigns', authMiddleware, CampaignController.getCampaigns);
