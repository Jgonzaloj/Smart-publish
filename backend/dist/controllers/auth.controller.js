"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
const email_service_1 = require("../services/email.service");
const crypto_1 = __importDefault(require("crypto"));
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key';
const emailService = new email_service_1.EmailService();
const JWT_EXPIRES_IN = '24h'; // Política de seguridad acordada (Fase 11)
class AuthController {
    // POST /api/auth/register
    static async register(req, res) {
        const { email, password, name } = req.body;
        try {
            // 1. Validar si el correo ya existe
            const [existing] = await database_1.pool.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: 'El correo ya está registrado' });
            }
            // 2. Hash de contraseña (Protección contra Data Breaches)
            const saltRounds = 10;
            const hashedPassword = await bcrypt_1.default.hash(password, saltRounds);
            const workspaceId = (0, uuid_1.v4)();
            const userId = (0, uuid_1.v4)();
            // 3. Iniciar Transacción
            const connection = await database_1.pool.getConnection();
            try {
                await connection.beginTransaction();
                // 4. Crear el Workspace (Plan FREE_TRIAL por defecto)
                const workspaceName = `Workspace de ${name || email.split('@')[0]}`;
                await connection.query('INSERT INTO workspaces (id, name, plan_id) VALUES (?, ?, ?)', [workspaceId, workspaceName, 'FREE_TRIAL']);
                // 5. Crear el Usuario como ADMIN
                await connection.query('INSERT INTO users (id, workspace_id, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', [userId, workspaceId, email, hashedPassword, 'ADMIN']);
                await connection.commit();
                res.status(201).json({ success: true, message: 'Usuario registrado exitosamente' });
            }
            catch (err) {
                await connection.rollback();
                throw err;
            }
            finally {
                connection.release();
            }
        }
        catch (error) {
            console.error('[Auth] Error registrando usuario:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
    // POST /api/auth/login
    static async login(req, res) {
        const { email, password } = req.body;
        try {
            // 1. Buscar usuario
            const [users] = await database_1.pool.query('SELECT id, password_hash, workspace_id, role FROM users WHERE email = ?', [email]);
            if (users.length === 0) {
                // Prevención de enumeración de usuarios
                return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            }
            const user = users[0];
            // 2. Verificar Hash
            const isValidPassword = await bcrypt_1.default.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            }
            // 3. Generar JWT
            const token = jsonwebtoken_1.default.sign({
                id: user.id,
                email,
                workspace_id: user.workspace_id,
                role: user.role
            }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            res.json({
                success: true,
                token,
                workspace_id: user.workspace_id,
                user: {
                    id: user.id,
                    email,
                    role: user.role
                }
            });
        }
        catch (error) {
            console.error('[Auth] Error en login:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
    // POST /api/auth/forgot-password
    static async forgotPassword(req, res) {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ success: false, message: 'El correo es requerido' });
        try {
            const [users] = await database_1.pool.query('SELECT id FROM users WHERE email = ?', [email]);
            if (users.length === 0) {
                // Security: don't reveal that the user doesn't exist
                return res.json({ success: true, message: 'Si el correo existe, se ha enviado un enlace.' });
            }
            const token = crypto_1.default.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 3600000); // 1 hora
            await database_1.pool.query('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = ?, expires_at = ?', [email, token, expiresAt, token, expiresAt]);
            await emailService.sendPasswordResetEmail(email, token);
            res.json({ success: true, message: 'Si el correo existe, se ha enviado un enlace.' });
        }
        catch (error) {
            console.error('[Auth] Error forgot-password:', error);
            res.status(500).json({ success: false, message: 'Error procesando solicitud' });
        }
    }
    // POST /api/auth/reset-password
    static async resetPassword(req, res) {
        const { email, token, newPassword } = req.body;
        if (!email || !token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Faltan datos' });
        }
        try {
            const [resets] = await database_1.pool.query('SELECT * FROM password_resets WHERE email = ? AND token = ? AND expires_at > NOW()', [email, token]);
            if (resets.length === 0) {
                return res.status(400).json({ success: false, message: 'Token inválido o expirado' });
            }
            const saltRounds = 10;
            const hashedPassword = await bcrypt_1.default.hash(newPassword, saltRounds);
            await database_1.pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [hashedPassword, email]);
            await database_1.pool.query('DELETE FROM password_resets WHERE email = ?', [email]);
            res.json({ success: true, message: 'Contraseña actualizada correctamente' });
        }
        catch (error) {
            console.error('[Auth] Error reset-password:', error);
            res.status(500).json({ success: false, message: 'Error procesando solicitud' });
        }
    }
}
exports.AuthController = AuthController;
