import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';
import { ProspectLead, LeadStatus } from '../../types/index.js';

export class LeadsRepository {
  private db = getDatabase();

  /**
   * Inserta un lead asegurando idempotencia por place_id (ON CONFLICT DO NOTHING)
   */
  insertLead(lead: Omit<ProspectLead, 'id' | 'status' | 'retry_count' | 'do_not_contact' | 'created_at' | 'updated_at'>): ProspectLead | null {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO prospect_leads (
        id, place_id, business_name, niche, phone, whatsapp, email,
        google_maps_url, rating, reviews_count, current_website_url,
        status, retry_count, do_not_contact
      ) VALUES (
        @id, @place_id, @business_name, @niche, @phone, @whatsapp, @email,
        @google_maps_url, @rating, @reviews_count, @current_website_url,
        'INGESTED', 0, 0
      )
      ON CONFLICT(place_id) DO NOTHING
    `);

    const result = stmt.run({
      id,
      place_id: lead.place_id,
      business_name: lead.business_name,
      niche: lead.niche || null,
      phone: lead.phone || null,
      whatsapp: lead.whatsapp || null,
      email: lead.email || null,
      google_maps_url: lead.google_maps_url || null,
      rating: lead.rating ?? null,
      reviews_count: lead.reviews_count ?? null,
      current_website_url: lead.current_website_url || null,
    });

    if (result.changes === 0) {
      // Ya existía un lead con este place_id
      return null;
    }

    return this.findById(id);
  }

  findById(id: string): ProspectLead | null {
    const row = this.db.prepare('SELECT * FROM prospect_leads WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.mapRowToLead(row);
  }

  findByPlaceId(placeId: string): ProspectLead | null {
    const row = this.db.prepare('SELECT * FROM prospect_leads WHERE place_id = ?').get(placeId) as any;
    if (!row) return null;
    return this.mapRowToLead(row);
  }

  findByStatus(status: LeadStatus, limit = 50): ProspectLead[] {
    const rows = this.db.prepare('SELECT * FROM prospect_leads WHERE status = ? ORDER BY created_at ASC LIMIT ?').all(status, limit) as any[];
    return rows.map((r) => this.mapRowToLead(r));
  }

  findByEmail(email: string): ProspectLead | null {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const row = this.db.prepare('SELECT * FROM prospect_leads WHERE LOWER(email) = ? LIMIT 1').get(cleanEmail) as any;
    if (!row) return null;
    return this.mapRowToLead(row);
  }

  /**
   * Obtiene leads en estado SENT con más de X horas sin respuesta para enviar el primer seguimiento (Follow-up 1)
   */
  findLeadsForFollowup1(hoursThreshold = 48, limit = 20): ProspectLead[] {
    const rows = this.db.prepare(`
      SELECT * FROM prospect_leads
      WHERE status = 'SENT'
        AND do_not_contact = 0
        AND updated_at <= datetime('now', '-' || ? || ' hours')
      ORDER BY updated_at ASC
      LIMIT ?
    `).all(hoursThreshold, limit) as any[];
    return rows.map((r) => this.mapRowToLead(r));
  }

  /**
   * Obtiene leads en estado FOLLOWUP_SENT con más de X horas sin respuesta para enviar el segundo seguimiento (Follow-up 2)
   */
  findLeadsForFollowup2(hoursThreshold = 72, limit = 20): ProspectLead[] {
    const rows = this.db.prepare(`
      SELECT * FROM prospect_leads
      WHERE status = 'FOLLOWUP_SENT'
        AND do_not_contact = 0
        AND updated_at <= datetime('now', '-' || ? || ' hours')
      ORDER BY updated_at ASC
      LIMIT ?
    `).all(hoursThreshold, limit) as any[];
    return rows.map((r) => this.mapRowToLead(r));
  }

  /**
   * Obtiene leads en estado FOLLOWUP_2 con más de X horas sin respuesta para archivarlos en frío (COLD)
   */
  findLeadsForCold(hoursThreshold = 72, limit = 20): ProspectLead[] {
    const rows = this.db.prepare(`
      SELECT * FROM prospect_leads
      WHERE status = 'FOLLOWUP_2'
        AND do_not_contact = 0
        AND updated_at <= datetime('now', '-' || ? || ' hours')
      ORDER BY updated_at ASC
      LIMIT ?
    `).all(hoursThreshold, limit) as any[];
    return rows.map((r) => this.mapRowToLead(r));
  }

  getAllLeads(limit = 200): ProspectLead[] {
    const rows = this.db.prepare('SELECT * FROM prospect_leads ORDER BY created_at DESC LIMIT ?').all(limit) as any[];
    return rows.map((r) => this.mapRowToLead(r));
  }

  /**
   * Transición atómica de estado:
   * UPDATE prospect_leads SET status = :newStatus WHERE id = :id AND status = :expectedStatus
   * Retorna true si la transición fue exitosa, false si el lead no estaba en el estado esperado (evita race conditions)
   */
  updateStatusAtomic(id: string, expectedStatus: LeadStatus, newStatus: LeadStatus): boolean {
    const stmt = this.db.prepare(`
      UPDATE prospect_leads
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = ?
    `);
    const result = stmt.run(newStatus, id, expectedStatus);
    return result.changes > 0;
  }

  /**
   * Forzar cambio de estado (usado en dashboard humano o acciones explícitas de control)
   */
  forceUpdateStatus(id: string, newStatus: LeadStatus, closerName?: string): boolean {
    let stmt;
    if (closerName) {
      stmt = this.db.prepare(`
        UPDATE prospect_leads
        SET status = ?, assigned_closer = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      const result = stmt.run(newStatus, closerName, id);
      return result.changes > 0;
    } else {
      stmt = this.db.prepare(`
        UPDATE prospect_leads
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      const result = stmt.run(newStatus, id);
      return result.changes > 0;
    }
  }

  incrementRetryCount(id: string): number {
    const stmt = this.db.prepare(`
      UPDATE prospect_leads
      SET retry_count = retry_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(id);
    const updated = this.findById(id);
    return updated ? updated.retry_count : 0;
  }

  setDoNotContact(id: string, value = true): void {
    this.db.prepare(`
      UPDATE prospect_leads
      SET do_not_contact = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(value ? 1 : 0, id);
  }

  getStats() {
    const rows = this.db.prepare(`
      SELECT status, count(*) as count
      FROM prospect_leads
      GROUP BY status
    `).all() as { status: LeadStatus; count: number }[];

    const total = this.db.prepare('SELECT count(*) as total FROM prospect_leads').get() as { total: number };

    return {
      total: total.total,
      byStatus: rows.reduce((acc, curr) => {
        acc[curr.status] = curr.count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  deleteLead(id: string): boolean {
    const tables = ['audit_diagnostics', 'proposals', 'outreach_results', 'opportunity_proposals', 'outreach_logs'];
    for (const table of tables) {
      try {
        this.db.prepare(`DELETE FROM ${table} WHERE lead_id = ?`).run(id);
      } catch (e) {
        // Ignorar si la tabla no existe en esta versión de la base de datos
      }
    }
    try {
      const res = this.db.prepare('DELETE FROM prospect_leads WHERE id = ?').run(id);
      return res.changes > 0;
    } catch (e) {
      console.error('Error al eliminar lead de prospect_leads:', e);
      return false;
    }
  }

  resetAllLeads(): void {
    const tables = ['audit_diagnostics', 'proposals', 'outreach_results', 'opportunity_proposals', 'outreach_logs'];
    for (const table of tables) {
      try {
        this.db.prepare(`DELETE FROM ${table}`).run();
      } catch (e) {
        // Ignorar si la tabla no existe
      }
    }
    try {
      this.db.prepare('DELETE FROM prospect_leads').run();
    } catch (e) {
      console.error('Error crítico limpiando prospect_leads:', e);
      throw e;
    }
  }

  private mapRowToLead(row: any): ProspectLead {
    return {
      id: row.id,
      place_id: row.place_id,
      business_name: row.business_name,
      niche: row.niche ?? undefined,
      phone: row.phone ?? undefined,
      whatsapp: row.whatsapp ?? undefined,
      email: row.email ?? undefined,
      google_maps_url: row.google_maps_url ?? undefined,
      rating: row.rating !== null ? Number(row.rating) : undefined,
      reviews_count: row.reviews_count !== null ? Number(row.reviews_count) : undefined,
      current_website_url: row.current_website_url ?? undefined,
      status: row.status as LeadStatus,
      retry_count: Number(row.retry_count || 0),
      do_not_contact: Boolean(row.do_not_contact),
      assigned_closer: row.assigned_closer ?? undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
