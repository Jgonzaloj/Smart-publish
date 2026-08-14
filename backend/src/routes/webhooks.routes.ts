import { Router } from 'express';
import { WebhooksController } from '../controllers/webhooks.controller';

export const webhooksRoutes = Router();

// Rutas para Meta (Facebook)
webhooksRoutes.get('/meta', WebhooksController.verifyMetaWebhook);
webhooksRoutes.post('/meta', WebhooksController.handleMetaEvent);

// Rutas para WhatsApp (B2B2C AI)
webhooksRoutes.get('/whatsapp', WebhooksController.verifyWhatsAppWebhook);
webhooksRoutes.post('/whatsapp', WebhooksController.handleWhatsAppEvent);
