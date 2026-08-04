import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';
import { QueueService } from '../services/queue.service';

export interface CampaignData {
    campaignId: string;
}

export const campaignWorker = new Worker(
    'campaignQueue',
    async (job: Job<CampaignData>) => {
        const { campaignId } = job.data;
        console.log(`[CampaignWorker] Procesando campaña ${campaignId}`);

        try {
            // 1. Obtener detalles de la campaña
            const [rows] = await pool.query<RowDataPacket[]>(
                'SELECT * FROM campaigns WHERE id = ? AND status = "ACTIVE"',
                [campaignId]
            );

            if (rows.length === 0) {
                console.log(`[CampaignWorker] Campaña ${campaignId} no encontrada o inactiva.`);
                return;
            }

            const campaign = rows[0];

            // 2. Generar contenido con IA (Gemini MVP)
            // Aqui conectaríamos con el AI Service para generar el post basado en campaign.topic
            const generatedContent = `¡Publicación automática de IA sobre ${campaign.topic}!\n\nEste es un mensaje autogenerado por el Piloto Automático de Smart Publish. 🚀`;

            // 3. Generar / Buscar Imagen (Unsplash MVP)
            // Usaremos una URL por defecto de Unsplash basada en el topic
            const defaultImageUrl = `https://source.unsplash.com/random/800x800/?${encodeURIComponent(campaign.topic)}`;

            // 4. Crear registro del Post
            const postId = crypto.randomUUID();
            await pool.query(
                `INSERT INTO posts (id, workspace_id, user_id, content, status, media_url) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [postId, campaign.workspace_id, 'system-ai', generatedContent, 'DRAFT', defaultImageUrl]
            );

            // 5. Encolar en BullMQ para publicar (delay 0)
            const bullJobId = await QueueService.enqueuePost({
                postId,
                workspaceId: campaign.workspace_id,
                platform: 'FACEBOOK', // En MVP siempre publicamos a Facebook
                message: generatedContent,
                mediaUrl: defaultImageUrl,
                accountId: campaign.social_account_id
            });

            // 6. Actualizar Post a SCHEDULED
            await pool.query('UPDATE posts SET status = ?, bullmq_job_id = ? WHERE id = ?', 
                ['SCHEDULED', bullJobId, postId]);

            console.log(`[CampaignWorker] Campaña ${campaignId} encoló el post ${postId}`);
            
        } catch (error: any) {
            console.error(`[CampaignWorker] Error en campaña ${campaignId}:`, error.message);
            throw error; 
        }
    },
    { connection: redisConnection }
);

campaignWorker.on('completed', (job) => {
    console.log(`✅ [CampaignWorker] Trabajo de campaña completado!`);
});

campaignWorker.on('failed', (job, err) => {
    console.log(`❌ [CampaignWorker] Trabajo de campaña falló con error: ${err.message}`);
});
