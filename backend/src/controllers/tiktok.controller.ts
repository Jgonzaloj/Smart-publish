import { Request, Response } from 'express';
import { SocialAccountRepository } from '../repositories/SocialAccountRepository';
import { WorkspaceRepository } from '../repositories/WorkspaceRepository';

export const login = (req: Request, res: Response) => {
    // Simular redirección a OAuth de TikTok
    res.redirect(`${process.env.FRONTEND_URL}/callback/tiktok?code=MOCK_TIKTOK_CODE`);
};

export const handleCallback = async (req: Request, res: Response) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ success: false, message: 'No authorization code provided' });
    }

    try {
        const workspaceRepo = new WorkspaceRepository();
        const accountRepo = new SocialAccountRepository();

        const workspace = await workspaceRepo.findFirst();
        if (!workspace) throw new Error('Workspace no encontrado');

        // MOCK: Canjear token en API de TikTok
        const mockAccessToken = `tiktok_token_${Date.now()}`;
        const mockTikTokUserId = `tt_user_${Math.floor(Math.random() * 10000)}`;

        await accountRepo.create({
            workspace_id: workspace.id,
            platform: 'TIKTOK',
            account_name: 'Usuario de TikTok (Mock)',
            access_token: mockAccessToken,
            platform_account_id: mockTikTokUserId
        });

        res.json({ success: true, message: 'Cuenta de TikTok vinculada con éxito' });
    } catch (error: any) {
        console.error('TikTok Callback Error:', error);
        res.status(500).json({ success: false, message: 'Error al vincular cuenta de TikTok' });
    }
};
