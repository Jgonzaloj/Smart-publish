import { Router } from 'express';
import { AutomationController } from '../controllers/automation.controller';
import { CampaignController } from '../controllers/campaign.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';

export const automationRoutes = Router();

automationRoutes.post('/schedule', uploadMiddleware.single('image'), AutomationController.schedulePost);
automationRoutes.post('/cancel/:postId', AutomationController.cancelPost);
automationRoutes.post('/retry/:postId', AutomationController.retryPost);

// Rutas para campañas
automationRoutes.post('/campaigns', CampaignController.createCampaign);
automationRoutes.get('/campaigns', CampaignController.getCampaigns);
