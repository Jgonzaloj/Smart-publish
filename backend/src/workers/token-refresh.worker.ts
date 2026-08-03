import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { SocialAccountRepository } from '../repositories/SocialAccountRepository';

import { SocialMediaProvider } from '../domain/interfaces/SocialMediaProvider';
import { FacebookProvider } from '../services/providers/FacebookProvider';
import { TikTokProvider } from '../services/providers/TikTokProvider';
import { InstagramProvider } from '../services/providers/InstagramProvider';

const socialAccountRepository = new SocialAccountRepository();

const getProvider = (platform: string): SocialMediaProvider => {
    switch (platform.toUpperCase()) {
        case 'FACEBOOK':
            return new FacebookProvider();
        case 'INSTAGRAM':
            return new InstagramProvider();
        case 'TIKTOK':
            return new TikTokProvider();
        default:
            throw new Error(`Proveedor no implementado: ${platform}`);
    }
};

export const tokenRefreshWorker = new Worker(
    'tokenRefreshQueue',
    async (job: Job) => {
        console.log(`[Worker - TokenRefresh] Ejecutando rutina (Job: ${job.id})`);

        try {
            // Este cron o proceso debería buscar TODAS las cuentas activas
            // En un sistema en producción, iteramos usando paginación
            const platforms = ['FACEBOOK', 'TIKTOK', 'INSTAGRAM'];
            
            for (const platform of platforms) {
                const accounts = await socialAccountRepository.findActiveByPlatform(platform);
                
                if (accounts.length > 0) {
                    const provider = getProvider(platform);
                    
                    for (const account of accounts) {
                        // TODO: Aquí iría la lógica para decidir si se debe refrescar
                        // (e.g. si faltan < 5 días para expirar en Meta, o < 12h en TikTok)
                        console.log(`[Worker - TokenRefresh] Validando token de ${account.account_name} (${platform})`);
                        await provider.refreshToken(account.id);
                    }
                }
            }

            console.log(`[Worker - TokenRefresh] Revisión completada.`);
        } catch (error: any) {
            console.error(`[Worker - TokenRefresh] Error general:`, error.message);
            throw error;
        }
    },
    { connection: redisConnection }
);
