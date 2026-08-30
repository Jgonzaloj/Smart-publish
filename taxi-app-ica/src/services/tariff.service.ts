import { getDatabase } from '../db/database.js';
import { GeoService } from './geo.service.js';
import { LocationPoint } from '../types/index.js';

export interface FareCalculationResult {
  estimated_fare: number;
  base_fare: number;
  distance_fare: number;
  time_fare: number;
  night_surcharge: number;
  tourist_surcharge: number;
  distance_km: number;
  duration_minutes: number;
  is_night_rate: boolean;
  is_huacachina_trip: boolean;
  breakdown_text: string;
}

export class TariffService {
  private db = getDatabase();
  private geoService = new GeoService();

  /**
   * Calcula la tarifa oficial de taxi para cualquier trayecto en Ica
   */
  calculateFare(origin: LocationPoint, destination: LocationPoint, requestedTime = new Date()): FareCalculationResult {
    const tariffRule = this.getTariffRule();
    const distanceKm = this.geoService.calculateDistanceKm(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );
    const durationMinutes = this.geoService.estimateDurationMinutes(distanceKm);

    // 1. Tarifa Base
    const baseFare = tariffRule.base_fare; // S/ 6.00

    // 2. Costo por distancia y tiempo
    const distanceFare = distanceKm * tariffRule.price_per_km;
    const timeFare = durationMinutes * tariffRule.price_per_min;

    // 3. Recargo Nocturno (22:00 a 05:00)
    const hour = requestedTime.getHours();
    const isNight = hour >= 22 || hour < 5;
    const subtotal = baseFare + distanceFare + timeFare;
    const nightSurcharge = isNight ? subtotal * (tariffRule.night_multiplier - 1) : 0;

    // 4. Recargo Turístico Huacachina (si origen o destino es Huacachina)
    const isHuacachinaTrip = 
      this.geoService.isHuacachinaZone(origin.latitude, origin.longitude) ||
      this.geoService.isHuacachinaZone(destination.latitude, destination.longitude);
    const touristSurcharge = isHuacachinaTrip ? tariffRule.tourist_zone_surcharge : 0;

    // Total final redondeado a múltiplos de 0.50 (estándar práctico en Ica)
    let total = baseFare + distanceFare + timeFare + nightSurcharge + touristSurcharge;
    total = Math.max(tariffRule.min_fare, total);
    const roundedFare = Math.round(total * 2) / 2; // Redondeo a 0.50 centavos

    return {
      estimated_fare: roundedFare,
      base_fare: baseFare,
      distance_fare: Math.round(distanceFare * 100) / 100,
      time_fare: Math.round(timeFare * 100) / 100,
      night_surcharge: Math.round(nightSurcharge * 100) / 100,
      tourist_surcharge: touristSurcharge,
      distance_km: distanceKm,
      duration_minutes: durationMinutes,
      is_night_rate: isNight,
      is_huacachina_trip: isHuacachinaTrip,
      breakdown_text: `Base: S/ ${baseFare.toFixed(2)} + Distancia (${distanceKm} km): S/ ${distanceFare.toFixed(2)}${isHuacachinaTrip ? ' + Recargo Huacachina: S/ 3.50' : ''}`,
    };
  }

  private getTariffRule() {
    const row = this.db.prepare("SELECT * FROM tariff_rules WHERE id = 'tariff_ica_standard' LIMIT 1").get() as any;
    if (row) {
      return {
        base_fare: Number(row.base_fare),
        price_per_km: Number(row.price_per_km),
        price_per_min: Number(row.price_per_min),
        min_fare: Number(row.min_fare),
        night_multiplier: Number(row.night_multiplier),
        tourist_zone_surcharge: Number(row.tourist_zone_surcharge),
      };
    }
    return {
      base_fare: 6.00,
      price_per_km: 1.80,
      price_per_min: 0.30,
      min_fare: 6.00,
      night_multiplier: 1.25,
      tourist_zone_surcharge: 3.50,
    };
  }
}
