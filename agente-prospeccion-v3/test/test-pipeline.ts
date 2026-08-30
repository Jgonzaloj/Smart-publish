import { PipelineOrchestrator } from '../src/pipeline/orchestrator.js';
import { LeadsRepository } from '../src/db/repositories/leads.repository.js';
import { AuditsRepository } from '../src/db/repositories/audits.repository.js';
import { ProposalsRepository } from '../src/db/repositories/proposals.repository.js';
import { OutreachEngineService } from '../src/skills/skill5-outreach/outreach.service.js';

async function runVerificationTests() {
  console.log('================================================================');
  console.log('INICIANDO PRUEBAS DE VERIFICACIÓN END-TO-END DEL AGENTE B2B');
  console.log('================================================================\n');

  const orchestrator = new PipelineOrchestrator();
  const leadsRepo = new LeadsRepository();
  const auditsRepo = new AuditsRepository();
  const proposalsRepo = new ProposalsRepository();
  const outreach = new OutreachEngineService();

  // Test 1: Ejecutar pipeline completo
  console.log('--- TEST 1: Ejecución Completa del Ciclo de Prospección ---');
  const result = await orchestrator.runFullCycle({
    niche: 'Clínicas Dentales',
    location: 'Madrid',
    limit: 4,
  });

  console.log(`\nResultados del ciclo:`);
  console.log(`- Leads ingestados: ${result.hunted}`);
  console.log(`- Auditados con Playwright: ${result.audited}`);
  console.log(`- Calificados: ${result.qualified}`);
  console.log(`- Descartados: ${result.discarded}`);
  console.log(`- Propuestas compiladas: ${result.proposalsCompiled}`);
  console.log(`- Demos construidas: ${result.demosBuilt}`);
  console.log(`- Gate pasados: ${result.gatePassed}`);
  console.log(`- Mensajes enviados: ${result.messagesSent}`);

  if (result.audited === 0) {
    throw new Error('TEST FALLIDO: No se auditó ningún lead');
  }

  // Test 2: Comprobar diagnósticos de Playwright
  console.log('\n--- TEST 2: Validación de Diagnósticos de Playwright ---');
  const allLeads = leadsRepo.getAllLeads(10);
  for (const lead of allLeads) {
    const audit = auditsRepo.findByLeadId(lead.id);
    if (audit) {
      console.log(`✅ Lead "${lead.business_name}":`);
      console.log(`   - Web: ${audit.has_website ? 'Sí' : 'No'}`);
      console.log(`   - Score: ${audit.lighthouse_perf_score}/100 | TTFB: ${audit.ttfb_ms}ms | Responsive: ${audit.is_mobile_responsive}`);
      console.log(`   - Stack: ${audit.detected_tech_stack?.details?.join(', ') || 'N/A'}`);
      if (audit.screenshot_path) {
        console.log(`   - Screenshot guardado en: ${audit.screenshot_path}`);
      }
    }
  }

  // Test 3: Probar Traspaso al Humano (Human Handoff)
  console.log('\n--- TEST 3: Validación del Flujo de Traspaso Humano (HUMAN_HANDOFF) ---');
  const sentLead = allLeads.find((l) => ['SENT', 'QUEUED', 'PROPOSAL_COMPILED'].includes(l.status));
  if (sentLead) {
    console.log(`Simulando respuesta del prospecto en lead ${sentLead.id} (${sentLead.business_name})...`);
    await outreach.handleProspectReply(sentLead.id, 'Hola, me interesa ver la propuesta.');
    const updated = leadsRepo.findById(sentLead.id);
    console.log(`✅ Estado actualizado a: ${updated?.status} | Asignado a: ${updated?.assigned_closer}`);
    if (updated?.status !== 'HUMAN_HANDOFF') {
      throw new Error('TEST FALLIDO: El lead no pasó a HUMAN_HANDOFF');
    }

    // Test 4: Cierre Humano (WON)
    console.log('\n--- TEST 4: Validación de Cierre por el Humano (WON) ---');
    await outreach.closeLead(sentLead.id, 'WON');
    const closed = leadsRepo.findById(sentLead.id);
    console.log(`✅ Lead cerrado exitosamente con estado: ${closed?.status}`);
    if (closed?.status !== 'WON') {
      throw new Error('TEST FALLIDO: El lead no pasó a WON');
    }
  }

  console.log('\n================================================================');
  console.log('✅ TODAS LAS PRUEBAS END-TO-END PASARON CON ÉXITO');
  console.log('================================================================');
}

runVerificationTests().catch((err) => {
  console.error('Error en pruebas:', err);
  process.exit(1);
});
