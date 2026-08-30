import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';
import { OpportunityReport } from '../../types/index.js';

export interface ProposalRecord extends OpportunityReport {
  id: string;
  gate_passed: boolean;
  gate_review_notes?: string;
  created_at: string;
}

export class ProposalsRepository {
  private db = getDatabase();

  saveProposal(report: OpportunityReport, gatePassed = false, gateNotes?: string): ProposalRecord {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO proposals (
        id, lead_id, opportunity_type, priority_score,
        pain_points, proposed_solution, whatsapp_pitch,
        email_subject, email_body, gate_passed, gate_review_notes
      ) VALUES (
        @id, @lead_id, @opportunity_type, @priority_score,
        @pain_points, @proposed_solution, @whatsapp_pitch,
        @email_subject, @email_body, @gate_passed, @gate_review_notes
      )
    `);

    stmt.run({
      id,
      lead_id: report.lead_id,
      opportunity_type: report.opportunity_type,
      priority_score: report.priority_score,
      pain_points: JSON.stringify(report.pain_points || []),
      proposed_solution: report.proposed_solution,
      whatsapp_pitch: report.outreach_copy.whatsapp_pitch,
      email_subject: report.outreach_copy.email_subject,
      email_body: report.outreach_copy.email_body,
      gate_passed: gatePassed ? 1 : 0,
      gate_review_notes: gateNotes || null,
    });

    return this.findByLeadId(report.lead_id)!;
  }

  updateGateStatus(leadId: string, passed: boolean, notes?: string): void {
    this.db.prepare(`
      UPDATE proposals
      SET gate_passed = ?, gate_review_notes = ?
      WHERE lead_id = ?
    `).run(passed ? 1 : 0, notes || null, leadId);
  }

  findByLeadId(leadId: string): ProposalRecord | null {
    const row = this.db.prepare('SELECT * FROM proposals WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1').get(leadId) as any;
    if (!row) return null;

    return {
      id: row.id,
      lead_id: row.lead_id,
      opportunity_type: row.opportunity_type,
      priority_score: Number(row.priority_score),
      pain_points: row.pain_points ? JSON.parse(row.pain_points) : [],
      proposed_solution: row.proposed_solution,
      outreach_copy: {
        whatsapp_pitch: row.whatsapp_pitch,
        email_subject: row.email_subject,
        email_body: row.email_body,
      },
      gate_passed: Boolean(row.gate_passed),
      gate_review_notes: row.gate_review_notes ?? undefined,
      created_at: row.created_at,
    };
  }
}
