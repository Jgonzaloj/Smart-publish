import { LeadsRepository } from '../../db/repositories/leads.repository.js';
import { AuditsRepository } from '../../db/repositories/audits.repository.js';
import { ProposalsRepository } from '../../db/repositories/proposals.repository.js';

export class DemoBuilderService {
  private leadsRepo = new LeadsRepository();
  private auditsRepo = new AuditsRepository();
  private proposalsRepo = new ProposalsRepository();

  /**
   * Genera demos para leads con alto ticket (priority_score >= 7)
   */
  async processHighTicketLeads(batchSize = 5): Promise<{ generated: number }> {
    const leads = this.leadsRepo.findByStatus('PROPOSAL_COMPILED', batchSize);
    let generated = 0;

    for (const lead of leads) {
      const proposal = this.proposalsRepo.findByLeadId(lead.id);
      if (proposal && proposal.priority_score >= 7) {
        // Generar URL de demo interactiva
        const demoUrl = `/api/demos/${lead.id}`;
        
        // Actualizar diagnóstico con la demo
        const audit = this.auditsRepo.findByLeadId(lead.id);
        if (audit) {
          audit.demo_url_deployed = demoUrl;
          this.auditsRepo.saveAudit({
            ...audit,
            detected_tech_stack: audit.detected_tech_stack,
            issues_found: audit.issues_found,
          });
        }

        this.leadsRepo.updateStatusAtomic(lead.id, 'PROPOSAL_COMPILED', 'DEMO_DEPLOYED');
        generated++;
      } else {
        // Si no califica para demo, pasa directo a READY_TO_SEND
        this.leadsRepo.updateStatusAtomic(lead.id, 'PROPOSAL_COMPILED', 'READY_TO_SEND');
      }
    }

    return { generated };
  }
}
