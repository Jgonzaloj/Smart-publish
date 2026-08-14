import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';
import { QueueService } from '../services/queue.service';
import { AiService } from '../services/ai.service';
import crypto from 'crypto';

export interface CampaignData {
    campaignId: string;
}

const aiService = new AiService();

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
            } else {
                console.log(`[QA Auditor] Post APROBADO.`);
            }

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

            // 4.1 Crear registro del destino
            const destinationId = crypto.randomUUID();
            await pool.query(
                `INSERT INTO post_destinations (id, post_id, social_account_id, status)
                 VALUES (?, ?, ?, ?)`,
                 [destinationId, postId, campaign.social_account_id, 'PENDING']
            );

                        // QA GATE: Si no fue aprobado, se queda en DRAFT y NO se encola
            if (!approved) {
                console.log('[CampaignWorker] QA no superado. El post se guarda como DRAFT para revision humana.');
                return;
            }

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
