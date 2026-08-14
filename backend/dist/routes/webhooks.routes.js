"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhooksRoutes = void 0;
const express_1 = require("express");
const webhooks_controller_1 = require("../controllers/webhooks.controller");
exports.webhooksRoutes = (0, express_1.Router)();
// Rutas para Meta (Facebook)
exports.webhooksRoutes.get('/meta', webhooks_controller_1.WebhooksController.verifyMetaWebhook);
exports.webhooksRoutes.post('/meta', webhooks_controller_1.WebhooksController.handleMetaEvent);
// Rutas para WhatsApp (B2B2C AI)
exports.webhooksRoutes.get('/whatsapp', webhooks_controller_1.WebhooksController.verifyWhatsAppWebhook);
exports.webhooksRoutes.post('/whatsapp', webhooks_controller_1.WebhooksController.handleWhatsAppEvent);
