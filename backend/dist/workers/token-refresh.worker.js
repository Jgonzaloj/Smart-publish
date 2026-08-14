"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenRefreshWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const SocialAccountRepository_1 = require("../repositories/SocialAccountRepository");
const FacebookProvider_1 = require("../services/providers/FacebookProvider");
const TikTokProvider_1 = require("../services/providers/TikTokProvider");
const InstagramProvider_1 = require("../services/providers/InstagramProvider");
const socialAccountRepository = new SocialAccountRepository_1.SocialAccountRepository();
const getProvider = (platform) => {
    switch (platform.toUpperCase()) {
        case 'FACEBOOK':
            return new FacebookProvider_1.FacebookProvider();
        case 'INSTAGRAM':
            return new InstagramProvider_1.InstagramProvider();
        case 'TIKTOK':
            return new TikTokProvider_1.TikTokProvider();
        default:
            throw new Error(`Proveedor no implementado: ${platform}`);
    }
};
exports.tokenRefreshWorker = new bullmq_1.Worker('tokenRefreshQueue', async (job) => {
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
    }
    catch (error) {
        console.error(`[Worker - TokenRefresh] Error general:`, error.message);
        throw error;
    }
}, { connection: redis_1.redisConnection });
