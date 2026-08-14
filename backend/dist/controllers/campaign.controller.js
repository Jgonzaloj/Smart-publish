"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignController = void 0;
const database_1 = require("../config/database");
const queue_service_1 = require("../services/queue.service");
const crypto_1 = __importDefault(require("crypto"));
class CampaignController {
    static async createCampaign(req, res) {
        try {
            const { accountId, topic, frequencyCron } = req.body;
            const workspaceId = req.user?.workspace_id;
            if (!workspaceId || !accountId || !topic || !frequencyCron) {
                return res.status(400).json({ success: false, message: 'Faltan parámetros o no estás autenticado en un workspace' });
            }
            const id = crypto_1.default.randomUUID();
            await database_1.pool.query(`INSERT INTO campaigns (id, workspace_id, social_account_id, topic, frequency_cron)
                 VALUES (?, ?, ?, ?, ?)`, [id, workspaceId, accountId, topic, frequencyCron]);
            // Programar en BullMQ
            await queue_service_1.CampaignQueueService.scheduleCampaign(id, frequencyCron);
            res.json({ success: true, message: 'Campaña creada y programada', data: { id } });
        }
        catch (error) {
            console.error('Error creating campaign:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
    static async getCampaigns(req, res) {
        try {
            const workspaceId = req.user?.workspace_id;
            const [rows] = await database_1.pool.query(`SELECT c.*, s.account_name, s.platform 
                 FROM campaigns c
                 JOIN social_accounts s ON c.social_account_id = s.id
                 WHERE c.workspace_id = ?
                 ORDER BY c.created_at DESC`, [workspaceId]);
            res.json({ success: true, data: rows });
        }
        catch (error) {
            console.error('Error fetching campaigns:', error);
            res.status(500).json({ success: false, message: 'Error al obtener campañas' });
        }
    }
    static async deleteCampaign(req, res) {
        try {
            const { id } = req.params;
            const workspaceId = req.user?.workspace_id;
            if (!id || !workspaceId) {
                return res.status(400).json({ success: false, message: 'Faltan parámetros' });
            }
            const [result] = await database_1.pool.query('DELETE FROM campaigns WHERE id = ? AND workspace_id = ?', [id, workspaceId]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Campaña no encontrada o sin permisos' });
            }
            res.json({ success: true, message: 'Campaña eliminada correctamente' });
        }
        catch (error) {
            console.error('Error deleting campaign:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
}
exports.CampaignController = CampaignController;
