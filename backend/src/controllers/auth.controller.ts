import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../services/email.service';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key';
const emailService = new EmailService();
const JWT_EXPIRES_IN = '24h'; // Política de seguridad acordada (Fase 11)

export class AuthController {
    
    // POST /api/auth/register
    static async register(req: Request, res: Response) {
        const { email, password, name } = req.body;

        try {
            // 1. Validar si el correo ya existe
            const [existing]: any = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: 'El correo ya está registrado' });
            }

            // 2. Hash de contraseña (Protección contra Data Breaches)
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            
            const workspaceId = uuidv4();
            const userId = uuidv4();

            // 3. Iniciar Transacción
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                // 4. Crear el Workspace (Plan FREE_TRIAL por defecto)
                const workspaceName = `Workspace de ${name || email.split('@')[0]}`;
                await connection.query(
                    'INSERT INTO workspaces (id, name, plan_id) VALUES (?, ?, ?)',
                    [workspaceId, workspaceName, 'FREE_TRIAL']
                );

                // 5. Crear el Usuario como ADMIN
                await connection.query(
                    'INSERT INTO users (id, workspace_id, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', 
                    [userId, workspaceId, email, hashedPassword, 'ADMIN']
                );

                await connection.commit();
                res.status(201).json({ success: true, message: 'Usuario registrado exitosamente' });
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }

        } catch (error) {
            console.error('[Auth] Error registrando usuario:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    // POST /api/auth/login
    static async login(req: Request, res: Response) {
        const { email, password } = req.body;

        try {
            // 1. Buscar usuario
            const [users]: any = await pool.query('SELECT id, password_hash, workspace_id, role FROM users WHERE email = ?', [email]);
            
            if (users.length === 0) {
                // Prevención de enumeración de usuarios
                return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            }

            const user = users[0];

            // 2. Verificar Hash
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            
            if (!isValidPassword) {
                return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            }

            // 3. Generar JWT
            const token = jwt.sign(
                { 
                    id: user.id, 
                    email, 
                    workspace_id: user.workspace_id,
                    role: user.role 
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

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

        } catch (error) {
            console.error('[Auth] Error en login:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    // POST /api/auth/forgot-password
    static async forgotPassword(req: Request, res: Response) {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'El correo es requerido' });

        try {
            const [users]: any = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
            if (users.length === 0) {
                // Security: don't reveal that the user doesn't exist
                return res.json({ success: true, message: 'Si el correo existe, se ha enviado un enlace.' });
            }

            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 3600000); // 1 hora

            await pool.query(
                'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = ?, expires_at = ?',
                [email, token, expiresAt, token, expiresAt]
            );

            await emailService.sendPasswordResetEmail(email, token);

            res.json({ success: true, message: 'Si el correo existe, se ha enviado un enlace.' });
        } catch (error) {
            console.error('[Auth] Error forgot-password:', error);
            res.status(500).json({ success: false, message: 'Error procesando solicitud' });
        }
    }

    // POST /api/auth/reset-password
    static async resetPassword(req: Request, res: Response) {
        const { email, token, newPassword } = req.body;

        if (!email || !token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Faltan datos' });
        }

        try {
            const [resets]: any = await pool.query(
                'SELECT * FROM password_resets WHERE email = ? AND token = ? AND expires_at > NOW()',
                [email, token]
            );

            if (resets.length === 0) {
                return res.status(400).json({ success: false, message: 'Token inválido o expirado' });
            }

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [hashedPassword, email]);
            await pool.query('DELETE FROM password_resets WHERE email = ?', [email]);

            res.json({ success: true, message: 'Contraseña actualizada correctamente' });
        } catch (error) {
            console.error('[Auth] Error reset-password:', error);
            res.status(500).json({ success: false, message: 'Error procesando solicitud' });
        }
    }
}
