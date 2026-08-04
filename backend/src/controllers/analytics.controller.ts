import { Request, Response } from 'express';
import { SocialAccountRepository } from '../repositories/SocialAccountRepository';
import { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import { FacebookService } from '../services/facebook.service';

export const getEngagement = async (req: Request, res: Response) => {
    try {
        const workspaceRepo = new WorkspaceRepository();
        const accountRepo = new SocialAccountRepository();
        const fbService = new FacebookService();

        // Para el MVP asumimos el primer workspace
        const workspace = await workspaceRepo.findFirst();
        if (!workspace) {
            return res.status(404).json({ success: false, message: 'Workspace no encontrado' });
        }

        const accounts = await accountRepo.findByWorkspace(workspace.id);
        const fbAccount = accounts.find(a => a.platform === 'FACEBOOK');

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
        let formattedData: any[] = [];
        
        if (insights && insights.length > 0) {
            const impressions = insights.find((i: any) => i.name === 'page_impressions')?.values || [];
            const engagements = insights.find((i: any) => i.name === 'page_post_engagements')?.values || [];

            formattedData = impressions.map((imp: any, index: number) => {
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
    } catch (error: any) {
        console.error('Error in getEngagement:', error);
        return res.status(500).json({ success: false, message: 'Error obteniendo analíticas' });
    }
};
