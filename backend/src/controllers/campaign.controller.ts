import { Request, Response } from 'express';
import { pool } from '../config/database';
import { CampaignQueueService } from '../services/queue.service';
import crypto from 'crypto';

export class CampaignController {
    static async createCampaign(req: Request, res: Response) {
        try {
            const { workspaceId, accountId, topic, frequencyCron } = req.body;
            
            if (!workspaceId || !accountId || !topic || !frequencyCron) {
                return res.status(400).json({ success: false, message: 'Faltan parámetros' });
            }

            const id = crypto.randomUUID();
            await pool.query(
                `INSERT INTO campaigns (id, workspace_id, social_account_id, topic, frequency_cron)
                 VALUES (?, ?, ?, ?, ?)`,
                [id, workspaceId, accountId, topic, frequencyCron]
            );

            // Programar en BullMQ
            await CampaignQueueService.scheduleCampaign(id, frequencyCron);

            res.json({ success: true, message: 'Campaña creada y programada', data: { id } });
        } catch (error) {
            console.error('Error creating campaign:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static async getCampaigns(req: Request, res: Response) {
        try {
            const [rows] = await pool.query(
                `SELECT c.*, s.account_name, s.platform 
                 FROM campaigns c
                 JOIN social_accounts s ON c.social_account_id = s.id
                 ORDER BY c.created_at DESC`
            );
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            res.status(500).json({ success: false, message: 'Error al obtener campañas' });
        }
    }
}
