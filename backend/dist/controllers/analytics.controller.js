"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEngagement = void 0;
const SocialAccountRepository_1 = require("../repositories/SocialAccountRepository");
const WorkspaceRepository_1 = require("../repositories/WorkspaceRepository");
const facebook_service_1 = require("../services/facebook.service");
const getEngagement = async (req, res) => {
    try {
        const workspaceRepo = new WorkspaceRepository_1.WorkspaceRepository();
        const accountRepo = new SocialAccountRepository_1.SocialAccountRepository();
        const fbService = new facebook_service_1.FacebookService();
        // Para el MVP asumimos el primer workspace
        const workspace = await workspaceRepo.findFirst();
        if (!workspace) {
            return res.status(404).json({ success: false, message: 'Workspace no encontrado' });
        }
        const accounts = await accountRepo.findByWorkspace(workspace.id);
        const fbAccount = accounts.find((a) => a.platform === 'FACEBOOK');
        if (!fbAccount) {
            return res.json({ success: true, data: [] }); // No data
        }
        const pages = await fbService.getPages(fbAccount.access_token);
        if (pages.length === 0) {
            return res.json({ success: true, data: [] });
        }
        const page = pages[0]; // MVP: Tomamos la primera página
        const insights = await fbService.getPageInsights(page.id, page.access_token);
        // Formatear insights para Recharts
        let formattedData = [];
        if (insights && insights.length > 0) {
            const impressions = insights.find((i) => i.name === 'page_impressions')?.values || [];
            const engagements = insights.find((i) => i.name === 'page_post_engagements')?.values || [];
            formattedData = impressions.map((imp, index) => {
                const date = new Date(imp.end_time);
                return {
                    name: `${date.getDate()}/${date.getMonth() + 1}`,
                    impresiones: imp.value,
                    engagement: engagements[index]?.value || 0
                };
            });
        }
        return res.json({
            success: true,
            data: formattedData
        });
    }
    catch (error) {
        console.error('Error in getEngagement:', error);
        return res.status(500).json({ success: false, message: 'Error obteniendo analíticas' });
    }
};
exports.getEngagement = getEngagement;
