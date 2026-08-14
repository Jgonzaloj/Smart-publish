"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const database_1 = require("../config/database");
const queue_service_1 = require("../services/queue.service");
const ai_service_1 = require("../services/ai.service");
const crypto_1 = __importDefault(require("crypto"));
const aiService = new ai_service_1.AiService();
exports.campaignWorker = new bullmq_1.Worker('campaignQueue', async (job) => {
    const { campaignId } = job.data;
    console.log(`[CampaignWorker] Procesando campaña ${campaignId}`);
    try {
        // 1. Obtener detalles de la campaña
        const [rows] = await database_1.pool.query('SELECT * FROM campaigns WHERE id = ? AND status = "ACTIVE"', [campaignId]);
        if (rows.length === 0) {
            console.log(`[CampaignWorker] Campaña ${campaignId} no encontrada o inactiva.`);
            return;
        }
        const campaign = rows[0];
        // 2. Generar contenido con IA (QA Loop Auto-Corrección - Fase 3)
        let generatedContent = '';
        let feedback = '';
        let approved = false;
        let attempts = 0;
        const maxAttempts = 3;
        while (!approved && attempts < maxAttempts) {
            attempts++;
            console.log(`[CampaignWorker] Generando post (Intento ${attempts})...`);
            generatedContent = await aiService.generateSocialMediaPost(campaign.topic, 'FACEBOOK', feedback);
            // QA Auditor
            const evaluation = await aiService.evaluatePost(generatedContent, campaign.topic);
            approved = evaluation.approved;
            feedback = evaluation.feedback;
            if (!approved) {
                console.log(`[QA Auditor] Post rechazado. Motivo: ${feedback}`);
            }
        }
        if (!approved) {
            console.warn(`[CampaignWorker] El post no pasó QA después de ${maxAttempts} intentos. Se publicará bajo revisión humana (DRAFT).`);
        }
        else {
            console.log(`[QA Auditor] Post APROBADO.`);
        }
        // 3. Generar / Buscar Imagen (Unsplash MVP)
        // Usaremos una URL por defecto de Unsplash basada en el topic
        const defaultImageUrl = `https://source.unsplash.com/random/800x800/?${encodeURIComponent(campaign.topic)}`;
        // 4. Crear registro del Post
        const postId = crypto_1.default.randomUUID();
        await database_1.pool.query(`INSERT INTO posts (id, workspace_id, user_id, content, status, media_url) 
                 VALUES (?, ?, ?, ?, ?, ?)`, [postId, campaign.workspace_id, 'system-ai', generatedContent, 'DRAFT', defaultImageUrl]);
        // 4.1 Crear registro del destino
        const destinationId = crypto_1.default.randomUUID();
        await database_1.pool.query(`INSERT INTO post_destinations (id, post_id, social_account_id, status)
                 VALUES (?, ?, ?, ?)`, [destinationId, postId, campaign.social_account_id, 'PENDING']);
        // QA GATE: Si no fue aprobado, se queda en DRAFT y NO se encola
        if (!approved) {
            console.log('[CampaignWorker] QA no superado. El post se guarda como DRAFT para revision humana.');
            return;
        }
        // 5. Encolar en BullMQ para publicar (delay 0)
        const bullJobId = await queue_service_1.QueueService.enqueuePost({
            postId,
            workspaceId: campaign.workspace_id,
            platform: 'FACEBOOK', // En MVP siempre publicamos a Facebook
            message: generatedContent,
            mediaUrl: defaultImageUrl,
            accountId: campaign.social_account_id
        });
        // 6. Actualizar Post a SCHEDULED
        await database_1.pool.query('UPDATE posts SET status = ?, bullmq_job_id = ? WHERE id = ?', ['SCHEDULED', bullJobId, postId]);
        console.log(`[CampaignWorker] Campaña ${campaignId} encoló el post ${postId}`);
    }
    catch (error) {
        console.error(`[CampaignWorker] Error en campaña ${campaignId}:`, error.message);
        throw error;
    }
}, { connection: redis_1.redisConnection });
exports.campaignWorker.on('completed', (job) => {
    console.log(`✅ [CampaignWorker] Trabajo de campaña completado!`);
});
exports.campaignWorker.on('failed', (job, err) => {
    console.log(`❌ [CampaignWorker] Trabajo de campaña falló con error: ${err.message}`);
});
