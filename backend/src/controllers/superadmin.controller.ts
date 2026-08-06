import { Request, Response } from 'express';
import { pool } from '../config/database';

export class SuperAdminController {
    static async getDashboardData(req: Request, res: Response) {
        try {
            // Totals
            const [[{ totalUsers }]]: any = await pool.query('SELECT COUNT(*) as totalUsers FROM users');
            const [[{ totalWorkspaces }]]: any = await pool.query('SELECT COUNT(*) as totalWorkspaces FROM workspaces');
            const [[{ totalPosts }]]: any = await pool.query('SELECT COUNT(*) as totalPosts FROM posts');

            // Plans distribution
            const [plans]: any = await pool.query(`
                SELECT plan_id, COUNT(*) as count 
                FROM workspaces 
                GROUP BY plan_id
            `);

            // Estimate MRR (Monthly Recurring Revenue)
            // Assuming: 'free' = $0, 'pro' = $49, 'agency' = $199, 'FREE_TRIAL' = $0
            let estimatedMRR = 0;
            plans.forEach((p: any) => {
                if (p.plan_id === 'pro') estimatedMRR += p.count * 49;
                if (p.plan_id === 'agency') estimatedMRR += p.count * 199;
            });

            // Recent Signups (last 5)
            const [recentUsers]: any = await pool.query(`
                SELECT email, role, created_at 
                FROM users 
                ORDER BY created_at DESC 
                LIMIT 5
            `);

            res.json({
                success: true,
                data: {
                    totalUsers,
                    totalWorkspaces,
                    totalPosts,
                    estimatedMRR,
                    plansDistribution: plans,
                    recentUsers
                }
            });
        } catch (error) {
            console.error('Error fetching superadmin data:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
}
