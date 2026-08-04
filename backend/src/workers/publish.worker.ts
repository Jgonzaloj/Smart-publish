import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { PublishJobData } from '../services/queue.service';
import { SocialAccountRepository } from '../repositories/SocialAccountRepository';
import { pool } from '../config/database';

import { SocialMediaProvider } from '../domain/interfaces/SocialMediaProvider';
import { FacebookProvider } from '../services/providers/FacebookProvider';
import { TikTokProvider } from '../services/providers/TikTokProvider';
import { InstagramProvider } from '../services/providers/InstagramProvider';

const socialAccountRepository = new SocialAccountRepository();

// Factory pattern for Providers
const getProvider = (platform: string): SocialMediaProvider => {
    switch (platform.toUpperCase()) {
        case 'FACEBOOK':
            return new FacebookProvider();
        case 'INSTAGRAM':
            return new InstagramProvider();
        case 'TIKTOK':
            return new TikTokProvider();
        default:
            throw new Error(`Proveedor no implementado para la plataforma: ${platform}`);
    }
};

export const publishWorker = new Worker(
    'publishQueue',
    async (job: Job<PublishJobData>) => {
        const { postId, platform, message, mediaUrl } = job.data;
        console.log(`[Worker] Procesando trabajo ${job.id} para el post ${postId} en ${platform}`);

        try {
            // 1. Obtener la cuenta activa
            let account;
            if (job.data.accountId) {
                account = await socialAccountRepository.findById(job.data.accountId);
            } else {
                const accounts = await socialAccountRepository.findActiveByPlatform(platform);
                account = accounts.length > 0 ? accounts[0] : null;
            }
            
            if (!account) {
                throw new Error(`No hay cuenta activa para la plataforma ${platform} o ID proporcionado no válido.`);
            }

            const provider = getProvider(platform);

            // 2. Validar Scopes
            const isValid = await provider.validateScopes(account.id);
            if (!isValid) {
                throw new Error(`Scopes inválidos o Token expirado para la cuenta ${account.account_name}`);
            }

            // 3. Publicar usando la Interfaz Genérica
            const publishedId = await provider.publish(account.id, message, mediaUrl);
            
            console.log(`[Worker] Publicado en ${platform} con éxito. ID: ${publishedId}`);
            
            // 4. Actualizar BD indicando éxito
            await pool.query('UPDATE post_destinations SET status = ?, platform_post_id = ? WHERE post_id = ? AND social_account_id = ?', 
                ['SUCCESS', publishedId, postId, account.id]);
                
        } catch (error: any) {
            console.error(`[Worker] Error publicando trabajo ${job.id}:`, error.message);
            
            // Si el error es por Rate Limit, BullMQ reintentará con exponential backoff
            throw error; 
        }
    },
    { connection: redisConnection }
);

publishWorker.on('completed', (job) => {
    console.log(`✅ [Worker] Trabajo ${job.id} completado con éxito!`);
});

publishWorker.on('failed', (job, err) => {
    console.log(`❌ [Worker] Trabajo ${job?.id} falló con error: ${err.message}`);
});
