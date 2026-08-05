import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key';
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
}
