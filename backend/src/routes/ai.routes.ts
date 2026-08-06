import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkAiUsageLimit } from '../middlewares/usage.middleware';

export const aiRoutes = Router();

// Endpoint para solicitar sugerencia a la IA
aiRoutes.post('/suggest', authMiddleware, checkAiUsageLimit, AiController.suggestPost);
