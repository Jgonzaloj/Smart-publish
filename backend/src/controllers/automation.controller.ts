import { Request, Response } from 'express';
import { QueueService } from '../services/queue.service';
import { PostRepository } from '../repositories/PostRepository';
import { ImageService } from '../services/image.service';
import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';

const postRepository = new PostRepository();

export class AutomationController {
    
    // POST /api/automation/schedule
    static async schedulePost(req: Request, res: Response) {
        const { workspaceId, userId, platform, message, scheduledAt } = req.body;
        
        try {
            let activeWorkspaceId = workspaceId;
            let activeUserId = userId;

            // 0. Obtener o crear Workspace y User por defecto para evitar error de Foreign Key
            if (!activeWorkspaceId || activeWorkspaceId === 'ws-1') {
                const [wsRows] = await pool.query<RowDataPacket[]>('SELECT id FROM workspaces LIMIT 1');
                if (wsRows.length > 0) {
                    activeWorkspaceId = wsRows[0].id;
                } else {
                    activeWorkspaceId = uuidv4();
                    await pool.query('INSERT INTO workspaces (id, name) VALUES (?, ?)', [activeWorkspaceId, 'Default Workspace']);
                }
            }

            if (!activeUserId || activeUserId === 'user-1') {
                const [userRows] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE workspace_id = ? LIMIT 1', [activeWorkspaceId]);
                if (userRows.length > 0) {
                    activeUserId = userRows[0].id;
                } else {
                    activeUserId = uuidv4();
                    await pool.query('INSERT INTO users (id, workspace_id, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', 
                        [activeUserId, activeWorkspaceId, `test-${Date.now()}@example.com`, 'hash', 'ADMIN']);
                }
            }

            let finalMediaUrl: string | undefined = undefined;

            // Si hay un archivo (imagen)
            if (req.file) {
                // Optimizar
                const optimized = await ImageService.optimizeImage(req.file.buffer, req.file.originalname);
                // Guardar en /uploads (relativo al root del proyecto)
                const fileName = `${Date.now()}-opt.jpg`;
                const uploadDir = path.join(process.cwd(), 'uploads');
                
                // Asegurar que el directorio de subidas exista
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                
                const filePath = path.join(uploadDir, fileName);
                fs.writeFileSync(filePath, optimized.buffer);
                
                finalMediaUrl = `/uploads/${fileName}`;
            }

            // 1. Guardar el Post en BD como DRAFT primero
            const postId = await postRepository.create({
                workspace_id: activeWorkspaceId,
                user_id: activeUserId,
                content: message,
                status: 'DRAFT',
                scheduled_at: scheduledAt ? new Date(scheduledAt) : undefined,
                media_url: finalMediaUrl
            });

            // 2. Calcular delay
            let delayMs = 0;
            if (scheduledAt) {
                delayMs = new Date(scheduledAt).getTime() - Date.now();
                if (delayMs < 0) return res.status(400).json({ success: false, message: 'La fecha debe ser a futuro' });
            }

            // 3. Encolar en BullMQ (siempre)
                let jobId = await QueueService.enqueuePost({
                    postId,
                    workspaceId: workspaceId || 'ws-1',
                    platform,
                    message,
                    mediaUrl: finalMediaUrl,
                    accountId: req.body.accountId // Añadido accountId
                }, delayMs);
                
                // 4. Actualizar Post a SCHEDULED y guardar el Job ID
                await postRepository.updateStatus(postId, 'SCHEDULED', jobId);
                return res.json({ success: true, message: 'Post programado en BullMQ', data: { postId, jobId } });
            }

        } catch (error: any) {
            console.error('Error scheduling:', error);
            res.status(500).json({ success: false, message: 'Error al procesar el post (Verifica Redis)' });
        }
    }

    // POST /api/automation/cancel/:postId
    static async cancelPost(req: Request, res: Response) {
        const { postId } = req.params;
        try {
            const post = await postRepository.findById(postId);
            if (!post) return res.status(404).json({ success: false, message: 'Post no encontrado' });
            if (post.status !== 'SCHEDULED') return res.status(400).json({ success: false, message: 'Post no está programado' });

            // Eliminar de la cola de Redis
            if (post.bullmq_job_id) {
                await QueueService.removeJob(post.bullmq_job_id);
            }

            // Actualizar estado en BD
            await postRepository.updateStatus(postId, 'CANCELLED', null as any);

            res.json({ success: true, message: 'Post cancelado exitosamente' });
        } catch (error) {
            console.error('Error canceling:', error);
            res.status(500).json({ success: false, message: 'Error al cancelar' });
        }
    }

    // POST /api/automation/retry/:postId
    static async retryPost(req: Request, res: Response) {
        const { postId } = req.params;
        try {
            const post = await postRepository.findById(postId);
            if (!post || post.status !== 'FAILED') {
                return res.status(400).json({ success: false, message: 'Solo se pueden reintentar posts fallidos' });
            }

            // Aquí clonaríamos o re-encolaríamos (por simplicidad, asumimos platform desde el payload frontend MVP)
            // Se requeriría cargar la tabla de destinos para saber a dónde iba
            // MVP: Clonamos y el frontend re-agenda.
            const newPostId = await postRepository.duplicate(postId);

            res.json({ success: true, message: 'Post duplicado para reintento', data: { newPostId } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al reintentar' });
        }
    }
}
