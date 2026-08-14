"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const SocialAccountRepository_1 = require("../repositories/SocialAccountRepository");
const database_1 = require("../config/database");
const FacebookProvider_1 = require("../services/providers/FacebookProvider");
const TikTokProvider_1 = require("../services/providers/TikTokProvider");
const InstagramProvider_1 = require("../services/providers/InstagramProvider");
const socialAccountRepository = new SocialAccountRepository_1.SocialAccountRepository();
// Factory pattern for Providers
const getProvider = (platform) => {
    switch (platform.toUpperCase()) {
        case 'FACEBOOK':
            return new FacebookProvider_1.FacebookProvider();
        case 'INSTAGRAM':
            return new InstagramProvider_1.InstagramProvider();
        case 'TIKTOK':
            return new TikTokProvider_1.TikTokProvider();
        default:
            throw new Error(`Proveedor no implementado para la plataforma: ${platform}`);
    }
};
exports.publishWorker = new bullmq_1.Worker('publishQueue', async (job) => {
    const { postId, platform, message, mediaUrl } = job.data;
    console.log(`[Worker] Procesando trabajo ${job.id} para el post ${postId} en ${platform}`);
    try {
        // 1. Obtener la cuenta activa
        let account;
        if (job.data.accountId) {
            account = await socialAccountRepository.findById(job.data.accountId);
        }
        else {
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
        await database_1.pool.query('UPDATE post_destinations SET status = ?, platform_post_id = ? WHERE post_id = ? AND social_account_id = ?', ['SUCCESS', publishedId, postId, account.id]);
    }
    catch (error) {
        console.error(`[Worker] Error publicando trabajo ${job.id}:`, error.message);
        // Si el error es por Rate Limit, BullMQ reintentará con exponential backoff
        throw error;
    }
}, { connection: redis_1.redisConnection });
exports.publishWorker.on('completed', (job) => {
    console.log(`✅ [Worker] Trabajo ${job.id} completado con éxito!`);
});
exports.publishWorker.on('failed', (job, err) => {
    console.log(`❌ [Worker] Trabajo ${job?.id} falló con error: ${err.message}`);
});
