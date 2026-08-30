import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';
import { OutreachResult, DomainHealth } from '../../types/index.js';

export class OutreachRepository {
  private db = getDatabase();

  logOutreach(result: Omit<OutreachResult, 'id' | 'sent_at'>): OutreachResult {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO outreach_results (id, lead_id, channel, replied, converted, copy_used, notes)
      VALUES (@id, @lead_id, @channel, @replied, @converted, @copy_used, @notes)
    `);

    stmt.run({
      id,
      lead_id: result.lead_id,
      channel: result.channel,
      replied: result.replied ? 1 : 0,
      converted: result.converted ? 1 : 0,
      copy_used: result.copy_used,
      notes: result.notes || null,
    });

    const row = this.db.prepare('SELECT * FROM outreach_results WHERE id = ?').get(id) as any;
    return {
      id: row.id,
      lead_id: row.lead_id,
      channel: row.channel,
      sent_at: row.sent_at,
      replied: Boolean(row.replied),
      converted: Boolean(row.converted),
      copy_used: row.copy_used,
      notes: row.notes ?? undefined,
    };
  }

  markReplied(leadId: string): void {
    this.db.prepare(`
      UPDATE outreach_results
      SET replied = 1
      WHERE lead_id = ?
    `).run(leadId);
  }

  markConverted(leadId: string): void {
    this.db.prepare(`
      UPDATE outreach_results
      SET converted = 1
      WHERE lead_id = ?
    `).run(leadId);
  }

  getDomainHealth(domain = 'auditoria.tudominio.com'): DomainHealth {
    const row = this.db.prepare('SELECT * FROM domain_health WHERE domain = ? LIMIT 1').get(domain) as any;
    if (!row) {
      return {
        id: 'dh_default',
        domain,
        bounce_rate_24h: 0,
        spam_complaints: 0,
        circuit_breaker_active: false,
        checked_at: new Date().toISOString(),
      };
    }

    return {
      id: row.id,
      domain: row.domain,
      bounce_rate_24h: Number(row.bounce_rate_24h),
      spam_complaints: Number(row.spam_complaints),
      circuit_breaker_active: Boolean(row.circuit_breaker_active),
      checked_at: row.checked_at,
    };
  }

  updateDomainHealth(domain: string, bounceRate: number, spamComplaints: number, circuitBreaker: boolean): void {
    this.db.prepare(`
      UPDATE domain_health
      SET bounce_rate_24h = ?, spam_complaints = ?, circuit_breaker_active = ?, checked_at = CURRENT_TIMESTAMP
      WHERE domain = ?
    `).run(bounceRate, spamComplaints, circuitBreaker ? 1 : 0, domain);
  }

  getBestPerformingCopies(limit = 5): string[] {
    const rows = this.db.prepare(`
      SELECT copy_used
      FROM outreach_results
      WHERE replied = 1
      ORDER BY sent_at DESC
      LIMIT ?
    `).all(limit) as { copy_used: string }[];

    return rows.map((r) => r.copy_used);
  }
}
