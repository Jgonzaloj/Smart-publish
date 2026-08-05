import { Request, Response } from 'express';
import { FacebookService } from '../services/facebook.service';
import { v4 as uuidv4 } from 'uuid';
import { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import { SocialAccountRepository } from '../repositories/SocialAccountRepository';

const facebookService = new FacebookService();
const workspaceRepository = new WorkspaceRepository();
const socialAccountRepository = new SocialAccountRepository();

export class FacebookController {
    static getAuthUrl(req: Request, res: Response) {
        const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/callback/facebook`;
        try {
            // Se añaden permisos para Instagram
            const scopes = [
                'pages_show_list',
                'pages_read_engagement',
                'pages_manage_posts',
                'instagram_basic',
                'instagram_content_publish'
            ].join(',');
            const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.FB_APP_ID}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code`;
            res.json({ success: true, authUrl: url });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al generar URL de Facebook' });
        }
    }

    static async handleCallback(req: Request, res: Response) {
        const code = req.query.code as string;
        const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/callback/facebook`;

        if (!code) {
            return res.status(400).json({ success: false, message: 'No se proporcionó código' });
        }

        try {
            const shortLivedToken = await facebookService.exchangeCodeForToken(code, redirectUri);
            const longLivedData = await facebookService.getLongLivedToken(shortLivedToken);
            
            // 1. Obtener perfil de Facebook
            const profile = await facebookService.getUserProfile(longLivedData.token);

            // 2. Usar el workspace del usuario autenticado
            const user = (req as any).user;
            if (!user || !user.workspace_id) {
                return res.status(401).json({ success: false, message: 'Usuario no autenticado o sin workspace' });
            }
            const workspaceId = user.workspace_id;

            // 3. Guardar cuenta de FACEBOOK en Base de Datos
            const accountId = uuidv4();
            const expiresAt = new Date(Date.now() + longLivedData.expires_in * 1000);

            await socialAccountRepository.createOrUpdate({
                id: accountId,
                workspace_id: workspaceId,
                platform: 'FACEBOOK',
                platform_account_id: profile.id,
                account_name: profile.name,
                access_token: longLivedData.token,
                token_expires_at: expiresAt,
                status: 'ACTIVE'
            });

            // 4. Intentar detectar y guardar cuenta de INSTAGRAM
            try {
                const pages = await facebookService.getPages(longLivedData.token, true);
                if (pages.length > 0) {
                    const page = pages[0];
                    const igUserId = await facebookService.getInstagramAccount(page.id, page.access_token);
                    
                    if (igUserId) {
                        const igAccountId = uuidv4();
                        await socialAccountRepository.createOrUpdate({
                            id: igAccountId,
                            workspace_id: workspaceId,
                            platform: 'INSTAGRAM',
                            platform_account_id: igUserId,
                            account_name: `${profile.name} (IG)`,
                            access_token: longLivedData.token, // Usa el mismo token de usuario
                            token_expires_at: expiresAt,
                            status: 'ACTIVE'
                        });
                        console.log('Cuenta de Instagram guardada exitosamente.');
                    }
                }
            } catch (igError) {
                console.error('Error opcional al guardar cuenta de Instagram:', igError);
            }
            
            res.json({
                success: true,
                message: '¡Conectado exitosamente y guardado en Base de Datos!',
                data: { accountName: profile.name }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno en la autenticación' });
        }
    }

    /**
     * Endpoint: POST /api/social/publish
     * Recibe un mensaje y archivo opcional, busca el token en la BD y publica en la primera página
     */
    static async publishPost(req: Request, res: Response) {
        const { message, platform } = req.body;
        const imageFile = req.file; // Extraído por multer

        if (!message && !imageFile) {
            return res.status(400).json({ success: false, message: 'Debes incluir un mensaje o una imagen' });
        }

        try {
            const user = (req as any).user;
            if (!user || !user.workspace_id) {
                return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
            }

            // 1. Buscar el token activo en la base de datos para el workspace actual
            const accounts = await socialAccountRepository.findByWorkspace(user.workspace_id);
            const fbAccounts = accounts.filter(acc => acc.platform === 'FACEBOOK' && acc.status === 'ACTIVE');
            
            if (fbAccounts.length === 0) {
                return res.status(400).json({ success: false, message: 'No hay cuenta de Facebook conectada en tu espacio.' });
            }

            const userToken = fbAccounts[0].access_token;

            // 2. Obtener las páginas del usuario
            const pages = await facebookService.getPages(userToken);

            if (pages.length === 0) {
                return res.status(400).json({ success: false, message: 'No tienes ninguna Página de Facebook vinculada a tu cuenta.' });
            }

            // 3. Tomar la primera página (MVP)
            const firstPage = pages[0];
            const pageId = firstPage.id;
            const pageToken = firstPage.access_token;

            // 4. Publicar el mensaje en la página (con o sin imagen)
            const postId = await facebookService.publishToPage(pageId, pageToken, message || '', imageFile);

            res.json({
                success: true,
                message: '¡Publicación exitosa!',
                data: { postId, pageName: firstPage.name }
            });
        } catch (error) {
            console.error('Error publicando:', error);
            res.status(500).json({ success: false, message: 'Error interno al publicar en Meta' });
        }
    }
}
