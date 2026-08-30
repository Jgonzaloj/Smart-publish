import { LeadsRepository } from '../../db/repositories/leads.repository.js';
import { ProposalsRepository } from '../../db/repositories/proposals.repository.js';
import { OutreachRepository } from '../../db/repositories/outreach.repository.js';
import { AuditsRepository } from '../../db/repositories/audits.repository.js';
import { GateValidationResult, ProspectLead } from '../../types/index.js';
import { config } from '../../config/env.js';

export class OutreachEngineService {
  private leadsRepo = new LeadsRepository();
  private proposalsRepo = new ProposalsRepository();
  private outreachRepo = new OutreachRepository();
  private auditsRepo = new AuditsRepository();

  /**
   * Gate previo obligatorio anti-alucinación:
   * Valida nombre de empresa, ausencia total de placeholders y congruencia de métricas.
   */
  validateOutreachGate(lead: ProspectLead, proposal: any): GateValidationResult {
    const reasons: string[] = [];

    // 1. Validar nombre de negocio
    if (!lead.business_name || lead.business_name.trim().length < 2) {
      reasons.push('Nombre de empresa vacío o inválido');
    }

    // 2. Comprobar placeholders prohibidos o texto no reemplazado
    const forbiddenPlaceholders = [
      /\[\s*(nombre|empresa|link|url|business|negocio|telefono|precio|fecha|cliente|lead|sitio|email|placeholder|xxx).*?\s*\]/i,
      /\{\s*(nombre|empresa|link|url|business|negocio|telefono|precio|fecha|cliente|lead|sitio|email|placeholder).*?\s*\}/i,
      /\{\{.*?\}\}/,
      /\bundefined\b/i,
      /\bnull\b/i,
      /\bnan\b/i,
    ];

    const whatsappPitch = proposal.outreach_copy?.whatsapp_pitch || proposal.whatsapp_pitch || '';
    const emailSubject = proposal.outreach_copy?.email_subject || proposal.email_subject || '';
    const emailBody = proposal.outreach_copy?.email_body || proposal.email_body || '';

    const copyText = `${whatsappPitch} ${emailSubject} ${emailBody}`;
    for (const pattern of forbiddenPlaceholders) {
      if (pattern.test(copyText)) {
        reasons.push(`Contiene patrón o placeholder no resuelto: ${pattern.toString()}`);
      }
    }

    // 3. Validar longitud mínima de mensaje
    if (!whatsappPitch || whatsappPitch.length < 30) {
      reasons.push('El pitch de WhatsApp es demasiado corto o inexistente');
    }
    if (!emailSubject || !emailBody) {
      reasons.push('Asunto o cuerpo de correo vacíos');
    }

    // 4. Validar política do_not_contact
    if (lead.do_not_contact) {
      reasons.push('Lead marcado como Do Not Contact');
    }

    return {
      passed: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Ejecuta el Gate de Validación sobre leads en READY_TO_SEND o DEMO_DEPLOYED
   */
  async runValidationGate(batchSize = 20): Promise<{ passed: number; flagged: number }> {
    const readyLeads = [
      ...this.leadsRepo.findByStatus('READY_TO_SEND', batchSize),
      ...this.leadsRepo.findByStatus('DEMO_DEPLOYED', batchSize),
      ...this.leadsRepo.findByStatus('PROPOSAL_COMPILED', batchSize),
    ];

    let passed = 0;
    let flagged = 0;

    for (const lead of readyLeads) {
      const proposal = this.proposalsRepo.findByLeadId(lead.id);
      if (!proposal) continue;

      const validation = this.validateOutreachGate(lead, proposal);

      if (validation.passed) {
        this.proposalsRepo.updateGateStatus(lead.id, true);
        this.leadsRepo.updateStatusAtomic(lead.id, lead.status, 'QUEUED');
        passed++;
      } else {
        this.proposalsRepo.updateGateStatus(lead.id, false, validation.reasons.join(' | '));
        this.leadsRepo.updateStatusAtomic(lead.id, lead.status, 'FLAGGED_FOR_REVIEW');
        flagged++;
      }
    }

    return { passed, flagged };
  }

  /**
   * Envío controlado de mensajes con Circuit Breaker
   */
  async dispatchQueuedMessages(batchSize = 10): Promise<{ sent: number; pausedByCircuitBreaker: boolean }> {
    const health = this.outreachRepo.getDomainHealth();

    // Circuit Breaker de seguridad
    if (health.circuit_breaker_active || health.bounce_rate_24h > config.MAX_BOUNCE_RATE) {
      console.warn('[CircuitBreaker] Envíos pausados automáticamente por tasa de bounce o alerta de reputación.');
      return { sent: 0, pausedByCircuitBreaker: true };
    }

    const queuedLeads = this.leadsRepo.findByStatus('QUEUED', batchSize);
    let sentCount = 0;

    for (const lead of queuedLeads) {
      const proposal = this.proposalsRepo.findByLeadId(lead.id);
      if (!proposal) continue;

      // Canal primario: WhatsApp si tiene teléfono/móvil, sino Email
      const channel = lead.whatsapp || lead.phone ? 'whatsapp' : 'email';
      const copy = channel === 'whatsapp' ? proposal.outreach_copy.whatsapp_pitch : proposal.outreach_copy.email_body;

      await this.sendMessage(channel, lead, proposal);

      // Registrar resultado
      this.outreachRepo.logOutreach({
        lead_id: lead.id,
        channel,
        replied: false,
        converted: false,
        copy_used: copy,
        notes: `Primer contacto enviado vía ${channel}`,
      });

      // Transición atómica a SENT
      this.leadsRepo.updateStatusAtomic(lead.id, 'QUEUED', 'SENT');
      sentCount++;
    }

    return { sent: sentCount, pausedByCircuitBreaker: false };
  }

  /**
   * Traspaso al Humano (Human Handoff):
   * Se activa cuando un prospecto responde (`REPLIED`). El agente cede el control al cerrador
   * y despacha alertas inmediatas por Email y WhatsApp al cerrador humano.
   */
  async handleProspectReply(leadId: string, responseNote?: string): Promise<boolean> {
    const lead = this.leadsRepo.findById(leadId);
    if (!lead) return false;

    // Marcar en outreach_results
    this.outreachRepo.markReplied(leadId);

    // Transición a REPLIED -> HUMAN_HANDOFF
    this.leadsRepo.forceUpdateStatus(leadId, 'HUMAN_HANDOFF', config.DEFAULT_CLOSER_NAME);

    console.log(`[HumanHandoff] 🔥 ¡ALERTA DE CIERRE! Prospecto ${lead.business_name} ha respondido.`);
    console.log(`[HumanHandoff] Asignado al closer: ${config.DEFAULT_CLOSER_NAME}`);

    // Disparar alertas en segundo plano al cerrador
    await this.notifyHumanCloser(lead, responseNote);

    return true;
  }

  /**
   * Envía notificación inmediata por Correo y WhatsApp al cerrador comercial
   */
  private async notifyHumanCloser(lead: ProspectLead, responseNote?: string): Promise<void> {
    const cleanPhone = (lead.whatsapp || lead.phone || '').replace(/[^0-9]/g, '');
    const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : '';
    const audit = this.auditsRepo.findByLeadId(lead.id);
    const proposal = this.proposalsRepo.findByLeadId(lead.id);

    // 1. Alerta por Email (Resend)
    if (config.CLOSER_NOTIFICATION_EMAIL && config.RESEND_API_KEY) {
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
              <div style="display: flex; align-items: center; border-bottom: 2px solid #22c55e; padding-bottom: 16px; margin-bottom: 24px;">
                <span style="font-size: 20px; font-weight: 800; color: #22c55e; letter-spacing: 0.05em;">🔥 ¡PROSPECTO INTERESADO HA RESPONDIDO!</span>
              </div>

              <h2 style="color: #ffffff; margin-top: 0; font-size: 22px;">${lead.business_name}</h2>
              <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">Nicho: <strong style="color: #e2e8f0;">${lead.niche || 'B2B'}</strong></p>

              <div style="background: #0f172a; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                <strong style="color: #38bdf8; font-size: 13px; text-transform: uppercase;">Mensaje recibido:</strong>
                <p style="color: #f1f5f9; font-size: 16px; margin: 8px 0 0 0; font-style: italic;">"${responseNote || 'El prospecto ha respondido el mensaje inicial de prospección.'}"</p>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8;">📞 Teléfono:</td>
                  <td style="padding: 8px 0; color: #ffffff; font-weight: bold;">${lead.phone || lead.whatsapp || 'No disponible'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8;">⭐ Oportunidad IA:</td>
                  <td style="padding: 8px 0; color: #fbbf24; font-weight: bold;">${audit?.ai_opportunity_type || 'N/A'} (Score: ${proposal?.priority_score || '8'}/10)</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8;">🌐 Web Actual:</td>
                  <td style="padding: 8px 0;"><a href="${lead.current_website_url}" style="color: #60a5fa;" target="_blank">${lead.current_website_url || 'Sin web previa'}</a></td>
                </tr>
              </table>

              ${waLink ? `
              <div style="text-align: center; margin: 32px 0;">
                <a href="${waLink}" target="_blank" style="background: #22c55e; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.4);">
                  💬 Abrir Chat Directo en WhatsApp
                </a>
              </div>
              ` : ''}

              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center;">
                Notificación generada por el Agente Autónomo de Prospección B2B v3.0
              </div>
            </div>
          </body>
          </html>
        `;

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: config.EMAIL_FROM,
            to: [config.CLOSER_NOTIFICATION_EMAIL],
            subject: `🔥 [CLIENTE RESPONDIÓ] ${lead.business_name} listo para cerrar`,
            html: emailHtml,
          }),
        });
        console.log(`[HumanHandoff Alert] Email de notificación enviado al cerrador (${config.CLOSER_NOTIFICATION_EMAIL})`);
      } catch (err: any) {
        console.error('[HumanHandoff Alert] Error enviando alerta por email al cerrador:', err.message);
      }
    }

    // 2. Alerta por WhatsApp al móvil del Cerrador (WhatsApp Cloud API)
    if (config.CLOSER_NOTIFICATION_PHONE && config.WHATSAPP_API_TOKEN && config.WHATSAPP_PHONE_NUMBER_ID) {
      try {
        const closerPhoneClean = config.CLOSER_NOTIFICATION_PHONE.replace(/[^0-9]/g, '');
        const alertMessage = `🔥 *ALERTA DE CIERRE HUMANO*\n\nEl prospecto *${lead.business_name}* (${lead.niche}) ha respondido:\n💬 _"${responseNote || 'Mensaje entrante'}"_\n\n👉 *Abrir Chat:* ${waLink || 'Ver en Dashboard'}\n📊 *Diagnóstico:* ${audit?.ai_opportunity_type || 'N/A'}`;

        const url = `https://graph.facebook.com/v19.0/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`;
        await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: closerPhoneClean,
            type: 'text',
            text: { body: alertMessage },
          }),
        });
        console.log(`[HumanHandoff Alert] WhatsApp de alerta enviado al teléfono del cerrador (${closerPhoneClean})`);
      } catch (err: any) {
        console.error('[HumanHandoff Alert] Error enviando WhatsApp al cerrador:', err.message);
      }
    }
  }

  /**
   * Cerrar venta (WON o LOST)
   */
  async closeLead(leadId: string, outcome: 'WON' | 'LOST'): Promise<boolean> {
    if (outcome === 'WON') {
      this.outreachRepo.markConverted(leadId);
    }
    return this.leadsRepo.forceUpdateStatus(leadId, outcome);
  }

  private async sendMessage(channel: 'whatsapp' | 'email', lead: ProspectLead, proposal: any): Promise<void> {
    if (config.USE_MOCK_MODE) {
      // Modo simulación seguro: no envía mensajes reales
      console.log(`[Outreach Engine - MOCK] Simulando envío a ${lead.business_name} vía ${channel}`);
      return;
    }

    if (channel === 'whatsapp' && config.WHATSAPP_API_TOKEN && config.WHATSAPP_PHONE_NUMBER_ID) {
      try {
        // Llamada a Meta WhatsApp Cloud API Oficial con plantilla aprobada
        const url = `https://graph.facebook.com/v19.0/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`;
        const cleanPhone = (lead.whatsapp || lead.phone || '').replace(/[^0-9]/g, '');

        if (!cleanPhone) {
          console.warn(`[Outreach WhatsApp] Lead ${lead.business_name} no tiene número de teléfono válido.`);
          return;
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'template',
            template: {
              name: config.WHATSAPP_TEMPLATE_NAME,
              language: { code: 'es' },
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: lead.business_name },
                    { type: 'text', text: `${proposal.priority_score || 8}/10` },
                  ],
                },
              ],
            },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[Outreach WhatsApp] Error enviando WhatsApp a ${cleanPhone}:`, errText);
        } else {
          console.log(`[Outreach WhatsApp] Mensaje enviado exitosamente a ${cleanPhone}`);
        }
      } catch (err: any) {
        console.error(`[Outreach WhatsApp] Excepción enviando WhatsApp a ${lead.business_name}:`, err.message);
      }
    } else if (channel === 'email' && config.RESEND_API_KEY && lead.email) {
      try {
        // Envío real con Resend API
        const emailBody = proposal.outreach_copy?.email_body || '';
        const emailSubject = proposal.outreach_copy?.email_subject || `Oportunidad técnica para ${lead.business_name}`;
        
        // Convertir saltos de línea a párrafos HTML limpios
        const htmlParagraphs = emailBody
          .split('\n\n')
          .map((p: string) => `<p style="margin-bottom: 16px; line-height: 1.6; color: #334155;">${p.replace(/\n/g, '<br>')}</p>`)
          .join('');

        const formattedHtml = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px;">
                <span style="font-size: 12px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.05em;">Diagnóstico de Rendimiento & Prospección Digital</span>
              </div>
              <div style="font-size: 15px;">
                ${htmlParagraphs}
              </div>
              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
                Este correo contiene un análisis técnico preparado para ${lead.business_name}. Si no deseas recibir más análisis, responde indicando 'Cancelar'.
              </div>
            </div>
          </body>
          </html>
        `;

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: config.EMAIL_FROM,
            to: [lead.email],
            subject: emailSubject,
            text: emailBody,
            html: formattedHtml,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[Outreach Email] Error enviando correo vía Resend a ${lead.email}:`, errText);
        } else {
          console.log(`[Outreach Email] Correo enviado exitosamente vía Resend a ${lead.email}`);
        }
      } catch (err: any) {
        console.error(`[Outreach Email] Excepción enviando correo a ${lead.email}:`, err.message);
      }
    }
  }
}
