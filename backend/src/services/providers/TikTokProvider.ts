import { SocialMediaProvider } from '../../domain/interfaces/SocialMediaProvider';

export class TikTokProvider implements SocialMediaProvider {
    
    async publish(accountId: string, content: string, mediaUrl?: string): Promise<string> {
        // En TikTok el mediaUrl (Video) es 100% obligatorio
        if (!mediaUrl) {
            throw new Error('TikTok requiere obligatoriamente un archivo de video (mediaUrl).');
        }
        
        // TODO: Implementar subida Multipart (Resumable Upload) hacia la API de TikTok
        console.log(`[TikTokProvider] Simulando publicación del video ${mediaUrl} con caption: ${content}`);
        
        return `tiktok_simulated_id_${Date.now()}`;
    }

    async refreshToken(accountId: string): Promise<void> {
        // TODO: En TikTok, el Access Token (1 día) se refresca con el Refresh Token (1 año)
        // A diferencia de Meta, este método debe llamarse DIARIAMENTE mediante un cron job o BullMQ.
        console.log(`[TikTokProvider] Refrescando token para la cuenta ${accountId}`);
    }

    async validateScopes(accountId: string): Promise<boolean> {
        // TODO: Llamar al endpoint /user/info/ para validar el token
        return true; 
    }
}
