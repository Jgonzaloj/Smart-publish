import { getDatabase } from '../../db/database.js';
import { GeoService } from '../geo.service.js';
import { MatchingService } from './matching.service.js';
export class CandidateService {
    db = getDatabase();
    geoService = new GeoService();
    matchingService = new MatchingService();
    /**
     * Obtiene y califica a los mejores conductores para un viaje (TOP N con Match Score y Oleadas)
     */
    findAndRankCandidates(originLat, originLng, maxRadiusKm = 5.0, limit = 6) {
        const rows = this.db.prepare(`
      SELECT u.id, u.phone, u.full_name, u.email, u.role, u.rating_avg, u.total_rides, u.created_at,
             d.status, d.current_lat, d.current_lng, d.current_address, d.wallet_balance, d.commission_rate, d.last_location_update,
             v.plate_number, v.brand, v.model, v.color, v.year, v.photo_url
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN vehicles v ON d.user_id = v.driver_id
      LEFT JOIN driver_documents doc ON d.user_id = doc.driver_id
      WHERE d.status = 'online' AND (doc.status IS NULL OR doc.status = 'approved')
    `).all();
        const candidates = [];
        for (const r of rows) {
            const driver = {
                id: r.id,
                phone: r.phone,
                full_name: r.full_name,
                email: r.email,
                role: r.role,
                rating_avg: Number(r.rating_avg || 5.0),
                total_rides: Number(r.total_rides || 0),
                created_at: r.created_at,
                status: r.status,
                current_location: {
                    latitude: Number(r.current_lat || -14.06777),
                    longitude: Number(r.current_lng || -75.72861),
                    address: r.current_address || 'Ica',
                },
                vehicle: r.plate_number ? {
                    id: `veh_${r.id}`,
                    driver_id: r.id,
                    plate_number: r.plate_number,
                    brand: r.brand,
                    model: r.model,
                    color: r.color,
                    year: r.year,
                    photo_url: r.photo_url,
                } : undefined,
                wallet_balance: Number(r.wallet_balance || 50.0),
                commission_rate: Number(r.commission_rate || 0.10),
            };
            const distanceKm = this.geoService.calculateDistanceKm(driver.current_location.latitude, driver.current_location.longitude, originLat, originLng);
            if (distanceKm <= maxRadiusKm) {
                const etaMinutes = this.geoService.estimateDurationMinutes(distanceKm);
                const scored = this.matchingService.calculateMatchScore(driver, distanceKm, etaMinutes);
                candidates.push(scored);
            }
        }
        // Ordenar por Match Score DESCENDENTE (El mejor primero)
        candidates.sort((a, b) => b.match_score - a.match_score);
        // Asignar Ranking y Oleadas (Ola 1 = Top 3, Ola 2 = 4 a 6, Ola 3 = 7 a 11)
        return candidates.slice(0, limit).map((c, index) => {
            c.rank = index + 1;
            c.wave = index < 3 ? 1 : index < 6 ? 2 : 3;
            return c;
        });
    }
}
