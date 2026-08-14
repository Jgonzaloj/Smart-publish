import { Request, Response } from 'express';
import { RagService } from '../services/rag.service';

const ragService = new RagService();

export class KnowledgeController {
    
    /**
     * Sube un archivo de texto para ser procesado por el RAG (Embeddings)
     * POST /api/knowledge/upload
     */
    static async uploadKnowledge(req: Request, res: Response) {
        try {
            // El tenantMiddleware inyecta el workspaceId
            const workspaceId = req.workspaceId;
            if (!workspaceId) {
                return res.status(403).json({ error: 'Workspace requerido' });
            }

            // Para el MVP, asumimos que el cliente envía el texto plano en el body
            // (En un futuro usaríamos multer para subir un PDF y pdf-parse para extraer el texto)
            const textContent = req.body.text;

            if (!textContent || textContent.trim().length === 0) {
                return res.status(400).json({ error: 'El campo "text" está vacío.' });
            }

            // Llamamos al RagService para generar embeddings y guardarlos
            const chunksProcessed = await ragService.ingestDocument(workspaceId, textContent);

            return res.status(200).json({
                message: 'Conocimiento procesado exitosamente',
                chunks: chunksProcessed
            });

        } catch (error: any) {
            console.error('[KnowledgeController] Error:', error.message);
            return res.status(500).json({ error: 'Error procesando documento.' });
        }
    }
}
