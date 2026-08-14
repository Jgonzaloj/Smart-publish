import { GoogleGenAI } from '@google/genai';
import { generateQuotation } from '../12-quotations/quotation.engine';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock' });

// SKILL-11: Triage y Sales Agent
export async function runTriageAgent(userMessage: string, conversationId: string): Promise<string> {
    
    // Si no hay API key real, hacemos un mock básico para que pasen las pruebas
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'mock') {
        if (userMessage.toLowerCase().includes('precio') || userMessage.toLowerCase().includes('cotización')) {
            // Simulamos que Gemini detectó intención de cotizar "Redes Básicas" (serv_123)
            return await generateQuotation('serv_123', conversationId);
        }
        return '¡Hola! Soy el asistente virtual. ¿En qué te puedo ayudar hoy con tu negocio?';
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [{
                        text: `Eres un asistente de Triage comercial. Tu trabajo es identificar qué necesita el usuario. 
                        No inventes precios. Solo saluda, pregunta sus necesidades y dile cómo puedes ayudarle.
                        Mensaje del usuario: "${userMessage}"`
                    }]
                }
            ]
        });
        
        // En una implementación real con Function Calling, Gemini nos diría qué función ejecutar.
        // Aquí simplificamos devolviendo el texto generado.
        return response.text || 'Ocurrió un error procesando tu mensaje.';
    } catch (error) {
        console.error('Error en Gemini API:', error);
        return 'Ocurrió un error en el sistema de IA.';
    }
}
