import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';

export interface Workspace {
    id: string;
    name: string;
    plan_id?: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    stripe_price_id?: string;
    plan_status?: string;
    ai_credits_used?: number;
    ai_images_used?: number;
    posts_used?: number;
}

export class WorkspaceRepository {
    async findById(id: string): Promise<Workspace | null> {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM workspaces WHERE id = ?', [id]);
        return rows.length > 0 ? (rows[0] as Workspace) : null;
    }

    async findFirst(): Promise<Workspace | null> {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM workspaces LIMIT 1');
        return rows.length > 0 ? (rows[0] as Workspace) : null;
    }

    async findByStripeCustomerId(customerId: string): Promise<Workspace | null> {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM workspaces WHERE stripe_customer_id = ?', [customerId]);
        return rows.length > 0 ? (rows[0] as Workspace) : null;
    }

    async create(workspace: Workspace): Promise<void> {
        await pool.query('INSERT INTO workspaces (id, name) VALUES (?, ?)', [workspace.id, workspace.name]);
    }

    async updateStripeCustomer(workspaceId: string, customerId: string): Promise<void> {
        await pool.query('UPDATE workspaces SET stripe_customer_id = ? WHERE id = ?', [customerId, workspaceId]);
    }

    async updateSubscription(workspaceId: string, subscriptionId: string, priceId: string, status: string): Promise<void> {
        await pool.query(
            'UPDATE workspaces SET stripe_subscription_id = ?, stripe_price_id = ?, plan_status = ? WHERE id = ?', 
            [subscriptionId, priceId, status, workspaceId]
        );
    }
    
    async removeSubscription(workspaceId: string): Promise<void> {
        await pool.query(
            'UPDATE workspaces SET stripe_subscription_id = NULL, stripe_price_id = NULL, plan_status = "free" WHERE id = ?', 
            [workspaceId]
        );
    }

    async incrementAiUsage(workspaceId: string): Promise<void> {
        await pool.query('UPDATE workspaces SET ai_credits_used = ai_credits_used + 1 WHERE id = ?', [workspaceId]);
    }

    async incrementPostUsage(workspaceId: string): Promise<void> {
        await pool.query('UPDATE workspaces SET posts_used = posts_used + 1 WHERE id = ?', [workspaceId]);
    }

    async checkImageLimit(workspaceId: string): Promise<boolean> {
        // Al usar Pollinations AI (que es gratuito e ilimitado),
        // eliminamos completamente la restricción de 3 imágenes para todos los usuarios.
        return true;
    }

    async incrementImageUsage(workspaceId: string): Promise<void> {
        await pool.query('UPDATE workspaces SET ai_images_used = IFNULL(ai_images_used, 0) + 1 WHERE id = ?', [workspaceId]);
    }
}
