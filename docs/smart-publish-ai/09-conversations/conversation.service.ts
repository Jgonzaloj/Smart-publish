import { GoogleGenAI } from '@google/genai';
import { runTriageAgent } from '../11-sales-triage/triage.agent';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock' });

interface MessagePayload {
    channel: string;
    from: string;
    phoneNumberId?: string;
    text: string;
}

// Motor de Conversación (SKILL-09)
export async function handleIncomingMessage(payload: MessagePayload) {
    console.log(`[Conversation Engine] Recibido de ${payload.from} vía ${payload.channel}: "${payload.text}"`);

    // 1. Identificar conversación (simulado)
    const conversationId = `conv_${payload.from}`;
    
    // 2. Aquí cargaríamos el contexto previo de la base de datos (mensajes anteriores)
    
    // 3. Pasar el control al Agente Comercial / Triage (SKILL-11)
    const responseText = await runTriageAgent(payload.text, conversationId);

    // 4. Orquestar la respuesta
    await sendWhatsAppMessage(payload.phoneNumberId, payload.from, responseText);
}

// Simulador de envío a WhatsApp (parte de SKILL-10)
async function sendWhatsAppMessage(phoneNumberId: string | undefined, to: string, text: string) {
    console.log(`[WhatsApp API Mock] Enviando a ${to}: "${text}"`);
    
    if (!process.env.WHATSAPP_TOKEN) return; // Si no hay token, solo lo loguea (modo test)

    // Aquí iría el fetch real a la API de Graph
    /*
    await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to,
            text: { body: text }
        })
    });
    */
}
