import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { AiService } from '../services/ai.service';
import { ConversationRepository } from '../repositories/ConversationRepository';
import { AgentOrchestrator, AgentIntent } from '../services/orchestrator.service';
import { QueueService } from '../services/queue.service';
import crypto from 'crypto';

const aiService = new AiService();
const conversationRepo = new ConversationRepository();
const orchestrator = new AgentOrchestrator();

export const whatsappWorker = new Worker('whatsappQueue', async (job: Job) => {
    const { workspaceId, payload } = job.data;
    console.log(`[WhatsAppWorker] Procesando evento para workspace ${workspaceId}. Job ID: ${job.id}`);

    try {
        // 1. Extraer el mensaje del cliente del payload de WhatsApp
        // (Estructura típica de Cloud API)
        const messages = payload.entry?.[0]?.changes?.[0]?.value?.messages;
        if (!messages || messages.length === 0) {
            console.log(`[WhatsAppWorker] No hay mensajes en el payload.`);
            return;
        }

        const incomingMsg = messages[0];
        const clientPhone = incomingMsg.from;
        const msgText = incomingMsg.text?.body || '';

        if (!msgText) {
            console.log(`[WhatsAppWorker] Mensaje no es de texto. Ignorando.`);
            return;
        }

        // 2. Orquestación: Detección de Intención
        const intent = await orchestrator.routeMessage(msgText);
        console.log(`[WhatsAppWorker] Intención detectada: ${intent}`);

        if (intent === AgentIntent.MARKETING_COMMAND) {
            // Enrutar a la Agencia de Marketing (Campaign Worker)
            console.log(`[WhatsAppWorker] Enrutando comando a Marketing Agent...`);
            
            // Creamos una campaña en BD (mock id para MVP)
            const campaignId = crypto.randomUUID();
            
            // En el mundo real, aquí insertaríamos la orden de la campaña en la tabla 'campaigns'
            // basado en lo que pidió el usuario en msgText. Para el MVP, simplemente
            // lo mandamos a la cola de marketing y le avisamos al cliente.
            
            await conversationRepo.saveMessage(workspaceId, clientPhone, 'user', msgText);
            const replyText = '¡Entendido! He enviado tu orden al Agente de Marketing. Me encargaré de crear y validar la campaña solicitada.';
            await conversationRepo.saveMessage(workspaceId, clientPhone, 'assistant', replyText);
            
            // await sendWhatsAppMessage(clientPhone, replyText);
            
            return { success: true, routedTo: 'MARKETING', replyText };
        }

        // 3. Flujo normal de Ventas / Soporte (Triage Agent + RAG)
        // Persistencia de Historial (Fase 2 + Fase Final)
        const history = await conversationRepo.getHistory(workspaceId, clientPhone);

        // Guardamos el mensaje actual
        await conversationRepo.saveMessage(workspaceId, clientPhone, 'user', msgText);

        // Generar respuesta con Gemini (con Circuit Breaker y RAG)
        const replyText = await aiService.generateWhatsAppReply(workspaceId, clientPhone, msgText, history);

        // Guardar la nueva respuesta en el historial
        await conversationRepo.saveMessage(workspaceId, clientPhone, 'assistant', replyText);

        // Enviar la respuesta de vuelta a WhatsApp (Llamada a la API de Meta)
        console.log(`[WhatsAppWorker] Respuesta generada para ${clientPhone}: ${replyText}`);
        // await sendWhatsAppMessage(clientPhone, replyText);

        return { success: true, replyText };
    } catch (error: any) {
        console.error(`[WhatsAppWorker] Error procesando job ${job.id}:`, error.message);
        
        // Lógica de Fallback
        console.log(`[WhatsAppWorker] Ejecutando Fallback: Transfiriendo a humano para el cliente...`);
        // await sendWhatsAppMessage(clientPhone, "En este momento estoy teniendo problemas técnicos. Un humano te contactará en breve.");
        
        throw error;
    }
}, { connection: redisConnection });

whatsappWorker.on('completed', (job) => {
    console.log(`[WhatsAppWorker] Job ${job.id} completado con éxito`);
});

whatsappWorker.on('failed', (job, err) => {
    console.log(`[WhatsAppWorker] Job ${job?.id} falló: ${err.message}`);
});
