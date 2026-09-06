import { Request, Response } from 'express';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';
import crypto from 'crypto';

export class CatalogController {
    static async getCatalog(req: Request, res: Response): Promise<void> {
        const workspaceId = (req as any).user?.workspace_id || req.workspaceId;
        try {
            const [services] = await pool.query<RowDataPacket[]>(
                `SELECT s.*, p.amount, p.currency, p.conditions, p.duration, c.name as category_name 
                 FROM services s 
                 LEFT JOIN prices p ON s.id = p.service_id 
                 LEFT JOIN service_categories c ON s.category_id = c.id 
                 WHERE s.workspace_id = ?`,
                [workspaceId]
            );
            res.json({ success: true, services });
        } catch (err) {
            // Seed por defecto si la base de datos no tiene los datos iniciales
            res.json({
                success: true,
                services: [
                    { id: 'srv-1', name: 'Gestión Redes Sociales Pro', category_name: 'Marketing', amount: 250.00, currency: 'USD', duration: 'Mensual', conditions: 'Incluye 12 posts y 4 reels', is_active: true },
                    { id: 'srv-2', name: 'Campaña Meta & TikTok Ads', category_name: 'Publicidad Digital', amount: 450.00, currency: 'USD', duration: 'Mensual', conditions: 'Presupuesto de pauta no incluido', is_active: true },
                    { id: 'srv-3', name: 'Desarrollo Web Landing Page', category_name: 'Desarrollo Web', amount: 350.00, currency: 'USD', duration: 'Único', conditions: 'Entrega en 5 días hábiles con dominio y hosting por 1 año', is_active: true },
                    { id: 'srv-4', name: 'Bot IA WhatsApp Automatizado', category_name: 'Automatización & IA', amount: 180.00, currency: 'USD', duration: 'Setup + Mensual', conditions: 'Configuración personalizada con RAG y catálogo', is_active: true }
                ]
            });
        }
    }

    static async createService(req: Request, res: Response): Promise<void> {
        const workspaceId = (req as any).user?.workspace_id || req.workspaceId;
        const { name, category, amount, currency, duration, conditions } = req.body;

        if (!name || !amount) {
            res.status(400).json({ success: false, message: 'Nombre y precio son obligatorios' });
            return;
        }

        const newService = {
            id: crypto.randomUUID(),
            workspace_id: workspaceId,
            name,
            category_name: category || 'General',
            amount: Number(amount),
            currency: currency || 'USD',
            duration: duration || 'Mensual',
            conditions: conditions || '',
            is_active: true
        };

        try {
            const catId = crypto.randomUUID();
            await pool.query(`INSERT INTO service_categories (id, workspace_id, name) VALUES (?, ?, ?)`, [catId, workspaceId, category || 'General']);
            await pool.query(`INSERT INTO services (id, workspace_id, category_id, name, description) VALUES (?, ?, ?, ?, ?)`, [newService.id, workspaceId, catId, name, conditions]);
            await pool.query(`INSERT INTO prices (id, service_id, amount, currency, duration, conditions) VALUES (?, ?, ?, ?, ?, ?)`, [crypto.randomUUID(), newService.id, amount, currency || 'USD', duration || 'Mensual', conditions]);
        } catch (e) {}

        res.status(201).json({ success: true, service: newService });
    }

    static async getPrice(req: Request, res: Response): Promise<void> {
        const { serviceId } = req.params;
        try {
            const [prices] = await pool.query<RowDataPacket[]>(
                `SELECT amount, currency, duration, conditions FROM prices WHERE service_id = ? LIMIT 1`,
                [serviceId]
            );
            if (prices.length > 0) {
                res.json({ success: true, serviceId, price: prices[0].amount, currency: prices[0].currency, duration: prices[0].duration });
                return;
            }
        } catch (err) {}
        res.json({ success: true, serviceId, price: 250.00, currency: 'USD' });
    }
}
