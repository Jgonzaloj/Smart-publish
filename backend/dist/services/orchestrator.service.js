"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentOrchestrator = exports.AgentIntent = void 0;
const generative_ai_1 = require("@google/generative-ai");
var AgentIntent;
(function (AgentIntent) {
    AgentIntent["SALES_INQUIRY"] = "SALES_INQUIRY";
    AgentIntent["MARKETING_COMMAND"] = "MARKETING_COMMAND";
    AgentIntent["SUPPORT"] = "SUPPORT";
    AgentIntent["UNKNOWN"] = "UNKNOWN";
})(AgentIntent || (exports.AgentIntent = AgentIntent = {}));
class AgentOrchestrator {
    genAI;
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || '';
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    /**
     * Enruta el mensaje determinando la intención del usuario.
     * Es ultra-rápido porque pide una salida corta y estricta en JSON.
     */
    async routeMessage(message) {
        if (!process.env.GEMINI_API_KEY) {
            return AgentIntent.SALES_INQUIRY; // Default si no hay key
        }
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
            const prompt = `Actúa como un router de intenciones. Lee el siguiente mensaje de un usuario y clasifícalo.
            
Reglas de Clasificación:
- SALES_INQUIRY: Preguntas sobre productos, precios, dudas generales, o si es un cliente queriendo comprar.
- MARKETING_COMMAND: Órdenes directas del dueño del negocio para crear contenido, campañas, o agendar posts en redes sociales (ej. "crea un post", "programa una campaña").
- SUPPORT: Quejas, reclamos o problemas técnicos.

Mensaje: "${message}"

Responde ÚNICAMENTE en formato JSON estricto con la clave "intent". Ejemplo: {"intent": "SALES_INQUIRY"}`;
            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(text);
            if (Object.values(AgentIntent).includes(parsed.intent)) {
                return parsed.intent;
            }
            return AgentIntent.UNKNOWN;
        }
        catch (error) {
            console.error('[AgentOrchestrator] Error al rutear mensaje:', error);
            // Default safe fallback
            return AgentIntent.SALES_INQUIRY;
        }
    }
}
exports.AgentOrchestrator = AgentOrchestrator;
