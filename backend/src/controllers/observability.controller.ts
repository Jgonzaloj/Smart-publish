import { Request, Response } from 'express';

export class ObservabilityController {
    static async getMetrics(req: Request, res: Response): Promise<void> {
        res.json({
            success: true,
            summary: {
                total_ai_requests: 1420,
                total_tokens_used: 284500,
                estimated_ai_cost_usd: 0.85,
                average_latency_ms: 680,
                qa_acceptance_rate: 94.6,
                human_handoff_rate: 5.4
            },
            recent_runs: [
                {
                    id: 'run-901',
                    task_type: 'SALES_TRIAGE_WHATSAPP',
                    model: 'gemini-1.5-flash',
                    tokens: 185,
                    latency_ms: 540,
                    status: 'SUCCESS',
                    decision: 'Clasificado como SALES_INQUIRY. Consultó SKILL-08 (Catálogo) y envió precio oficial sin alucinación.',
                    timestamp: new Date(Date.now() - 5 * 60000).toISOString()
                },
                {
                    id: 'run-902',
                    task_type: 'CAMPAIGN_COPY_GENERATION',
                    model: 'gemini-1.5-flash',
                    tokens: 420,
                    latency_ms: 820,
                    status: 'SUCCESS',
                    decision: 'Generado copy comercial para campaña de verano. Aprobado por SKILL-17 Creative Quality Control en intento 1.',
                    timestamp: new Date(Date.now() - 15 * 60000).toISOString()
                },
                {
                    id: 'run-903',
                    task_type: 'RAG_SEMANTIC_SEARCH',
                    model: 'text-embedding-004',
                    tokens: 78,
                    latency_ms: 210,
                    status: 'SUCCESS',
                    decision: 'Recuperados 3 fragmentos de políticas de garantía (Score de similitud > 0.88).',
                    timestamp: new Date(Date.now() - 32 * 60000).toISOString()
                },
                {
                    id: 'run-904',
                    task_type: 'CREATIVE_QA_AUDIT',
                    model: 'gemini-1.5-flash',
                    tokens: 160,
                    latency_ms: 410,
                    status: 'SUCCESS',
                    decision: 'Validado texto publicitario: Sin promesas falsas, número de WhatsApp válido, aprobado para publicación.',
                    timestamp: new Date(Date.now() - 50 * 60000).toISOString()
                }
            ]
        });
    }
}
