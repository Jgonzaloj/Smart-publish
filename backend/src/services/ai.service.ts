import { GoogleGenerativeAI } from '@google/generative-ai';
import { RagService } from './rag.service';

export class AiService {
    private genAI: GoogleGenerativeAI;
    private ragService: RagService;
    
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || '';
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.ragService = new RagService();
    }

    async generateSocialMediaPost(topic: string, platform: string = 'General', feedback?: string): Promise<string> {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('Falta configurar GEMINI_API_KEY en el entorno.');
        }

        const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        let prompt = `Actúa como un experto Community Manager. Escribe una publicación altamente atractiva para redes sociales (${platform}) sobre el siguiente tema: "${topic}". 
        
Reglas:
- Sé persuasivo y usa técnicas de copywriting.
- Incluye emojis relevantes.
- Añade 3-5 hashtags al final.
- No incluyas explicaciones adicionales, solo el texto final del post.`;

        if (feedback) {
            prompt += `\n\nATENCIÓN: Tu intento anterior fue rechazado por QA. Aplica esta corrección obligatoriamente:\n${feedback}`;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    }

    /**
     * QA Auditor: Evalúa si el post cumple con calidad
     */
    async evaluatePost(content: string, topic: string): Promise<{approved: boolean, feedback: string}> {
        if (!process.env.GEMINI_API_KEY) {
            return { approved: true, feedback: '' }; // Bypass si no hay key
        }
        
        const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const prompt = `Actúa como un Auditor QA estricto. Evalúa el siguiente post para redes sociales sobre "${topic}".
        
Post: "${content}"

¿El post es persuasivo, contiene emojis y hashtags, y NO contiene texto innecesario?
Responde en formato JSON estricto: {"approved": true/false, "feedback": "Razón del rechazo o vacío"}`;

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(text);
            return parsed;
        } catch (e) {
            console.error("Error en QA Auditor, aprobando por defecto", e);
            return { approved: true, feedback: '' };
        }
    }

    /**
     * Genera una respuesta para WhatsApp usando historial.
     * Implementa un patrón de Timeout (Circuit Breaker básico) para disparar Fallback.
     */
    async generateWhatsAppReply(workspaceId: string, clientPhone: string, message: string, history: any[]): Promise<string> {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('Falta configurar GEMINI_API_KEY en el entorno.');
        }

        const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        // 1. Construir contexto con el historial
        let contextText = history.map(h => `${h.role === 'user' ? 'Cliente' : 'Asistente'}: ${h.content}`).join('\n');
        
        // 2. RAG: Buscar conocimiento específico de la empresa
        const ragContexts = await this.ragService.searchContext(workspaceId, message);
        let ragPromptSection = '';
        if (ragContexts.length > 0) {
            ragPromptSection = `\nBASE DE CONOCIMIENTO DE LA EMPRESA (Úsala para responder si aplica):\n${ragContexts.join('\n---\n')}\n`;
        }
        
        const prompt = `Eres un asistente de ventas inteligente (Triage Agent).${ragPromptSection}
Historial de la conversación:
${contextText}

Mensaje actual del cliente: "${message}"

Responde de manera concisa y amigable para WhatsApp. Basándote estrictamente en la base de conocimiento si la hay.`;

        // Wrapper con Timeout (Circuit Breaker)
        const timeoutMs = 8000; // 8 segundos máximo para responder
        
        const generatePromise = model.generateContent(prompt).then(res => res.response.text().trim());
        
        const timeoutPromise = new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT_GEMINI')), timeoutMs);
        });

        try {
            const reply = await Promise.race([generatePromise, timeoutPromise]);
            return reply;
        } catch (error: any) {
            console.error(`[AiService] Error en generateWhatsAppReply: ${error.message}`);
            // El fallback se maneja en el worker lanzando el error
            throw error;
        }
    }
}
