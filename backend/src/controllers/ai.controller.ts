import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { WorkspaceRepository } from '../repositories/WorkspaceRepository';

const workspaceRepository = new WorkspaceRepository();

export class AiController {
    static async suggestPost(req: Request, res: Response) {
        const { topic } = req.body;

        if (!topic) {
            return res.status(400).json({ success: false, message: 'El tema es requerido' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, message: 'Falta configurar GEMINI_API_KEY en el servidor' });
        }

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

            const prompt = `Actúa como un experto Community Manager. Escribe una publicación altamente atractiva para redes sociales (Facebook/Instagram) sobre el siguiente tema: "${topic}". 
            
Reglas:
- Sé persuasivo y usa técnicas de copywriting.
- Incluye emojis relevantes.
- Añade 3-5 hashtags al final.
- No incluyas explicaciones adicionales, solo el texto final del post.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Increment usage
            const workspaceId = (req as any).user?.workspace_id;
            if (workspaceId) {
                await workspaceRepository.incrementAiUsage(workspaceId);
            }

            res.json({
                success: true,
                data: text.trim()
            });
        } catch (error) {
            console.error('Error generando contenido con IA:', error);
            res.status(500).json({ success: false, message: 'Error interno de Inteligencia Artificial' });
        }
    }
}
