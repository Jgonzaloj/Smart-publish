"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRoutes = void 0;
const express_1 = require("express");
const ai_controller_1 = require("../controllers/ai.controller");
const knowledge_controller_1 = require("../controllers/knowledge.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const tenant_middleware_1 = require("../middlewares/tenant.middleware");
const usage_middleware_1 = require("../middlewares/usage.middleware");
exports.aiRoutes = (0, express_1.Router)();
// Endpoint para solicitar sugerencia a la IA
exports.aiRoutes.post('/suggest', auth_middleware_1.authMiddleware, usage_middleware_1.checkAiUsageLimit, ai_controller_1.AiController.suggestPost);
// Endpoint para generar imagen con IA
exports.aiRoutes.post('/image', auth_middleware_1.authMiddleware, ai_controller_1.AiController.generateImage);
// Endpoint RAG: Subir conocimiento para la empresa
exports.aiRoutes.post('/knowledge/upload', auth_middleware_1.authMiddleware, tenant_middleware_1.tenantMiddleware, knowledge_controller_1.KnowledgeController.uploadKnowledge);
