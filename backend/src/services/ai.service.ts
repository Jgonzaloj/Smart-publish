import { GoogleGenerativeAI } from '@google/generative-ai';

export class AiService {
    private genAI: GoogleGenerativeAI;
    
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || '';
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateSocialMediaPost(topic: string, platform: string = 'General'): Promise<string> {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('Falta configurar GEMINI_API_KEY en el entorno.');
        }

        const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `Actúa como un experto Community Manager. Escribe una publicación altamente atractiva para redes sociales (${platform}) sobre el siguiente tema: "${topic}". 
        
Reglas:
- Sé persuasivo y usa técnicas de copywriting.
- Incluye emojis relevantes.
- Añade 3-5 hashtags al final.
- No incluyas explicaciones adicionales, solo el texto final del post.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    }
}
