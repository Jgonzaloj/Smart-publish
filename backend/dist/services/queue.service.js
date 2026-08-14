"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppQueueService = exports.whatsappQueue = exports.CampaignQueueService = exports.campaignQueue = exports.QueueService = exports.publishQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
// Definimos la cola para publicaciones
exports.publishQueue = new bullmq_1.Queue('publishQueue', { connection: redis_1.redisConnection });
class QueueService {
    /**
     * Encola un post para ser publicado
     * @returns ID del Job en BullMQ
     */
    static async enqueuePost(data, delayMs = 0) {
        const job = await exports.publishQueue.add('publish-post', data, {
            delay: delayMs,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000
            }
        });
        console.log(`[QueueService] Post ${data.postId} encolado. Job ID: ${job.id} (Delay: ${delayMs}ms)`);
        return job.id;
    }
    /**
     * Elimina un Job de la cola (Útil para Cancelar o Editar)
     */
    static async removeJob(jobId) {
        const job = await exports.publishQueue.getJob(jobId);
        if (job) {
            await job.remove();
            console.log(`[QueueService] Job ${jobId} eliminado exitosamente.`);
            return true;
        }
        console.log(`[QueueService] Job ${jobId} no encontrado (probablemente ya ejecutado).`);
        return false;
    }
    /**
     * Pausa el procesamiento de TODA la cola
     */
    static async pauseQueue() {
        await exports.publishQueue.pause();
        console.log(`[QueueService] Cola de publicaciones PAUSADA.`);
    }
    /**
     * Reanuda el procesamiento de la cola
     */
    static async resumeQueue() {
        await exports.publishQueue.resume();
        console.log(`[QueueService] Cola de publicaciones REANUDADA.`);
    }
}
exports.QueueService = QueueService;
// Cola para campañas recurrentes
exports.campaignQueue = new bullmq_1.Queue('campaignQueue', { connection: redis_1.redisConnection });
class CampaignQueueService {
    static async scheduleCampaign(campaignId, cron) {
        await exports.campaignQueue.add('run-campaign', { campaignId }, {
            repeat: { pattern: cron, tz: 'America/Lima' },
            jobId: `campaign-${campaignId}` // ID único para evitar duplicados y facilitar eliminación
        });
        console.log(`[CampaignQueueService] Campaña ${campaignId} programada con cron: ${cron}`);
    }
    static async removeCampaign(campaignId) {
        // TODO: Migrar a la API de BullMQ v6 para repeatable jobs
        console.log(`[CampaignQueueService] TODO: Eliminar campaña ${campaignId} del programador.`);
    }
}
exports.CampaignQueueService = CampaignQueueService;
// --- NUEVO: Cola para Webhook de WhatsApp ---
exports.whatsappQueue = new bullmq_1.Queue('whatsappQueue', { connection: redis_1.redisConnection });
class WhatsAppQueueService {
    /**
     * Encola un evento de WhatsApp para ser procesado asíncronamente
     */
    static async enqueueEvent(workspaceId, payload) {
        const job = await exports.whatsappQueue.add('process-whatsapp-event', { workspaceId, payload }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 }
        });
        console.log(`[WhatsAppQueue] Evento encolado para workspace ${workspaceId}. Job ID: ${job.id}`);
        return job.id;
    }
}
exports.WhatsAppQueueService = WhatsAppQueueService;
