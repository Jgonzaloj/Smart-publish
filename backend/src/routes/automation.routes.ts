import { Router } from 'express';
import { AutomationController } from '../controllers/automation.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';

export const automationRoutes = Router();

automationRoutes.post('/schedule', uploadMiddleware.single('image'), AutomationController.schedulePost);
automationRoutes.post('/cancel/:postId', AutomationController.cancelPost);
automationRoutes.post('/retry/:postId', AutomationController.retryPost);
