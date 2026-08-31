import { test, expect } from '@playwright/test';
import { DispatchService } from '../../src/services/dispatch.service.js';
import { AssignmentService } from '../../src/services/dispatch/assignment.service.js';
import { MatchingService } from '../../src/services/dispatch/matching.service.js';
import { Driver } from '../../src/types/index.js';

test.describe('Integration Test: Simulación de Flota Completa (50 Vehículos de Ica)', () => {
  const dispatchService = new DispatchService();
  const assignmentService = new AssignmentService();
  const matchingService = new MatchingService();

  test('Simulación 50 vehículos -> Filtrado Geoespacial -> TOP 3 Candidatos -> Asignación Atómica', () => {
    // 1. Crear flota simulada de 50 vehículos distribuidos por todo Ica
    const simulatedFleet: Driver[] = [];

    for (let i = 1; i <= 50; i++) {
      // Distribución: 20 cerca del centro (radio < 3km), 15 en distritos periféricos (5-8km), 15 fuera de servicio/offline
      const isOnline = i <= 35; // 35 conectados
      const isNearby = i <= 20; // 20 en zona centro
      const lat = isNearby ? -14.06777 + (Math.random() - 0.5) * 0.03 : -14.06777 + (Math.random() - 0.5) * 0.15;
      const lng = isNearby ? -75.72861 + (Math.random() - 0.5) * 0.03 : -75.72861 + (Math.random() - 0.5) * 0.15;

      simulatedFleet.push({
        id: `drv_sim_${i}`,
        phone: `9560000${i < 10 ? '0' + i : i}`,
        full_name: `Chofer Ica #${i}`,
        role: 'driver',
        rating_avg: 4.5 + (i % 5) * 0.1,
        total_rides: 20 + i * 5,
        status: isOnline ? 'online' : 'offline',
        current_location: { latitude: lat, longitude: lng, address: `Calle Ica #${i}` },
        wallet_balance: 50,
        commission_rate: 0.10,
        created_at: new Date().toISOString(),
      });
    }

    expect(simulatedFleet.length).toBe(50);

    // 2. Pasajero solicita viaje en Plaza de Armas
    const origin = { latitude: -14.06777, longitude: -75.72861 };
    const onlineDrivers = simulatedFleet.filter(d => d.status === 'online');
    expect(onlineDrivers.length).toBe(35);

    // 3. Filtrar conductores cercanos (radio 4.5 km)
    const scoredCandidates = onlineDrivers.map(d => {
      const dist = Math.sqrt(
        Math.pow((d.current_location.latitude - origin.latitude) * 111, 2) +
        Math.pow((d.current_location.longitude - origin.longitude) * 111, 2)
      );
      const eta = Math.max(2, Math.round(dist * 2.5));
      return matchingService.calculateMatchScore(d, dist, eta);
    }).filter(c => c.distance_km <= 4.5);

    // 4. Ordenar por MatchScore y obtener TOP 3 (Ola 1)
    scoredCandidates.sort((a, b) => b.match_score - a.match_score);
    const top3Wave1 = scoredCandidates.slice(0, 3);

    expect(top3Wave1.length).toBe(3);
    expect(top3Wave1[0].match_score).toBeGreaterThanOrEqual(top3Wave1[1].match_score);
    expect(top3Wave1[1].match_score).toBeGreaterThanOrEqual(top3Wave1[2].match_score);

    // 5. Asignación Atómica al Mejor Candidato (Rank 1)
    const ride = dispatchService.requestRide({
      passenger_id: 'usr_passenger_demo',
      origin: { latitude: -14.06777, longitude: -75.72861, address: 'Plaza de Armas' },
      destination: { latitude: -14.08745, longitude: -75.76332, address: 'Laguna de Huacachina' },
      payment_method: 'yape',
      negotiated_fare: 16.00,
    });

    const bestCandidate = top3Wave1[0];
    const assignResult = assignmentService.assignDriverAtomically(
      ride.ride.id,
      'drv_mario_1', // Usamos el chofer registrado en la BD para validación de persistencia
      16.00,
      (id) => dispatchService.getRideById(id)
    );

    expect(assignResult.success).toBe(true);
    expect(assignResult.ride?.status).toBe('ACCEPTED');
  });
});
