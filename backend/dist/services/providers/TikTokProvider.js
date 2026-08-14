"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TikTokProvider = void 0;
class TikTokProvider {
    async publish(accountId, content, mediaUrl) {
        // En TikTok el mediaUrl (Video) es 100% obligatorio
        if (!mediaUrl) {
            throw new Error('TikTok requiere obligatoriamente un archivo de video (mediaUrl).');
        }
        // TODO: Implementar subida Multipart (Resumable Upload) hacia la API de TikTok
        console.log(`[TikTokProvider] Simulando publicación del video ${mediaUrl} con caption: ${content}`);
        return `tiktok_simulated_id_${Date.now()}`;
    }
    async refreshToken(accountId) {
        // TODO: En TikTok, el Access Token (1 día) se refresca con el Refresh Token (1 año)
        // A diferencia de Meta, este método debe llamarse DIARIAMENTE mediante un cron job o BullMQ.
        console.log(`[TikTokProvider] Refrescando token para la cuenta ${accountId}`);
    }
    async validateScopes(accountId) {
        // TODO: Llamar al endpoint /user/info/ para validar el token
        return true;
    }
}
exports.TikTokProvider = TikTokProvider;
