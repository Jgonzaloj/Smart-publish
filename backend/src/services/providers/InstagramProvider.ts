import { SocialMediaProvider } from '../../domain/interfaces/SocialMediaProvider';
import { FacebookService } from '../facebook.service';
import { SocialAccountRepository } from '../../repositories/SocialAccountRepository';
import { pool } from '../../config/database';

export class InstagramProvider implements SocialMediaProvider {
    private facebookService: FacebookService;
    private accountRepository: SocialAccountRepository;

    constructor() {
        this.facebookService = new FacebookService();
        this.accountRepository = new SocialAccountRepository();
    }

    async publish(accountId: string, content: string, mediaUrl?: string): Promise<string> {
        if (!mediaUrl) {
            throw new Error('Instagram requiere obligatoriamente una imagen o video para publicar.');
        }

        const [rows]: any = await pool.query('SELECT access_token FROM social_accounts WHERE id = ?', [accountId]);
        if (!rows || rows.length === 0) {
            throw new Error(`Cuenta de Instagram no encontrada para el ID: ${accountId}`);
        }

        const userToken = rows[0].access_token;
        const pages = await this.facebookService.getPages(userToken);

        if (pages.length === 0) {
            throw new Error('No hay páginas vinculadas a esta cuenta para obtener la cuenta de Instagram.');
        }

        // MVP: Tomar la primera página y buscar su cuenta de Instagram vinculada
        const page = pages[0];
        
        const igUserId = await this.facebookService.getInstagramAccount(page.id, page.access_token);
        
        if (!igUserId) {
            throw new Error('La página de Facebook seleccionada no tiene una cuenta de Instagram Business vinculada.');
        }

        // Para Instagram Graph API, la URL de la imagen debe ser pública
        const baseUrl = process.env.PUBLIC_APP_URL || 'https://redes.inversionesvawi.com';
        // Si mediaUrl ya tiene http, lo usamos, si no, lo concatenamos
        const finalImageUrl = mediaUrl.startsWith('http') ? mediaUrl : `${baseUrl}${mediaUrl}`;

        const publishedId = await this.facebookService.publishToInstagram(igUserId, page.access_token, content, finalImageUrl);

        return publishedId;
    }

    async refreshToken(accountId: string): Promise<void> {
        const [rows]: any = await pool.query('SELECT access_token FROM social_accounts WHERE id = ?', [accountId]);
        if (!rows || rows.length === 0) return;
        
        const currentToken = rows[0].access_token;
        const { token, expires_in } = await this.facebookService.getLongLivedToken(currentToken);
        
        const expiresAt = new Date(Date.now() + expires_in * 1000);
        await pool.query('UPDATE social_accounts SET access_token = ?, token_expires_at = ? WHERE id = ?', [token, expiresAt, accountId]);
    }

    async validateScopes(accountId: string): Promise<boolean> {
        try {
            const [rows]: any = await pool.query('SELECT access_token FROM social_accounts WHERE id = ?', [accountId]);
            if (!rows || rows.length === 0) return false;

            const pages = await this.facebookService.getPages(rows[0].access_token);
            if (pages.length > 0) {
                const igUserId = await this.facebookService.getInstagramAccount(pages[0].id, pages[0].access_token);
                return !!igUserId;
            }
            return false;
        } catch (e) {
            return false;
        }
    }
}
