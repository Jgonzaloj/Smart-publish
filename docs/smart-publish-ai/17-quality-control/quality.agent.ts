import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock' });

interface QAResult {
    approved: boolean;
    reason: string;
}

// SKILL-17: Quality Control AI
export async function runQualityControl(copy: string, visualConcept: string): Promise<QAResult> {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'mock') {
        // En mock siempre aprobamos para que fluya
        return { approved: true, reason: 'Aprobado automáticamente (Modo Pruebas).' };
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [{
                        text: `Eres el Auditor de Calidad de una agencia. Verifica si este copy y concepto visual son adecuados para publicar (sin groserías, sin promesas falsas exageradas).
                        Responde EXCLUSIVAMENTE con un JSON en este formato: {"approved": true/false, "reason": "tu justificación"}.
                        Copy: "${copy}"
                        Arte: "${visualConcept}"`
                    }]
                }
            ]
        });
        
        const rawJson = response.text?.replace(/```json/g, '').replace(/```/g, '') || '{}';
        return JSON.parse(rawJson);
    } catch (error) {
        console.error('[Quality Control] Error:', error);
        return { approved: false, reason: 'Error interno al validar la calidad.' };
    }
}
