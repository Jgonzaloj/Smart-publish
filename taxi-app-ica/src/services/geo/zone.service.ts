import { getDatabase } from '../../db/database.js';
import { GeoService } from '../geo.service.js';

export interface VirtualZone {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  active_drivers: number;
  pending_requests: number;
  demand_level: 'HIGH' | 'MEDIUM' | 'LOW';
  reposition_advice?: string;
}

export class ZoneService {
  private db = getDatabase();
  private geoService = new GeoService();

  private zones: Array<{ id: string; name: string; lat: number; lng: number; radius: number }> = [
    { id: 'zone_centro', name: 'Centro / Plaza de Armas', lat: -14.06777, lng: -75.72861, radius: 1.5 },
    { id: 'zone_huacachina', name: 'Huacachina / Dunas', lat: -14.08745, lng: -75.76332, radius: 2.0 },
    { id: 'zone_comercial', name: 'C.C. El Quinde / Plaza del Sol', lat: -14.07542, lng: -75.73418, radius: 1.8 },
    { id: 'zone_san_joaquin', name: 'San Joaquín / Residencial', lat: -14.05890, lng: -75.74230, radius: 2.0 },
    { id: 'zone_parcona', name: 'Parcona', lat: -14.05380, lng: -75.70610, radius: 2.5 },
    { id: 'zone_subtanjalla', name: 'Subtanjalla', lat: -14.02890, lng: -75.75120, radius: 3.0 },
    { id: 'zone_tinguina', name: 'La Tinguiña', lat: -14.04560, lng: -75.71180, radius: 2.5 },
  ];

  /**
   * Genera el Heat Map de Demanda y balance de oferta en Ica
   */
  getZoneHeatMap(): VirtualZone[] {
    const drivers = this.db.prepare("SELECT current_lat, current_lng FROM drivers WHERE status = 'online'").all() as any[];
    const pendingRides = this.db.prepare("SELECT origin_lat, origin_lng FROM rides WHERE status = 'REQUESTED'").all() as any[];

    return this.zones.map(z => {
      let driverCount = 0;
      let requestCount = 0;

      for (const d of drivers) {
        if (this.geoService.calculateDistanceKm(d.current_lat, d.current_lng, z.lat, z.lng) <= z.radius) {
          driverCount++;
        }
      }

      for (const r of pendingRides) {
        if (this.geoService.calculateDistanceKm(r.origin_lat, r.origin_lng, z.lat, z.lng) <= z.radius) {
          requestCount++;
        }
      }

      let demandLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      let advice: string | undefined;

      if (requestCount >= 3 || (requestCount > 0 && driverCount === 0)) {
        demandLevel = 'HIGH';
        advice = `⚠️ Alta demanda en ${z.name}: ${requestCount} solicitudes con solo ${driverCount} taxis libres. Mover 2 vehículos.`;
      } else if (requestCount >= 1) {
        demandLevel = 'MEDIUM';
        advice = `Demanda moderada en ${z.name}.`;
      } else {
        demandLevel = 'LOW';
      }

      return {
        id: z.id,
        name: z.name,
        center_lat: z.lat,
        center_lng: z.lng,
        radius_km: z.radius,
        active_drivers: driverCount,
        pending_requests: requestCount,
        demand_level: demandLevel,
        reposition_advice: advice,
      };
    });
  }
}
