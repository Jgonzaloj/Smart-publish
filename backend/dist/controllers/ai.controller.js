"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const axios_1 = __importDefault(require("axios"));
const WorkspaceRepository_1 = require("../repositories/WorkspaceRepository");
const workspaceRepository = new WorkspaceRepository_1.WorkspaceRepository();
class AiController {
    static async suggestPost(req, res) {
        const { topic } = req.body;
        if (!topic) {
            return res.status(400).json({ success: false, message: 'El tema es requerido' });
        }
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, message: 'Falta configurar GROQ_API_KEY en el servidor' });
        }
        try {
            const prompt = `Actúa como un experto Community Manager. Escribe una publicación altamente atractiva para redes sociales (Facebook/Instagram) sobre el siguiente tema: "${topic}". 
            
Reglas:
- Sé persuasivo y usa técnicas de copywriting.
- Incluye emojis relevantes.
- Añade 3-5 hashtags al final.
- No incluyas explicaciones adicionales, solo el texto final del post.`;
            const aiResponse = await axios_1.default.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }]
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const text = aiResponse.data.choices[0].message.content;
            // Increment usage
            const workspaceId = req.user?.workspace_id;
            if (workspaceId) {
                await workspaceRepository.incrementAiUsage(workspaceId);
            }
            res.json({
                success: true,
                data: text.trim()
            });
        }
        catch (error) {
            console.error('Error generando contenido con IA:', error);
            res.status(500).json({ success: false, message: 'Error interno de Inteligencia Artificial' });
        }
    }
    static async generateImage(req, res) {
        const { topic } = req.body;
        const workspaceId = req.user?.workspace_id;
        if (!topic) {
            return res.status(400).json({ success: false, message: 'El tema es requerido para generar la imagen' });
        }
        if (!workspaceId) {
            return res.status(401).json({ success: false, message: 'No autorizado' });
        }
        // Ya no requerimos HUGGINGFACE_API_KEY porque Pollinations.ai no usa API key.
        try {
            // 1. Usar Groq para mejorar el prompt (traducirlo a inglés y añadir detalles profesionales)
            const groqApiKey = process.env.GROQ_API_KEY;
            let finalPrompt = `High quality, professional photography, clean composition, social media ready, no text: ${topic}`;
            if (groqApiKey) {
                try {
                    const aiResponse = await axios_1.default.post('https://api.groq.com/openai/v1/chat/completions', {
                        model: 'llama-3.1-8b-instant',
                        messages: [{
                                role: 'user',
                                content: `Act as an expert AI image prompt engineer. Translate this concept to English and write a highly detailed, descriptive prompt for an AI image generator (like Midjourney or FLUX) to create a stunning, professional social media image about: "${topic}". Rules: Do NOT include any text, letters, or words in the image. Make it photorealistic, well-lit, and visually striking. ONLY output the prompt directly, nothing else.`
                            }]
                    }, {
                        headers: {
                            'Authorization': `Bearer ${groqApiKey}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    finalPrompt = aiResponse.data.choices[0].message.content.trim();
                }
                catch (groqError) {
                    console.error('Error mejorando prompt con Groq, usando prompt por defecto:', groqError);
                }
            }
            // 2. Llamada a Pollinations AI (usando el modelo FLUX para resultados hiperrealistas)
            const encodedPrompt = encodeURIComponent(finalPrompt);
            const hfResponse = await axios_1.default.get(`https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&model=flux`, { responseType: 'arraybuffer' });
            // Convertir a base64
            const base64 = Buffer.from(hfResponse.data, 'binary').toString('base64');
            const dataUrl = `data:image/jpeg;base64,${base64}`;
            // Incrementar uso
            await workspaceRepository.incrementImageUsage(workspaceId);
            res.json({
                success: true,
                data: dataUrl
            });
        }
        catch (error) {
            console.error('Error generando imagen con IA:', error?.response?.data?.toString() || error.message);
            res.status(500).json({ success: false, message: 'Error interno al generar imagen' });
        }
    }
}
exports.AiController = AiController;
