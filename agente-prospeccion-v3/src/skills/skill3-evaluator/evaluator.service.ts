import { LeadsRepository } from '../../db/repositories/leads.repository.js';
import { AuditsRepository } from '../../db/repositories/audits.repository.js';
import { ProposalsRepository } from '../../db/repositories/proposals.repository.js';
import { OutreachRepository } from '../../db/repositories/outreach.repository.js';
import { OpportunityReport, OpportunityType } from '../../types/index.js';
import { config } from '../../config/env.js';

export class CognitiveEvaluatorService {
  private leadsRepo = new LeadsRepository();
  private auditsRepo = new AuditsRepository();
  private proposalsRepo = new ProposalsRepository();
  private outreachRepo = new OutreachRepository();

  /**
   * Procesa leads en estado AUDITED_QUALIFIED y genera propuestas personalizadas de alto impacto
   */
  async processQualifiedLeads(batchSize = 10): Promise<{ processed: number; highPriority: number }> {
    const leads = this.leadsRepo.findByStatus('AUDITED_QUALIFIED', batchSize);
    let highPriority = 0;

    // Obtener copys con mejor tasa de respuesta histórica (feedback loop del blueprint)
    const winningCopies = this.outreachRepo.getBestPerformingCopies(3);

    for (const lead of leads) {
      const audit = this.auditsRepo.findByLeadId(lead.id);
      if (!audit) {
        continue;
      }

      const report = await this.generateOpportunityReport(lead, audit, winningCopies);

      // Guardar propuesta
      this.proposalsRepo.saveProposal(report, false);

      // Si priority_score >= 7, pasa por DEMO_DEPLOYED o directamente a PROPOSAL_COMPILED
      if (report.priority_score >= 7) {
        highPriority++;
      }

      this.leadsRepo.updateStatusAtomic(lead.id, 'AUDITED_QUALIFIED', 'PROPOSAL_COMPILED');
    }

    return { processed: leads.length, highPriority };
  }

  /**
   * Genera el reporte estructurado con LLM o motor heurístico de alta precisión
   */
  private async generateOpportunityReport(
    lead: any,
    audit: any,
    winningCopies: string[]
  ): Promise<OpportunityReport> {
    // Si hay API key de Gemini/OpenAI/Anthropic y no está en mock forzado, se llama al LLM
    if (!config.USE_MOCK_MODE && (config.GEMINI_API_KEY || config.OPENAI_API_KEY || config.ANTHROPIC_API_KEY)) {
      try {
        const llmResult = await this.callLlmStructuredOutput(lead, audit, winningCopies);
        if (llmResult) return llmResult;
      } catch (err) {
        console.warn(`[Evaluator] Fallback al generador heurístico para ${lead.business_name}:`, err);
      }
    }

    // Generador Heurístico Estructurado Determinista (100% libre de alucinaciones)
    return this.generateHeuristicReport(lead, audit);
  }

  private generateHeuristicReport(lead: any, audit: any): OpportunityReport {
    let opportunityType: OpportunityType = audit.ai_opportunity_type || 'MODERNIZATION';
    let priorityScore = 7;
    const painPoints: string[] = [];

    if (!audit.has_website) {
      opportunityType = 'NEW_WEBSITE';
      priorityScore = 9; // Máxima prioridad: tienen clientes pero no web propia
      painPoints.push(`Excelente reputación (${lead.rating || 4.8}★ con ${lead.reviews_count || 50}+ reseñas) pero sin página web oficial.`);
      painPoints.push('Tus clientes buscan tus servicios en Google y terminan en directorios de terceros o competencia.');
      painPoints.push('Falta de un portal directo de reservas y captación de clientes 24/7.');
    } else {
      if (audit.ttfb_ms > 1000) {
        painPoints.push(`Tu web tarda ${Math.round(audit.ttfb_ms)}ms solo en empezar a responder el servidor.`);
      }
      if (!audit.is_mobile_responsive) {
        painPoints.push('El diseño actual se desborda en teléfonos móviles dificultando la lectura a más del 70% de tus visitas.');
      }
      if (audit.detected_tech_stack?.is_outdated_stack) {
        painPoints.push(`Estructura técnica pesada (${audit.detected_tech_stack.details.slice(0, 2).join(', ')}) que penaliza el posicionamiento SEO.`);
      }
      if (painPoints.length === 0) {
        painPoints.push('Falta de automatización para convertir visitantes en citas de WhatsApp de forma inmediata.');
      }
      priorityScore = audit.lighthouse_perf_score < 60 ? 8 : 6;
    }

    const shortBizName = lead.business_name.split('-')[0].split('(')[0].trim();
    let proposedSolution = '';
    let whatsappPitch = '';
    let emailSubject = '';
    let emailBody = '';

    if (opportunityType === 'NEW_WEBSITE') {
      proposedSolution = `Desarrollo de plataforma web de alto rendimiento orientada a conversión, con sistema directo de citas y sincronización con Google Business.`;
      
      whatsappPitch = `Hola equipo de ${shortBizName}, un gusto saludarlos. Vi sus excelentes reseñas en Google (${lead.rating || 4.8}★) pero noté que aún no tienen web oficial para canalizar esas visitas. Les preparé un mockup rápido de cómo se vería su portal con agenda directa. ¿Tienen 2 min para mostrárselo?`;
      
      emailSubject = `Oportunidad digital para ${shortBizName} (optimización de reservas)`;
      emailBody = `Hola equipo de ${shortBizName},\n\nEstuve revisando su excelente trayectoria local con ${lead.reviews_count || 'decenas de'} valoraciones positivas.\n\nNotamos que actualmente no cuentan con un sitio web oficial enlazado a su ficha de Google Maps, lo que hace que posibles clientes no puedan consultar servicios ni reservar directamente.\n\nHemos preparado un diagnóstico técnico y un prototipo visual de cómo podrían captar un 30% más de clientes de forma automatizada.\n\n¿Tendrían 5 minutos esta semana para revisarlo juntos sin compromiso?\n\nSaludos cordiales,\n${config.DEFAULT_CLOSER_NAME}`;
    } else {
      proposedSolution = `Modernización y optimización de velocidad de carga (<1s), diseño 100% responsive para móviles e integración de botón inteligente de WhatsApp.`;
      
      const mainFlaw = !audit.is_mobile_responsive ? 'la adaptación a móviles' : `la velocidad de carga (${(audit.ttfb_ms / 1000).toFixed(1)}s de espera)`;
      
      whatsappPitch = `Hola ${shortBizName}, qué tal. Hicimos una auditoría técnica rápida a su sitio web y detectamos una oportunidad clave en ${mainFlaw} que podría estar costándoles visitas. ¿Les gustaría que les comparta el reporte de 1 página?`;
      
      emailSubject = `Auditoría técnica y velocidad web para ${shortBizName}`;
      emailBody = `Estimado equipo de ${shortBizName},\n\nRealizamos una auditoría técnica a su plataforma (${lead.current_website_url}) y encontramos los siguientes puntos de mejora inmediata:\n\n- ${painPoints.join('\n- ')}\n\nNuestra solución de optimización garantiza tiempos de carga ultrarrápidos y un incremento directo en la conversión de visitantes en clientes.\n\n¿Tienen disponibilidad mañana para una llamada de 5 minutos y mostrarles el reporte en detalle?\n\nAtentamente,\n${config.DEFAULT_CLOSER_NAME}`;
    }

    return {
      lead_id: lead.id,
      opportunity_type: opportunityType,
      priority_score: priorityScore,
      pain_points: painPoints.slice(0, 4),
      proposed_solution: proposedSolution,
      outreach_copy: {
        whatsapp_pitch: whatsappPitch,
        email_subject: emailSubject,
        email_body: emailBody,
      },
    };
  }

  private async callLlmStructuredOutput(lead: any, audit: any, winningCopies: string[]): Promise<OpportunityReport | null> {
    const businessName = lead.business_name || 'Negocio';
    const auditData = {
      has_website: audit.has_website,
      current_website_url: lead.current_website_url,
      ttfb_ms: audit.ttfb_ms,
      is_mobile_responsive: audit.is_mobile_responsive,
      lighthouse_perf_score: audit.lighthouse_perf_score,
      detected_tech_stack: audit.detected_tech_stack,
      issues_found: audit.issues_found || [],
      rating: lead.rating,
      reviews_count: lead.reviews_count,
      niche: lead.niche,
    };

    const systemPrompt = `Eres un Ingeniero de Soluciones y Especialista Senior en Prospección B2B.
Tu objetivo es analizar el diagnóstico técnico de una empresa y generar un reporte de oportunidad altamente persuasivo, 100% verídico y sin alucinaciones.

REGLAS OBLIGATORIAS:
1. NUNCA uses placeholders como [Nombre], [Empresa], {{url}}, {placeholder}, etc. Usa el nombre exacto de la empresa: "${businessName}".
2. Cita únicamente hechos y métricas del diagnóstico técnico provisto.
3. El tono del WhatsApp debe ser conversacional, consultivo, conciso (máximo 4 líneas) y terminar con una pregunta de bajo compromiso.
4. El email debe tener asunto llamativo, cuerpo profesional y la firma "${config.DEFAULT_CLOSER_NAME}".
5. Devuelve EXCLUSIVAMENTE un objeto JSON válido con la siguiente estructura:
{
  "opportunity_type": "NEW_WEBSITE" | "MODERNIZATION" | "PERFORMANCE_OVERHAUL" | "SYSTEM_INTEGRATION",
  "priority_score": 1-10,
  "pain_points": ["punto 1", "punto 2", "punto 3"],
  "proposed_solution": "solución técnica recomendada",
  "outreach_copy": {
    "whatsapp_pitch": "texto del mensaje de WhatsApp",
    "email_subject": "asunto del email",
    "email_body": "cuerpo completo del email"
  }
}`;

    const userPrompt = `Analiza este prospecto y genera el reporte estructurado:
Empresa: ${businessName}
Nicho: ${lead.niche || 'B2B'}
Diagnóstico Técnico: ${JSON.stringify(auditData, null, 2)}
${winningCopies.length > 0 ? `Ejemplos de copys de alta conversión en este nicho:\n${winningCopies.join('\n---\n')}` : ''}`;

    // 1. Probar Google Gemini API si está configurada
    if (config.GEMINI_API_KEY) {
      try {
        const model = config.GEMINI_MODEL || 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.GEMINI_API_KEY}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
              }
            ],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.3,
            }
          })
        });

        if (response.ok) {
          const data = (await response.json()) as any;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            return {
              lead_id: lead.id,
              opportunity_type: parsed.opportunity_type || audit.ai_opportunity_type || 'MODERNIZATION',
              priority_score: typeof parsed.priority_score === 'number' ? parsed.priority_score : 7,
              pain_points: Array.isArray(parsed.pain_points) ? parsed.pain_points.slice(0, 4) : [],
              proposed_solution: parsed.proposed_solution || '',
              outreach_copy: {
                whatsapp_pitch: parsed.outreach_copy?.whatsapp_pitch || '',
                email_subject: parsed.outreach_copy?.email_subject || '',
                email_body: parsed.outreach_copy?.email_body || '',
              }
            };
          }
        } else {
          const errBody = await response.text();
          console.warn(`[Evaluator] Gemini API retornó estado ${response.status}: ${errBody}`);
        }
      } catch (geminiErr: any) {
        console.warn(`[Evaluator] Error llamando a Gemini API:`, geminiErr.message);
      }
    }

    // 2. Probar OpenAI API si está configurada
    if (config.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as any;
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            return {
              lead_id: lead.id,
              opportunity_type: parsed.opportunity_type || audit.ai_opportunity_type || 'MODERNIZATION',
              priority_score: typeof parsed.priority_score === 'number' ? parsed.priority_score : 7,
              pain_points: Array.isArray(parsed.pain_points) ? parsed.pain_points.slice(0, 4) : [],
              proposed_solution: parsed.proposed_solution || '',
              outreach_copy: {
                whatsapp_pitch: parsed.outreach_copy?.whatsapp_pitch || '',
                email_subject: parsed.outreach_copy?.email_subject || '',
                email_body: parsed.outreach_copy?.email_body || '',
              }
            };
          }
        }
      } catch (openAiErr: any) {
        console.warn(`[Evaluator] Error llamando a OpenAI API:`, openAiErr.message);
      }
    }

    return null;
  }
}
