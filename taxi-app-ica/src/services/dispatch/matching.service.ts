import { Driver } from '../../types/index.js';

export interface ScoredDriverCandidate {
  driver: Driver;
  distance_km: number;
  eta_minutes: number;
  match_score: number; // 0 a 100
  score_breakdown: {
    eta_score: number;        // 40% peso
    distance_score: number;   // 20% peso
    rating_score: number;     // 15% peso
    acceptance_score: number; // 15% peso
    activity_score: number;   // 10% peso
  };
  rank: number;
  wave: number; // 1 = TOP 3 (Prioridad inmediata), 2 = Siguientes 3 (Escalamiento)
}

export class MatchingService {
  /**
   * Calcula el Match Score (0 - 100) ponderado para un conductor respecto a un origen
   */
  calculateMatchScore(
    driver: Driver,
    distanceKm: number,
    etaMinutes: number,
    acceptanceRate = 0.95,
    hoursOnlineToday = 4.5
  ): ScoredDriverCandidate {
    // 1. ETA Score (40% de peso): 3 min o menos = 100 pts, 12 min = 20 pts
    const etaScore = Math.max(0, Math.min(100, 100 - (etaMinutes - 2) * 8));

    // 2. Distance Score (20% de peso): <= 1.0 km = 100 pts, 5 km = 20 pts
    const distanceScore = Math.max(0, Math.min(100, 100 - (distanceKm - 0.5) * 18));

    // 3. Rating Score (15% de peso): 5.0 = 100 pts, 4.0 = 50 pts
    const rating = driver.rating_avg || 4.8;
    const ratingScore = Math.max(0, Math.min(100, (rating - 3.5) * 66.6));

    // 4. Acceptance Rate Score (15% de peso): 98% = 100 pts, 70% = 40 pts
    const acceptanceScore = Math.max(0, Math.min(100, acceptanceRate * 100));

    // 5. Activity / Reliability Score (10% de peso)
    const activityScore = Math.min(100, Math.max(50, hoursOnlineToday * 18));

    // Cálculo Ponderado Total
    const rawMatchScore =
      (etaScore * 0.40) +
      (distanceScore * 0.20) +
      (ratingScore * 0.15) +
      (acceptanceScore * 0.15) +
      (activityScore * 0.10);

    const matchScore = Math.round(Math.min(99, Math.max(40, rawMatchScore)));

    return {
      driver,
      distance_km: Math.round(distanceKm * 10) / 10,
      eta_minutes: etaMinutes,
      match_score: matchScore,
      score_breakdown: {
        eta_score: Math.round(etaScore),
        distance_score: Math.round(distanceScore),
        rating_score: Math.round(ratingScore),
        acceptance_score: Math.round(acceptanceScore),
        activity_score: Math.round(activityScore),
      },
      rank: 1,
      wave: 1,
    };
  }
}
