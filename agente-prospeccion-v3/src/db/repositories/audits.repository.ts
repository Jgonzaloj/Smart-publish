import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';
import { AuditDiagnostics } from '../../types/index.js';

export class AuditsRepository {
  private db = getDatabase();

  saveAudit(audit: Omit<AuditDiagnostics, 'id' | 'created_at'>): AuditDiagnostics {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO audit_diagnostics (
        id, lead_id, has_website, is_mobile_responsive,
        lighthouse_perf_score, ttfb_ms, load_time_ms,
        screenshot_path, detected_tech_stack, ai_opportunity_type,
        demo_url_deployed, issues_found
      ) VALUES (
        @id, @lead_id, @has_website, @is_mobile_responsive,
        @lighthouse_perf_score, @ttfb_ms, @load_time_ms,
        @screenshot_path, @detected_tech_stack, @ai_opportunity_type,
        @demo_url_deployed, @issues_found
      )
    `);

    stmt.run({
      id,
      lead_id: audit.lead_id,
      has_website: audit.has_website ? 1 : 0,
      is_mobile_responsive: audit.is_mobile_responsive ? 1 : 0,
      lighthouse_perf_score: audit.lighthouse_perf_score,
      ttfb_ms: audit.ttfb_ms,
      load_time_ms: audit.load_time_ms ?? null,
      screenshot_path: audit.screenshot_path ?? null,
      detected_tech_stack: JSON.stringify(audit.detected_tech_stack || {}),
      ai_opportunity_type: audit.ai_opportunity_type ?? null,
      demo_url_deployed: audit.demo_url_deployed ?? null,
      issues_found: JSON.stringify(audit.issues_found || []),
    });

    return this.findByLeadId(audit.lead_id)!;
  }

  findByLeadId(leadId: string): AuditDiagnostics | null {
    const row = this.db.prepare('SELECT * FROM audit_diagnostics WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1').get(leadId) as any;
    if (!row) return null;

    return {
      id: row.id,
      lead_id: row.lead_id,
      has_website: Boolean(row.has_website),
      is_mobile_responsive: Boolean(row.is_mobile_responsive),
      lighthouse_perf_score: Number(row.lighthouse_perf_score),
      ttfb_ms: Number(row.ttfb_ms),
      load_time_ms: row.load_time_ms !== null ? Number(row.load_time_ms) : undefined,
      screenshot_path: row.screenshot_path ?? undefined,
      detected_tech_stack: row.detected_tech_stack ? JSON.parse(row.detected_tech_stack) : { is_outdated_stack: false, details: [] },
      ai_opportunity_type: row.ai_opportunity_type ?? undefined,
      demo_url_deployed: row.demo_url_deployed ?? undefined,
      issues_found: row.issues_found ? JSON.parse(row.issues_found) : [],
      created_at: row.created_at,
    };
  }
}
