import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env.js';
import { LeadsRepository } from '../db/repositories/leads.repository.js';
import { AuditsRepository } from '../db/repositories/audits.repository.js';
import { ProposalsRepository } from '../db/repositories/proposals.repository.js';
import { OutreachRepository } from '../db/repositories/outreach.repository.js';
import { PipelineOrchestrator } from '../pipeline/orchestrator.js';
import { OutreachEngineService } from '../skills/skill5-outreach/outreach.service.js';
import { generateFullWebsiteDemoHtml } from '../skills/skill4-demobuilder/demo-template.js';

const app = express();
app.use(cors());
app.use(express.json());

const leadsRepo = new LeadsRepository();
const auditsRepo = new AuditsRepository();
const proposalsRepo = new ProposalsRepository();
const outreachRepo = new OutreachRepository();
const outreachEngine = new OutreachEngineService();
const orchestrator = new PipelineOrchestrator();

// Función auxiliar para sanitizar HTML y evitar XSS
const escapeHTML = (str?: string) => {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    (tag: string) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
};

// Middleware de Autenticación (Basic Auth)
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Rutas públicas que no requieren autenticación
  if (req.path.startsWith('/api/webhooks/') || req.path.startsWith('/api/demos/')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Agente Prospeccion"');
    return res.status(401).send('Autenticación requerida.');
  }

  const base64Auth = authHeader.split(' ')[1];
  if (!base64Auth) {
    return res.status(401).send('Formato de autenticación inválido.');
  }

  const [user, password] = Buffer.from(base64Auth, 'base64').toString().split(':');
  if (user === config.ADMIN_USER && password === config.ADMIN_PASSWORD) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Agente Prospeccion"');
  return res.status(401).send('Credenciales inválidas.');
};

// Aplicar middleware de autenticación de manera global (afecta a archivos estáticos y API)
app.use(authMiddleware);

// Servir capturas de pantalla generadas por Playwright
app.use('/storage/screenshots', express.static(config.SCREENSHOTS_PATH));

// Servir UI estática del Dashboard
const publicDir = path.resolve(process.cwd(), 'src', 'server', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
app.use(express.static(publicDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// ==========================================
// ENDPOINTS DE API & WEBHOOKS
// ==========================================

// Webhook de Meta WhatsApp Cloud API (Verificación GET)
app.get('/api/webhooks/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('[Webhook] WhatsApp webhook verificado exitosamente por Meta.');
    return res.status(200).send(challenge);
  }
  return res.status(403).send('Token de verificación inválido');
});

// Webhook de Meta WhatsApp Cloud API (Recepción de mensajes POST)
app.post('/api/webhooks/whatsapp', async (req, res) => {
  try {
    const body = req.body;
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (value.messages && value.messages.length > 0) {
            const message = value.messages[0];
            const senderPhone = message.from; // Ej: 34912345678
            const messageText = message.text?.body || 'Mensaje de WhatsApp recibido';

            console.log(`[Webhook] Mensaje entrante de ${senderPhone}: "${messageText}"`);

            // Buscar lead por número de teléfono
            const leads = leadsRepo.getAllLeads(500);
            const matchedLead = leads.find((l) => {
              const cleanLeadPhone = (l.whatsapp || l.phone || '').replace(/[^0-9]/g, '');
              return cleanLeadPhone && senderPhone.endsWith(cleanLeadPhone.slice(-8));
            });

            if (matchedLead) {
              await outreachEngine.handleProspectReply(matchedLead.id, `Respuesta WhatsApp: ${messageText}`);
            }
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
    res.sendStatus(404);
  } catch (error) {
    console.error('[Webhook] Error procesando mensaje de WhatsApp:', error);
    res.sendStatus(500);
  }
});

// 1. Estadísticas globales del pipeline
app.get('/api/stats', (req, res) => {
  const stats = leadsRepo.getStats();
  const domainHealth = outreachRepo.getDomainHealth();
  res.json({ stats, domainHealth, mockMode: config.USE_MOCK_MODE });
});

// 2. Lista de leads con filtro opcional por estado
app.get('/api/leads', (req, res) => {
  const status = req.query.status as string;
  let leads;
  if (status) {
    leads = leadsRepo.findByStatus(status as any, 100);
  } else {
    leads = leadsRepo.getAllLeads(150);
  }
  res.json(leads);
});

// 3. Detalle completo de un lead (audit + proposal + outreach)
app.get('/api/leads/:id', (req, res) => {
  const lead = leadsRepo.findById(req.params.id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead no encontrado' });
  }

  const audit = auditsRepo.findByLeadId(lead.id);
  const proposal = proposalsRepo.findByLeadId(lead.id);

  res.json({
    lead,
    audit,
    proposal,
  });
});

// 4. Ejecución del pipeline completo
app.post('/api/pipeline/run', (req, res) => {
  try {
    const { niche, location, limit } = req.body;
    
    // Ejecución asíncrona (background) para evitar timeout de Nginx (180s)
    orchestrator.runFullCycle({
      niche: niche || 'Clínicas Dentales',
      location: location || 'Madrid',
      limit: limit ? parseInt(limit, 10) : 5,
    }).catch(error => {
      console.error('Error crítico en pipeline de fondo:', error);
    });

    res.status(202).json({ success: true, message: 'Pipeline iniciado en segundo plano. Monitoreando...' });
  } catch (error: any) {
    console.error('Error inicializando pipeline:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Aprobación humana en el Gate (para leads en FLAGGED_FOR_REVIEW)
app.post('/api/leads/:id/gate/approve', (req, res) => {
  const leadId = req.params.id;
  const lead = leadsRepo.findById(leadId);
  if (!lead) return res.status(404).json({ error: 'Lead no encontrado' });

  proposalsRepo.updateGateStatus(leadId, true, 'Aprobado manualmente por el revisor humano');
  leadsRepo.forceUpdateStatus(leadId, 'QUEUED');

  res.json({ success: true, message: 'Lead aprobado y encolado para envío' });
});

// 6. Simular / Registrar respuesta del prospecto (Paso al Humano)
app.post('/api/leads/:id/reply', async (req, res) => {
  const leadId = req.params.id;
  const { note } = req.body;
  const success = await outreachEngine.handleProspectReply(leadId, note);
  if (!success) return res.status(404).json({ error: 'Lead no encontrado' });

  res.json({ success: true, message: 'Lead traspasado al cerrador humano (HUMAN_HANDOFF)' });
});

// 7. Cerrar venta (WON o LOST)
app.post('/api/leads/:id/close', async (req, res) => {
  const leadId = req.params.id;
  const { outcome } = req.body; // 'WON' | 'LOST'
  if (outcome !== 'WON' && outcome !== 'LOST') {
    return res.status(400).json({ error: 'Outcome debe ser WON o LOST' });
  }

  const success = await outreachEngine.closeLead(leadId, outcome);
  res.json({ success, message: `Lead cerrado como ${outcome}` });
});

// 8. Eliminar un lead individual
app.delete('/api/leads/:id', (req, res) => {
  const leadId = req.params.id;
  const deleted = leadsRepo.deleteLead(leadId);
  res.json({ success: deleted, message: deleted ? 'Lead eliminado' : 'Lead no encontrado' });
});

// 9. Resetear/Limpiar todos los leads de la base de datos
app.post('/api/leads/reset', (req, res) => {
  try {
    leadsRepo.resetAllLeads();
    res.json({ success: true, message: 'Tablero y base de datos reseteados correctamente' });
  } catch (error: any) {
    console.error('Error al resetear leads:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Demo interactiva personalizada (Skill 4 Demo Generator - Full Website Mockup)
app.get('/api/demos/:id', (req, res) => {
  const lead = leadsRepo.findById(req.params.id);
  if (!lead) return res.status(404).send('Demo no encontrada');

  const audit = auditsRepo.findByLeadId(lead.id);
  const proposal = proposalsRepo.findByLeadId(lead.id);

  const html = generateFullWebsiteDemoHtml({
    business_name: escapeHTML(lead.business_name),
    niche: escapeHTML(lead.niche),
    phone: escapeHTML(lead.phone),
    whatsapp: escapeHTML(lead.whatsapp),
    rating: lead.rating,
    reviews_count: lead.reviews_count,
    current_website_url: escapeHTML(lead.current_website_url),
    proposed_solution: escapeHTML(proposal?.proposed_solution),
    opportunity_type: escapeHTML(proposal?.opportunity_type),
  });

  res.send(html);
});

// Arrancar servidor
app.listen(config.PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`[Servidor] Agente de Prospección B2B v3.0 Activo`);
  console.log(`[Dashboard Web] 👉 http://${config.HOST}:${config.PORT}`);
  console.log(`[Modo] ${config.USE_MOCK_MODE ? 'SIMULACIÓN SEGURA (Sin costo API)' : 'PRODUCCIÓN CON APIS REALES'}`);
  console.log(`=============================================================\n`);
});
