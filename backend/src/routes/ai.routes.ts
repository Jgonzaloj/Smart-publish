import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { KnowledgeController } from '../controllers/knowledge.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { tenantMiddleware } from '../middlewares/tenant.middleware';
import { checkAiUsageLimit } from '../middlewares/usage.middleware';

export const aiRoutes = Router();

// Endpoint para solicitar sugerencia a la IA
aiRoutes.post('/suggest', authMiddleware, checkAiUsageLimit, AiController.suggestPost);

// Endpoint para generar imagen con IA
aiRoutes.post('/image', authMiddleware, AiController.generateImage);

// Endpoint RAG: Subir conocimiento para la empresa
aiRoutes.post('/knowledge/upload', authMiddleware, tenantMiddleware, KnowledgeController.uploadKnowledge);
