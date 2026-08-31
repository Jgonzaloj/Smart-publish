import { getDatabase } from '../db/database.js';
import { GeoService } from './geo.service.js';
export class TariffService {
    db = getDatabase();
    geoService = new GeoService();
    /**
     * Motor de Tarifa Inteligente V2 (Fórmula Parametrizada de Ica)
     */
    calculateFare(origin, destination, requestedTime = new Date()) {
        const rules = this.getTariffRule();
        const distanceKm = this.geoService.calculateDistanceKm(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
        const durationMinutes = this.geoService.estimateDurationMinutes(distanceKm);
        // 1. Subtotal Base + Distancia + Tiempo
        const baseFare = rules.base_fare; // S/ 4.00
        const distanceFare = distanceKm * rules.price_per_km; // S/ 1.40/km
        const timeFare = durationMinutes * rules.price_per_min; // S/ 0.12/min
        const subtotal = baseFare + distanceFare + timeFare;
        // 2. Factor Horario (Zona Horaria Explícita America/Lima - Hallazgo Medio #14)
        let hour = requestedTime.getHours();
        try {
            const icaHourStr = new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/Lima',
                hour: 'numeric',
                hour12: false
            }).format(requestedTime);
            hour = parseInt(icaHourStr, 10);
        }
        catch { }
        let timeFactor = 1.00;
        let timeLabel = 'Tarifa Regular Diurna';
        if (hour >= 6 && hour < 9) {
            timeFactor = rules.peak_morning_factor; // 1.05
            timeLabel = 'Hora Punta Mañana (+5%)';
        }
        else if (hour >= 17 && hour < 21) {
            timeFactor = rules.peak_evening_factor; // 1.15
            timeLabel = 'Hora Punta Tarde (+15%)';
        }
        else if (hour >= 21 || hour < 6) {
            timeFactor = rules.night_factor; // 1.25
            timeLabel = 'Horario Nocturno (+25%)';
        }
        // 3. Factor de Zona (Huacachina / Dunas)
        const isHuacachinaTrip = this.geoService.isHuacachinaZone(origin.latitude, origin.longitude) ||
            this.geoService.isHuacachinaZone(destination.latitude, destination.longitude);
        const zoneFactor = isHuacachinaTrip ? rules.huacachina_factor : 1.00;
        const zoneLabel = isHuacachinaTrip ? 'Zona Turística Huacachina (+20%)' : 'Zona Urbana';
        // 4. Multiplicador de Demanda
        const demandMultiplier = rules.demand_multiplier || 1.00;
        // 5. Cálculo Total Recomendado
        let totalAdjusted = subtotal * timeFactor * zoneFactor * demandMultiplier;
        totalAdjusted = Math.max(rules.min_fare, totalAdjusted);
        // Redondeo comercial a S/ 0.50
        const recommendedFare = Math.round(totalAdjusted * 2) / 2;
        const minAllowedFare = Math.max(rules.min_fare, Math.round((recommendedFare * rules.min_offer_pct) * 2) / 2);
        const maxSuggestedFare = Math.round((recommendedFare * rules.max_offer_pct) * 2) / 2;
        return {
            recommended_fare: recommendedFare,
            min_allowed_fare: minAllowedFare,
            max_suggested_fare: maxSuggestedFare,
            base_fare: baseFare,
            distance_fare: Math.round(distanceFare * 100) / 100,
            time_fare: Math.round(timeFare * 100) / 100,
            distance_km: distanceKm,
            duration_minutes: durationMinutes,
            active_factors: {
                time_factor: timeFactor,
                time_label: timeLabel,
                zone_factor: zoneFactor,
                zone_label: zoneLabel,
                demand_multiplier: demandMultiplier,
            },
            breakdown_text: `Base S/ ${baseFare.toFixed(2)} + ${distanceKm} km (S/ ${distanceFare.toFixed(2)}) + ${durationMinutes} min${isHuacachinaTrip ? ' + Huacachina (+20%)' : ''}`,
        };
    }
    /**
     * Semáforo de Probabilidad de Aceptación (Price Intelligence Feedback)
     */
    evaluateOfferProbability(offerFare, recommendedFare) {
        const ratio = offerFare / recommendedFare;
        if (ratio >= 0.98) {
            return {
                offer_fare: offerFare,
                recommended_fare: recommendedFare,
                ratio,
                status: 'HIGH',
                badge_color: 'green',
                message: '🟢 Alta probabilidad de encontrar conductor rápido',
                estimated_wait_time: '< 1 min',
            };
        }
        else if (ratio >= 0.85) {
            return {
                offer_fare: offerFare,
                recommended_fare: recommendedFare,
                ratio,
                status: 'MEDIUM',
                badge_color: 'yellow',
                message: '🟡 Oferta moderada — podría tardar unos minutos más',
                estimated_wait_time: '2 – 4 min',
            };
        }
        else {
            return {
                offer_fare: offerFare,
                recommended_fare: recommendedFare,
                ratio,
                status: 'LOW',
                badge_color: 'red',
                message: '🔴 Oferta demasiado baja para esta ruta en Ica',
                estimated_wait_time: 'Demora alta / Posible rechazo',
            };
        }
    }
    /**
     * Obtiene la regla de tarifas activa desde SQLite
     */
    getTariffRule() {
        const row = this.db.prepare("SELECT * FROM tariff_rules WHERE id = 'tariff_ica_standard' LIMIT 1").get();
        if (row) {
            return {
                id: row.id,
                name: row.name,
                base_fare: Number(row.base_fare || 4.00),
                price_per_km: Number(row.price_per_km || 1.40),
                price_per_min: Number(row.price_per_min || 0.12),
                min_fare: Number(row.min_fare || 6.00),
                min_offer_pct: Number(row.min_offer_pct || 0.75),
                max_offer_pct: Number(row.max_offer_pct || 1.40),
                peak_morning_factor: Number(row.peak_morning_factor || 1.05),
                peak_evening_factor: Number(row.peak_evening_factor || 1.15),
                night_factor: Number(row.night_factor || 1.25),
                huacachina_factor: Number(row.huacachina_factor || 1.20),
                demand_multiplier: Number(row.demand_multiplier || 1.00),
                updated_at: row.updated_at,
            };
        }
        return {
            id: 'tariff_ica_standard',
            name: 'Motor de Tarifas Inteligente Ica',
            base_fare: 4.00,
            price_per_km: 1.40,
            price_per_min: 0.12,
            min_fare: 6.00,
            min_offer_pct: 0.75,
            max_offer_pct: 1.40,
            peak_morning_factor: 1.05,
            peak_evening_factor: 1.15,
            night_factor: 1.25,
            huacachina_factor: 1.20,
            demand_multiplier: 1.00,
        };
    }
    /**
     * Actualiza las reglas tarifarias desde el Panel Admin
     */
    updateTariffRule(newRules) {
        const stmt = this.db.prepare(`
      UPDATE tariff_rules
      SET base_fare = COALESCE(@base_fare, base_fare),
          price_per_km = COALESCE(@price_per_km, price_per_km),
          price_per_min = COALESCE(@price_per_min, price_per_min),
          min_fare = COALESCE(@min_fare, min_fare),
          min_offer_pct = COALESCE(@min_offer_pct, min_offer_pct),
          max_offer_pct = COALESCE(@max_offer_pct, max_offer_pct),
          peak_morning_factor = COALESCE(@peak_morning_factor, peak_morning_factor),
          peak_evening_factor = COALESCE(@peak_evening_factor, peak_evening_factor),
          night_factor = COALESCE(@night_factor, night_factor),
          huacachina_factor = COALESCE(@huacachina_factor, huacachina_factor),
          demand_multiplier = COALESCE(@demand_multiplier, demand_multiplier),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 'tariff_ica_standard'
    `);
        stmt.run(newRules);
        return true;
    }
}
