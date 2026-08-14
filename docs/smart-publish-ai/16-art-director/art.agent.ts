import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock' });

// SKILL-16: Art Director AI
export async function generateVisualConcept(goal: string, copy: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'mock') {
        return `Una fotografía luminosa de personas felices disfrutando del verano, en formato cuadrado para Instagram. Colores vibrantes acordes al texto.`;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [{
                        text: `Eres un Director de Arte de una agencia de publicidad. Tu trabajo es leer el texto de un post y proponer un concepto visual (o prompt para DALL-E/Midjourney).
                        Debe ser detallado, indicando estilo visual, paleta de colores sugerida y formato.
                        Objetivo de la campaña: "${goal}"
                        Texto del post (Copy): "${copy}"`
                    }]
                }
            ]
        });
        
        return response.text || 'Concepto visual estándar.';
    } catch (error) {
        console.error('[Art Director] Error:', error);
        throw new Error('No se pudo generar el concepto visual.');
    }
}
