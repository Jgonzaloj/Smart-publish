import { TariffService, FareCalculationResult } from '../tariff.service.js';
import { LocationPoint } from '../../types/index.js';

export interface PricingEngineOutput {
  recommendedFare: number;
  minimumOffer: number;
  maximumRecommendedOffer: number;
  confidence: number;
  distanceKm: number;
  durationMinutes: number;
  breakdown: string;
}

export class PricingEngine {
  private tariffService = new TariffService();

  /**
   * Ejecuta el cálculo inteligente de precios con intervalo de confianza
   */
  calculatePrice(origin: LocationPoint, destination: LocationPoint, time = new Date()): PricingEngineOutput {
    const raw: FareCalculationResult = this.tariffService.calculateFare(origin, destination, time);

    // Nivel de confianza del precio (alta en zonas urbanas conocidas de Ica)
    const isHuacachina = raw.active_factors.zone_factor > 1.0;
    const confidence = isHuacachina ? 0.95 : 0.92;

    return {
      recommendedFare: raw.recommended_fare,
      minimumOffer: raw.min_allowed_fare,
      maximumRecommendedOffer: raw.max_suggested_fare,
      confidence,
      distanceKm: raw.distance_km,
      durationMinutes: raw.duration_minutes,
      breakdown: raw.breakdown_text,
    };
  }
}
