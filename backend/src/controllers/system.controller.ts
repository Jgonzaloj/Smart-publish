import { Request, Response } from 'express';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';

export class SystemController {
    static async getDashboardStatus(req: Request, res: Response) {
        try {
            // 1. Obtener Cuentas Sociales Conectadas
            const [accountsRows] = await pool.query<RowDataPacket[]>(
                'SELECT id, platform, account_name, status FROM social_accounts WHERE status = "ACTIVE"'
            );

            // 2. Obtener Métricas de Publicaciones (Estado de Posts)
            const [postsRows] = await pool.query<RowDataPacket[]>(
                'SELECT status, COUNT(*) as count FROM posts GROUP BY status'
            );

            let published = 0;
            let drafts = 0;
            let errors = 0;
            let scheduled = 0;

            postsRows.forEach(row => {
                if (row.status === 'PUBLISHED') published = row.count;
                if (row.status === 'DRAFT') drafts = row.count;
                if (row.status === 'FAILED') errors = row.count;
                if (row.status === 'SCHEDULED') scheduled = row.count;
            });

            // 3. Responder al frontend
            res.json({
                success: true,
                data: {
                    accounts: accountsRows,
                    metrics: {
                        published,
                        drafts,
                        errors,
                        scheduled
                    }
                }
            });
        } catch (error) {
            console.error('Error al obtener estado del sistema:', error);
            res.status(500).json({ success: false, message: 'Error obteniendo métricas' });
        }
    }
}
