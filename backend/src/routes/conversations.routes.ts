import { Router } from 'express';
import { ConversationsController } from '../controllers/conversations.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

export const conversationsRoutes = Router();

conversationsRoutes.use(authMiddleware, tenantMiddleware);

conversationsRoutes.get('/', ConversationsController.getConversations);
conversationsRoutes.post('/:id/messages', ConversationsController.sendMessage);
conversationsRoutes.patch('/:id/ai-status', ConversationsController.toggleAiMode);
