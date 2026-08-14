import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock' });

// SKILL-15: Copywriter AI
export async function generateCopy(goal: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'mock') {
        return `🌟 ¡Descubre nuestras promociones de verano! 🌟\n\nHemos preparado ofertas exclusivas basadas en tu objetivo: ${goal}.\n\n👉 ¡Haz clic aquí para más información!`;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [{
                        text: `Eres un Copywriter experto en marketing digital. Tu objetivo es escribir un post persuasivo y directo para redes sociales.
                        No incluyas explicaciones, solo el texto final del post con emojis y un Call to Action.
                        El objetivo del cliente es: "${goal}"`
                    }]
                }
            ]
        });
        
        return response.text || 'Texto por defecto de marketing.';
    } catch (error) {
        console.error('[Copywriter] Error:', error);
        throw new Error('No se pudo generar el copy.');
    }
}
