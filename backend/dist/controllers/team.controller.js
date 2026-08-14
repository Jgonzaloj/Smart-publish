"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamController = void 0;
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
const email_service_1 = require("../services/email.service");
const crypto_1 = __importDefault(require("crypto"));
const emailService = new email_service_1.EmailService();
class TeamController {
    // GET /api/team
    static async getMembers(req, res) {
        const workspaceId = req.user.workspace_id;
        try {
            const [users] = await database_1.pool.query('SELECT id, email, role, created_at FROM users WHERE workspace_id = ?', [workspaceId]);
            const [invites] = await database_1.pool.query('SELECT id, email, role, expires_at, created_at FROM workspace_invites WHERE workspace_id = ? AND expires_at > NOW()', [workspaceId]);
            res.json({ success: true, data: { users, pendingInvites: invites } });
        }
        catch (error) {
            console.error('Error fetching team members:', error);
            res.status(500).json({ success: false, message: 'Error obteniendo miembros del equipo' });
        }
    }
    // POST /api/team/invite
    static async inviteMember(req, res) {
        const workspaceId = req.user.workspace_id;
        const reqRole = req.user.role;
        const { email, role } = req.body;
        if (reqRole !== 'ADMIN' && reqRole !== 'MANAGER') {
            return res.status(403).json({ success: false, message: 'No tienes permisos para invitar' });
        }
        if (!email || !role) {
            return res.status(400).json({ success: false, message: 'Email y rol son requeridos' });
        }
        try {
            // Check if already in workspace
            const [existingUser] = await database_1.pool.query('SELECT id FROM users WHERE email = ? AND workspace_id = ?', [email, workspaceId]);
            if (existingUser.length > 0) {
                return res.status(400).json({ success: false, message: 'El usuario ya pertenece a este workspace' });
            }
            // Generate token
            const token = crypto_1.default.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 48 * 3600000); // 48 horas
            const inviteId = (0, uuid_1.v4)();
            await database_1.pool.query('INSERT INTO workspace_invites (id, workspace_id, email, role, token, expires_at) VALUES (?, ?, ?, ?, ?, ?)', [inviteId, workspaceId, email, role, token, expiresAt]);
            // Get workspace name
            const [ws] = await database_1.pool.query('SELECT name FROM workspaces WHERE id = ?', [workspaceId]);
            const wsName = ws[0]?.name || 'Tu Equipo';
            await emailService.sendTeamInviteEmail(email, wsName, role, token);
            res.json({ success: true, message: 'Invitación enviada' });
        }
        catch (error) {
            console.error('Error sending invite:', error);
            res.status(500).json({ success: false, message: 'Error enviando invitación' });
        }
    }
    // POST /api/team/accept-invite
    static async acceptInvite(req, res) {
        const { token, email, name, password } = req.body;
        if (!token || !email || !password) {
            return res.status(400).json({ success: false, message: 'Faltan datos' });
        }
        try {
            const [invites] = await database_1.pool.query('SELECT * FROM workspace_invites WHERE email = ? AND token = ? AND expires_at > NOW()', [email, token]);
            if (invites.length === 0) {
                return res.status(400).json({ success: false, message: 'Invitación inválida o expirada' });
            }
            const invite = invites[0];
            const userId = (0, uuid_1.v4)();
            const saltRounds = 10;
            const hashedPassword = await require('bcrypt').hash(password, saltRounds);
            // Join the workspace
            await database_1.pool.query('INSERT INTO users (id, workspace_id, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', [userId, invite.workspace_id, email, hashedPassword, invite.role]);
            // Delete invite
            await database_1.pool.query('DELETE FROM workspace_invites WHERE id = ?', [invite.id]);
            res.json({ success: true, message: 'Cuenta creada y unida al equipo exitosamente' });
        }
        catch (error) {
            console.error('Error accepting invite:', error);
            res.status(500).json({ success: false, message: 'Error aceptando invitación' });
        }
    }
    // DELETE /api/team/member/:userId
    static async removeMember(req, res) {
        const workspaceId = req.user.workspace_id;
        const reqRole = req.user.role;
        const reqUserId = req.user.id;
        const { userId } = req.params;
        if (reqRole !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Solo el administrador puede eliminar miembros' });
        }
        if (reqUserId === userId) {
            return res.status(400).json({ success: false, message: 'No puedes eliminarte a ti mismo' });
        }
        try {
            await database_1.pool.query('DELETE FROM users WHERE id = ? AND workspace_id = ?', [userId, workspaceId]);
            res.json({ success: true, message: 'Miembro eliminado' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Error eliminando miembro' });
        }
    }
}
exports.TeamController = TeamController;
