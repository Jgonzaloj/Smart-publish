import { getDatabase } from '../../db/database.js';

export class DriverPresenceService {
  private db = getDatabase();

  /**
   * Actualiza el estado del conductor
   */
  setDriverStatus(driverId: string, status: 'online' | 'offline' | 'busy' | 'suspended'): void {
    this.db.prepare(`
      UPDATE drivers 
      SET status = ?, last_location_update = CURRENT_TIMESTAMP 
      WHERE user_id = ?
    `).run(status, driverId);
  }

  /**
   * Bloqueo atómico temporal durante oferta de oportunidad (Reserva de 10s)
   */
  lockDriverForOffer(driverId: string): boolean {
    const result = this.db.prepare(`
      UPDATE drivers 
      SET status = 'busy' 
      WHERE user_id = ? AND status = 'online'
    `).run(driverId);

    return result.changes > 0;
  }

  /**
   * Libera al conductor si la oferta expiró o fue rechazada
   */
  releaseDriver(driverId: string): void {
    this.db.prepare(`
      UPDATE drivers 
      SET status = 'online' 
      WHERE user_id = ? AND status = 'busy'
    `).run(driverId);
  }

  /**
   * Detecta conductores inactivos (sin ping GPS en más de 5 minutos)
   */
  purgeInactiveDrivers(maxInactiveMinutes = 5): number {
    const result = this.db.prepare(`
      UPDATE drivers 
      SET status = 'offline' 
      WHERE status = 'online' AND (strftime('%s', 'now') - strftime('%s', last_location_update)) > (? * 60)
    `).run(maxInactiveMinutes);

    return result.changes;
  }
}
