import { SocialMediaProvider } from '../../domain/interfaces/SocialMediaProvider';
import { FacebookService } from '../facebook.service';
import { SocialAccountRepository } from '../../repositories/SocialAccountRepository';
import { pool } from '../../config/database';
import fs from 'fs';
import path from 'path';

export class FacebookProvider implements SocialMediaProvider {
    private facebookService: FacebookService;
    private accountRepository: SocialAccountRepository;

    constructor() {
        this.facebookService = new FacebookService();
        this.accountRepository = new SocialAccountRepository();
    }

    async publish(accountId: string, content: string, mediaUrl?: string): Promise<string> {
        // En un caso real, buscaríamos la cuenta por su accountId
        // Por simplicidad del MVP, usamos la lógica para buscar el token directamente
        // Asumiendo que `accountId` es el ID interno (uuid) de la tabla `social_accounts`
        
        const [rows]: any = await pool.query('SELECT access_token FROM social_accounts WHERE id = ?', [accountId]);
        if (!rows || rows.length === 0) {
            throw new Error(`Cuenta de Facebook no encontrada para el ID: ${accountId}`);
        }

        const userToken = rows[0].access_token;
        const pages = await this.facebookService.getPages(userToken);

        if (pages.length === 0) {
            throw new Error('No hay páginas vinculadas a esta cuenta de Facebook.');
        }

        // MVP: Tomar la primera página. En V2, el usuario elegiría el pageId exacto.
        const page = pages[0];
        
        let publishedId: string;

        if (mediaUrl) {
            // Reconstruir la ruta local absoluta
            const fileName = mediaUrl.replace('/uploads/', '');
            const filePath = path.join(process.cwd(), 'uploads', fileName);
            
            if (fs.existsSync(filePath)) {
                // Crear objeto "file" simulando el formato de Multer para la función existente
                const buffer = fs.readFileSync(filePath);
                const fakeMulterFile = {
                    buffer,
                    originalname: fileName,
                    mimetype: 'image/jpeg'
                } as Express.Multer.File;

                publishedId = await this.facebookService.publishToPage(page.id, page.access_token, content, fakeMulterFile);
            } else {
                // Fallback a solo texto si la imagen se perdió
                console.warn(`Archivo de imagen no encontrado: ${filePath}`);
                publishedId = await this.facebookService.publishToPage(page.id, page.access_token, content);
            }
        } else {
            // Solo Texto
            publishedId = await this.facebookService.publishToPage(page.id, page.access_token, content);
        }

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
        // Lógica para consultar a Meta si los scopes (pages_manage_posts, etc.) siguen vigentes
        // Ejemplo simplificado: intentamos obtener las páginas. Si falla con error de auth, retornamos false.
        try {
            const [rows]: any = await pool.query('SELECT access_token FROM social_accounts WHERE id = ?', [accountId]);
            if (!rows || rows.length === 0) return false;

            await this.facebookService.getPages(rows[0].access_token);
            return true;
        } catch (e) {
            return false;
        }
    }
}
