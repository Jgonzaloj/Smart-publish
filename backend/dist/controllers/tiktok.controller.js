"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCallback = exports.login = void 0;
const SocialAccountRepository_1 = require("../repositories/SocialAccountRepository");
const WorkspaceRepository_1 = require("../repositories/WorkspaceRepository");
const uuid_1 = require("uuid");
const login = (req, res) => {
    // Simular redirección a OAuth de TikTok
    res.redirect(`${process.env.FRONTEND_URL}/callback/tiktok?code=MOCK_TIKTOK_CODE`);
};
exports.login = login;
const handleCallback = async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).json({ success: false, message: 'No authorization code provided' });
    }
    try {
        const workspaceRepo = new WorkspaceRepository_1.WorkspaceRepository();
        const accountRepo = new SocialAccountRepository_1.SocialAccountRepository();
        const workspace = await workspaceRepo.findFirst();
        if (!workspace)
            throw new Error('Workspace no encontrado');
        // MOCK: Canjear token en API de TikTok
        const mockAccessToken = `tiktok_token_${Date.now()}`;
        const mockTikTokUserId = `tt_user_${Math.floor(Math.random() * 10000)}`;
        await accountRepo.createOrUpdate({
            id: (0, uuid_1.v4)(),
            workspace_id: workspace.id,
            platform: 'TIKTOK',
            account_name: 'Usuario de TikTok (Mock)',
            access_token: mockAccessToken,
            platform_account_id: mockTikTokUserId
        });
        res.json({ success: true, message: 'Cuenta de TikTok vinculada con éxito' });
    }
    catch (error) {
        console.error('TikTok Callback Error:', error);
        res.status(500).json({ success: false, message: 'Error al vincular cuenta de TikTok' });
    }
};
exports.handleCallback = handleCallback;
