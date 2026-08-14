import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

// Definimos la cola para publicaciones
export const publishQueue = new Queue('publishQueue', { connection: redisConnection });

// Interfaz para el payload de la cola
export interface PublishJobData {
    postId: string;
    workspaceId: string;
    platform: 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK';
    message: string;
    mediaUrl?: string;
    accountId?: string;
}

export class QueueService {
    /**
     * Encola un post para ser publicado
     * @returns ID del Job en BullMQ
     */
    static async enqueuePost(data: PublishJobData, delayMs: number = 0): Promise<string> {
        const job = await publishQueue.add('publish-post', data, {
            delay: delayMs,
            attempts: 3, 
            backoff: {
                type: 'exponential',
                delay: 5000 
            }
        });
        console.log(`[QueueService] Post ${data.postId} encolado. Job ID: ${job.id} (Delay: ${delayMs}ms)`);
        return job.id!;
    }

    /**
     * Elimina un Job de la cola (Útil para Cancelar o Editar)
     */
    static async removeJob(jobId: string): Promise<boolean> {
        const job = await publishQueue.getJob(jobId);
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
    static async pauseQueue(): Promise<void> {
        await publishQueue.pause();
        console.log(`[QueueService] Cola de publicaciones PAUSADA.`);
    }

    /**
     * Reanuda el procesamiento de la cola
     */
    static async resumeQueue(): Promise<void> {
        await publishQueue.resume();
        console.log(`[QueueService] Cola de publicaciones REANUDADA.`);
    }
}

// Cola para campañas recurrentes
export const campaignQueue = new Queue('campaignQueue', { connection: redisConnection });

export class CampaignQueueService {
    static async scheduleCampaign(campaignId: string, cron: string): Promise<void> {
        await campaignQueue.add('run-campaign', { campaignId }, {
            repeat: { pattern: cron, tz: 'America/Lima' },
            jobId: `campaign-${campaignId}` // ID único para evitar duplicados y facilitar eliminación
        } as any);
        console.log(`[CampaignQueueService] Campaña ${campaignId} programada con cron: ${cron}`);
    }

    static async removeCampaign(campaignId: string): Promise<void> {
        // TODO: Migrar a la API de BullMQ v6 para repeatable jobs
        console.log(`[CampaignQueueService] TODO: Eliminar campaña ${campaignId} del programador.`);
    }
}

// --- NUEVO: Cola para Webhook de WhatsApp ---
export const whatsappQueue = new Queue('whatsappQueue', { connection: redisConnection });

export class WhatsAppQueueService {
    /**
     * Encola un evento de WhatsApp para ser procesado asíncronamente
     */
    static async enqueueEvent(workspaceId: string, payload: any): Promise<string> {
        const job = await whatsappQueue.add('process-whatsapp-event', { workspaceId, payload }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 }
        });
        console.log(`[WhatsAppQueue] Evento encolado para workspace ${workspaceId}. Job ID: ${job.id}`);
        return job.id!;
    }
}
