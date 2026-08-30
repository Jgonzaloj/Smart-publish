import { PipelineOrchestrator } from '../src/pipeline/orchestrator.js';
import { LeadsRepository } from '../src/db/repositories/leads.repository.js';
import { AuditsRepository } from '../src/db/repositories/audits.repository.js';
import { ProposalsRepository } from '../src/db/repositories/proposals.repository.js';

async function runMultiNicheBatch() {
  console.log('========================================================================');
  console.log('🚀 INICIANDO PROCESO MULTI-NICHO DE PROSPECCIÓN & AUDITORÍA B2B (LIMA)');
  console.log('========================================================================\n');

  const orchestrator = new PipelineOrchestrator();
  const leadsRepo = new LeadsRepository();
  const auditsRepo = new AuditsRepository();
  const proposalsRepo = new ProposalsRepository();

  const niches = [
    { niche: 'Clínicas Dentales & Odontología', location: 'Lima, Perú', limit: 3 },
    { niche: 'Restaurantes & Gastronomía', location: 'Lima, Perú', limit: 3 },
    { niche: 'Estudios Jurídicos & Contables', location: 'Lima, Perú', limit: 3 },
    { niche: 'Inmobiliarias & Bienes Raíces', location: 'Lima, Perú', limit: 3 },
  ];

  const totalResults = {
    hunted: 0,
    audited: 0,
    qualified: 0,
    discarded: 0,
    proposalsCompiled: 0,
    demosBuilt: 0,
    gatePassed: 0,
    gateFlagged: 0,
  };

  for (const item of niches) {
    console.log(`\n======================================================`);
    console.log(`👉 Procesando Nicho: [${item.niche}] en ${item.location}`);
    console.log(`======================================================`);
    
    const res = await orchestrator.runFullCycle(item);
    
    totalResults.hunted += res.hunted;
    totalResults.audited += res.audited;
    totalResults.qualified += res.qualified;
    totalResults.discarded += res.discarded;
    totalResults.proposalsCompiled += res.proposalsCompiled;
    totalResults.demosBuilt += res.demosBuilt;
    totalResults.gatePassed += res.gatePassed;
    totalResults.gateFlagged += res.gateFlagged;
  }

  console.log('\n========================================================================');
  console.log('📊 RESUMEN GLOBAL DEL LOTE DE VALIDACIÓN MULTI-NICHO');
  console.log('========================================================================');
  console.log(`Total Leads Extraídos / Ingestados: ${totalResults.hunted}`);
  console.log(`Total Auditados con Playwright:     ${totalResults.audited}`);
  console.log(`Total Calificados con Oportunidad:  ${totalResults.qualified}`);
  console.log(`Total Descartados (Webs Perfectas): ${totalResults.discarded}`);
  console.log(`Total Propuestas IA Compiladas:    ${totalResults.proposalsCompiled}`);
  console.log(`Total Demos / Prototipos Creados:   ${totalResults.demosBuilt}`);
  console.log(`Total Pasados por Gate de Calidad:  ${totalResults.gatePassed}`);

  const allLeads = leadsRepo.getAllLeads(50);
  console.log('\n📋 DETALLE DE PROSPECTOS LISTOS EN BASE DE DATOS:');
  console.log('------------------------------------------------------------------------');
  for (const lead of allLeads) {
    const audit = auditsRepo.findByLeadId(lead.id);
    const proposal = proposalsRepo.findByLeadId(lead.id);
    console.log(`\n🏢 Empresa: ${lead.business_name}`);
    console.log(`   - Nicho: ${lead.niche}`);
    console.log(`   - Teléfono / WA: ${lead.whatsapp || lead.phone || 'No registrado'}`);
    console.log(`   - Estado Kanban: [${lead.status}]`);
    if (audit) {
      console.log(`   - Diagnóstico: ${audit.ai_opportunity_type} | Web: ${audit.has_website ? 'Sí' : 'No'} | TTFB: ${audit.ttfb_ms}ms | Responsive: ${audit.is_mobile_responsive}`);
    }
    if (proposal) {
      const pitch = proposal.outreach_copy?.whatsapp_pitch || '';
      console.log(`   - Prioridad IA: ${proposal.priority_score || 'N/A'}/10 | Pitch: "${pitch.substring(0, 80)}..."`);
    }
  }

  const finalStats = leadsRepo.getStats();
  console.log('\n📈 ESTADÍSTICAS DEL SISTEMA POR ESTADO:');
  console.log(JSON.stringify(finalStats.byStatus, null, 2));
}

runMultiNicheBatch().catch((err) => {
  console.error('Error ejecutando lote multi-nicho:', err);
  process.exit(1);
});
