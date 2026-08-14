"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationController = void 0;
const queue_service_1 = require("../services/queue.service");
const PostRepository_1 = require("../repositories/PostRepository");
const image_service_1 = require("../services/image.service");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const WorkspaceRepository_1 = require("../repositories/WorkspaceRepository");
const postRepository = new PostRepository_1.PostRepository();
const workspaceRepository = new WorkspaceRepository_1.WorkspaceRepository();
class AutomationController {
    // POST /api/automation/schedule
    static async schedulePost(req, res) {
        const { workspaceId, userId, platform, message, scheduledAt } = req.body;
        try {
            // Se usa el workspace del usuario autenticado (inyectado por authMiddleware)
            const activeWorkspaceId = req.user?.workspace_id;
            const activeUserId = req.user?.id;
            if (!activeWorkspaceId || !activeUserId) {
                return res.status(401).json({ success: false, message: 'Usuario no autenticado correctamente' });
            }
            let finalMediaUrl = undefined;
            // Si hay un archivo (imagen)
            if (req.file) {
                // Optimizar
                const optimized = await image_service_1.ImageService.optimizeImage(req.file.buffer, req.file.originalname);
                // Guardar en /uploads (relativo al root del proyecto)
                const fileName = `${Date.now()}-opt.jpg`;
                const uploadDir = path_1.default.join(process.cwd(), 'uploads');
                // Asegurar que el directorio de subidas exista
                if (!fs_1.default.existsSync(uploadDir)) {
                    fs_1.default.mkdirSync(uploadDir, { recursive: true });
                }
                const filePath = path_1.default.join(uploadDir, fileName);
                fs_1.default.writeFileSync(filePath, optimized.buffer);
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
                if (delayMs < 0)
                    return res.status(400).json({ success: false, message: 'La fecha debe ser a futuro' });
            }
            // 3. Encolar en BullMQ (siempre)
            let jobId = await queue_service_1.QueueService.enqueuePost({
                postId,
                workspaceId: activeWorkspaceId,
                platform,
                message,
                mediaUrl: finalMediaUrl,
                accountId: req.body.accountId // Añadido accountId
            }, delayMs);
            // 4. Actualizar Post a SCHEDULED y guardar el Job ID
            await postRepository.updateStatus(postId, 'SCHEDULED', jobId);
            // 5. Increment usage
            if (activeWorkspaceId) {
                await workspaceRepository.incrementPostUsage(activeWorkspaceId);
            }
            return res.json({ success: true, message: 'Post programado en BullMQ', data: { postId, jobId } });
        }
        catch (error) {
            console.error('Error scheduling:', error);
            res.status(500).json({ success: false, message: 'Error al procesar el post (Verifica Redis)' });
        }
    }
    // POST /api/automation/cancel/:postId
    static async cancelPost(req, res) {
        const { postId } = req.params;
        try {
            const post = await postRepository.findById(postId);
            if (!post)
                return res.status(404).json({ success: false, message: 'Post no encontrado' });
            if (post.status !== 'SCHEDULED')
                return res.status(400).json({ success: false, message: 'Post no está programado' });
            // Eliminar de la cola de Redis
            if (post.bullmq_job_id) {
                await queue_service_1.QueueService.removeJob(post.bullmq_job_id);
            }
            // Actualizar estado en BD
            await postRepository.updateStatus(postId, 'CANCELLED', null);
            res.json({ success: true, message: 'Post cancelado exitosamente' });
        }
        catch (error) {
            console.error('Error canceling:', error);
            res.status(500).json({ success: false, message: 'Error al cancelar' });
        }
    }
    // POST /api/automation/retry/:postId
    static async retryPost(req, res) {
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Error al reintentar' });
        }
    }
}
exports.AutomationController = AutomationController;
