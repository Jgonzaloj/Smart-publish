"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const SocialAccountRepository_1 = require("../repositories/SocialAccountRepository");
const crypto_1 = __importDefault(require("crypto"));
const accountRepository = new SocialAccountRepository_1.SocialAccountRepository();
class WebhooksController {
    /**
     * Endpoint para validar el Webhook cuando Meta (Facebook) lo configura
     * GET /api/webhooks/meta
     */
    static verifyMetaWebhook(req, res) {
        const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'smart_publish_secure_token';
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        if (mode && token) {
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                console.log('✅ Webhook de Meta verificado correctamente');
                res.status(200).send(challenge);
            }
            else {
                res.sendStatus(403);
            }
        }
        else {
            res.sendStatus(400);
        }
    }
    /**
     * Endpoint para recibir los eventos de Meta
     * POST /api/webhooks/meta
     */
    static async handleMetaEvent(req, res) {
        const signature = req.headers['x-hub-signature-256'];
        // 1. (Opcional pero Recomendado) Validar la firma criptográfica usando FB_APP_SECRET
        if (signature) {
            const secret = process.env.FB_APP_SECRET || '';
            const payload = JSON.stringify(req.body);
            const expectedSignature = `sha256=${crypto_1.default.createHmac('sha256', secret).update(payload).digest('hex')}`;
            if (signature !== expectedSignature) {
                console.warn('⚠️ Firma de webhook inválida');
                return res.sendStatus(401);
            }
        }
        const body = req.body;
        if (body.object === 'page' || body.object === 'permissions') {
            // Recorrer las entradas del evento
            body.entry?.forEach(async (entry) => {
                const changes = entry.changes;
                // Si el usuario revocó el permiso de la App desde sus ajustes de Facebook
                // debemos marcar su cuenta como REVOCADA en la Base de Datos
                if (changes) {
                    for (const change of changes) {
                        if (change.field === 'permissions' && change.value?.verb === 'revoke') {
                            const platformAccountId = entry.uid || entry.id;
                            console.log(`[Webhook] Revocación detectada para Account ID: ${platformAccountId}`);
                            // Llamar al repositorio para marcar el status como 'REVOKED'
                            // Esto evita que intentemos publicar y tire errores en la cola
                            // await accountRepository.updateStatusByPlatformId('FACEBOOK', platformAccountId, 'REVOKED');
                        }
                    }
                }
            });
            res.status(200).send('EVENT_RECEIVED');
        }
        else {
            res.sendStatus(404);
        }
    }
    /**
     * Endpoint para validar el Webhook de WhatsApp
     * GET /api/webhooks/whatsapp
     */
    static verifyWhatsAppWebhook(req, res) {
        const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'smart_publish_whatsapp_token';
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        if (mode && token) {
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                console.log('✅ Webhook de WhatsApp verificado');
                res.status(200).send(challenge);
            }
            else {
                res.sendStatus(403);
            }
        }
        else {
            res.sendStatus(400);
        }
    }
    /**
     * Endpoint para recibir mensajes de WhatsApp (Webhook)
     * POST /api/webhooks/whatsapp
     */
    static async handleWhatsAppEvent(req, res) {
        try {
            const body = req.body;
            // 1. Extraer el número receptor para identificar el Tenant
            let receiverPhone = '';
            if (body.entry && body.entry[0] && body.entry[0].changes && body.entry[0].changes[0].value) {
                const metadata = body.entry[0].changes[0].value.metadata;
                receiverPhone = metadata?.display_phone_number || '';
            }
            if (!receiverPhone) {
                // Respondemos 200 para que Meta no reintente
                return res.status(200).send('EVENT_RECEIVED_NO_PHONE');
            }
            // 2. Resolución de Tenant (Workspace)
            // Asumimos que tienes un método en workspaceRepository para buscar por número de teléfono
            // Si no existe, usamos un mock por ahora o puedes agregarlo luego.
            // const workspace = await workspaceRepository.findByWhatsAppNumber(receiverPhone);
            const workspaceId = `tenant_${receiverPhone}`; // Sustituir por lógica real
            if (!workspaceId) {
                console.warn(`[Webhook WhatsApp] Número no registrado: ${receiverPhone}`);
                return res.status(200).send('EVENT_RECEIVED_NO_TENANT');
            }
            // 3. Encolar el evento y retornar 200 rápido
            await Promise.resolve().then(() => __importStar(require('../services/queue.service'))).then(m => m.WhatsAppQueueService.enqueueEvent(workspaceId, body));
            res.status(200).send('EVENT_RECEIVED');
        }
        catch (error) {
            console.error('[Webhook WhatsApp] Error:', error);
            res.status(500).send('ERROR');
        }
    }
}
exports.WebhooksController = WebhooksController;
