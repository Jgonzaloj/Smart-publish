import { LeadHunterService, HuntCriteria } from '../skills/skill1-hunter/hunter.service.js';
import { WebAuditorService } from '../skills/skill2-auditor/auditor.service.js';
import { CognitiveEvaluatorService } from '../skills/skill3-evaluator/evaluator.service.js';
import { DemoBuilderService } from '../skills/skill4-demobuilder/demo.service.js';
import { OutreachEngineService } from '../skills/skill5-outreach/outreach.service.js';
import { LeadsRepository } from '../db/repositories/leads.repository.js';

export interface PipelineResult {
  hunted: number;
  audited: number;
  qualified: number;
  discarded: number;
  proposalsCompiled: number;
  demosBuilt: number;
  gatePassed: number;
  gateFlagged: number;
  messagesSent: number;
  circuitBreakerActive: boolean;
  pipelineStats: any;
}

export class PipelineOrchestrator {
  private hunter = new LeadHunterService();
  private auditor = new WebAuditorService();
  private evaluator = new CognitiveEvaluatorService();
  private demoBuilder = new DemoBuilderService();
  private outreach = new OutreachEngineService();
  private leadsRepo = new LeadsRepository();

  /**
   * Ejecuta el ciclo completo de prospección y auditoría de forma autónoma
   */
  async runFullCycle(criteria: HuntCriteria = { niche: 'Clínicas Dentales', location: 'Madrid', limit: 5 }): Promise<PipelineResult> {
    console.log(`\n======================================================`);
    console.log(`[Pipeline] Iniciando Ciclo de Prospección para: ${criteria.niche} en ${criteria.location}`);
    console.log(`======================================================\n`);

    // 1. Skill 1: Lead Hunter
    console.log(`[Paso 1/6] Ejecutando Skill 1 (Lead Hunter & Discovery)...`);
    const huntRes = await this.hunter.huntLeads(criteria);
    console.log(` -> Leads nuevos ingestados: ${huntRes.ingested.length}, Omitidos/Duplicados: ${huntRes.skipped}`);

    // 2. Skill 2: Deterministic Web Auditor (Playwright)
    console.log(`\n[Paso 2/6] Ejecutando Skill 2 (Auditoría Web Determinista con Playwright)...`);
    const auditRes = await this.auditor.processIngestedLeads(20);
    console.log(` -> Auditados: ${auditRes.processed} (Calificados: ${auditRes.qualified}, Descartados: ${auditRes.discarded})`);

    // 3. Skill 3: Cognitive Evaluator (Structured Outputs)
    console.log(`\n[Paso 3/6] Ejecutando Skill 3 (Evaluador Cognitivo de Oportunidades)...`);
    const evalRes = await this.evaluator.processQualifiedLeads(20);
    console.log(` -> Propuestas compiladas: ${evalRes.processed} (Alta prioridad: ${evalRes.highPriority})`);

    // 4. Skill 4: Demo Builder (leads score >= 7)
    console.log(`\n[Paso 4/6] Ejecutando Skill 4 (Generador de Demos y Mockups)...`);
    const demoRes = await this.demoBuilder.processHighTicketLeads(20);
    console.log(` -> Demos desplegadas: ${demoRes.generated}`);

    // 5. Skill 5 (Parte A): Gate Anti-Alucinación
    console.log(`\n[Paso 5/6] Ejecutando Gate de Validación Anti-Alucinación...`);
    const gateRes = await this.outreach.runValidationGate(20);
    console.log(` -> Aprobados para envío: ${gateRes.passed}, Marcados para revisión humana: ${gateRes.flagged}`);

    // 6. Skill 5 (Parte B): Outreach Dispatcher con Circuit Breaker
    console.log(`\n[Paso 6/6] Ejecutando Skill 5 (Outreach Engine & Circuit Breaker)...`);
    const dispatchRes = await this.outreach.dispatchQueuedMessages(20);
    console.log(` -> Mensajes enviados: ${dispatchRes.sent}, Circuit Breaker Activo: ${dispatchRes.pausedByCircuitBreaker}`);

    // Cerrar navegador Playwright al terminar lote
    await this.auditor.closeBrowser();

    const stats = this.leadsRepo.getStats();
    console.log(`\n[Pipeline] Resumen de Estados en Base de Datos:`, stats.byStatus);

    return {
      hunted: huntRes.ingested.length,
      audited: auditRes.processed,
      qualified: auditRes.qualified,
      discarded: auditRes.discarded,
      proposalsCompiled: evalRes.processed,
      demosBuilt: demoRes.generated,
      gatePassed: gateRes.passed,
      gateFlagged: gateRes.flagged,
      messagesSent: dispatchRes.sent,
      circuitBreakerActive: dispatchRes.pausedByCircuitBreaker,
      pipelineStats: stats,
    };
  }
}
