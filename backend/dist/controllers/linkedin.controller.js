"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCallback = exports.login = void 0;
const SocialAccountRepository_1 = require("../repositories/SocialAccountRepository");
const WorkspaceRepository_1 = require("../repositories/WorkspaceRepository");
const uuid_1 = require("uuid");
const login = (req, res) => {
    // Simular redirección a OAuth de LinkedIn
    // En real: https://www.linkedin.com/oauth/v2/authorization...
    res.redirect(`${process.env.FRONTEND_URL}/callback/linkedin?code=MOCK_LINKEDIN_CODE`);
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
        // MOCK: En la vida real, canjeamos el código por un Access Token real haciendo POST a LinkedIn
        const mockAccessToken = `linkedin_token_${Date.now()}`;
        const mockLinkedInUserId = `li_user_${Math.floor(Math.random() * 10000)}`;
        await accountRepo.createOrUpdate({
            id: (0, uuid_1.v4)(),
            workspace_id: workspace.id,
            platform: 'LINKEDIN',
            account_name: 'Usuario de LinkedIn (Mock)',
            access_token: mockAccessToken,
            platform_account_id: mockLinkedInUserId
        });
        res.json({ success: true, message: 'Cuenta de LinkedIn vinculada con éxito' });
    }
    catch (error) {
        console.error('LinkedIn Callback Error:', error);
        res.status(500).json({ success: false, message: 'Error al vincular cuenta de LinkedIn' });
    }
};
exports.handleCallback = handleCallback;
