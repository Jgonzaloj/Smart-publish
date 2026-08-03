import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';

export const aiRoutes = Router();

// Endpoint para solicitar sugerencia a la IA
aiRoutes.post('/suggest', AiController.suggestPost);
