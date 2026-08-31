export class MatchingService {
    /**
     * Calcula el Match Score (0 - 100) ponderado según especificación Smart Mobility Ica:
     * 35% ETA + 20% Distancia + 15% Calificación + 10% Tasa Aceptación + 10% Tiempo Disponible + 5% Zona + 5% Historial
     */
    calculateMatchScore(driver, distanceKm, etaMinutes, acceptanceRate = 0.95, hoursOnlineToday = 4.5, zoneFamiliarity = 1.0, historyScore = 95) {
        // 1. ETA Score (35% peso): <= 2 min = 100 pts, 12 min = 20 pts
        const etaScore = Math.max(0, Math.min(100, 100 - (etaMinutes - 2) * 8));
        // 2. Distance Score (20% peso): <= 0.8 km = 100 pts, 5 km = 20 pts
        const distanceScore = Math.max(0, Math.min(100, 100 - (distanceKm - 0.5) * 18));
        // 3. Rating Score (15% peso): 5.0 = 100 pts, 4.0 = 50 pts
        const rating = driver.rating_avg || 4.8;
        const ratingScore = Math.max(0, Math.min(100, (rating - 3.5) * 66.6));
        // 4. Acceptance Rate (10% peso): 98% = 100 pts, 70% = 40 pts
        const acceptanceScore = Math.max(0, Math.min(100, acceptanceRate * 100));
        // 5. Time Available / Reliability (10% peso)
        const timeAvailableScore = Math.min(100, Math.max(50, hoursOnlineToday * 18));
        // 6. Zone Familiarity (5% peso)
        const zoneScore = Math.min(100, Math.max(70, zoneFamiliarity * 95));
        // 7. Historical Behavior (5% peso)
        const historyCalculated = Math.min(100, Math.max(60, historyScore));
        // Cálculo Ponderado Total
        const rawMatchScore = (etaScore * 0.35) +
            (distanceScore * 0.20) +
            (ratingScore * 0.15) +
            (acceptanceScore * 0.10) +
            (timeAvailableScore * 0.10) +
            (zoneScore * 0.05) +
            (historyCalculated * 0.05);
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
                time_available_score: Math.round(timeAvailableScore),
                zone_score: Math.round(zoneScore),
                history_score: Math.round(historyCalculated),
            },
            rank: 0,
            wave: 1,
        };
    }
}
