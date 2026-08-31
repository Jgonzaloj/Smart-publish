import { test, expect } from '@playwright/test';
import { DispatchService } from '../../src/services/dispatch.service.js';
import { AssignmentService } from '../../src/services/dispatch/assignment.service.js';

test.describe('Integration Tests: Concurrency & Atomic Assignment', () => {
  const dispatchService = new DispatchService();
  const assignmentService = new AssignmentService();

  test.beforeEach(() => {
    // Resetear conductores a online para pruebas repetibles
    const db = (dispatchService as any).db;
    db.prepare("UPDATE drivers SET status = 'online'").run();
  });

  test('Caso Concurrencia: Dos conductores aceptan el mismo viaje -> Solo 1 gana y el otro recibe error limpio', () => {
    // 1. Crear viaje
    const dispatchResult = dispatchService.requestRide({
      passenger_id: 'usr_passenger_demo',
      origin: { latitude: -14.06777, longitude: -75.72861, address: 'Plaza de Armas' },
      destination: { latitude: -14.07542, longitude: -75.73418, address: 'C.C. El Quinde' },
      payment_method: 'cash',
      negotiated_fare: 15.00,
    });

    const rideId = dispatchResult.ride.id;

    // 2. Simular Chofer A y Chofer B aceptando en el mismo instante
    const resultDriverA = assignmentService.assignDriverAtomically(
      rideId,
      'drv_mario_1',
      15.00,
      (id) => dispatchService.getRideById(id)
    );

    const resultDriverB = assignmentService.assignDriverAtomically(
      rideId,
      'drv_jorge_2',
      15.00,
      (id) => dispatchService.getRideById(id)
    );

    // Chofer A debe ganar
    expect(resultDriverA.success).toBe(true);
    expect(resultDriverA.ride?.driver_id).toBe('drv_mario_1');
    expect(resultDriverA.ride?.status).toBe('ACCEPTED');

    // Chofer B debe ser rechazado de forma atómica y segura
    expect(resultDriverB.success).toBe(false);
    expect(resultDriverB.error).toBe('ALREADY_ASSIGNED');
    expect(resultDriverB.message).toContain('ya fue tomado');
  });

  test('Caso Wave Dispatching: Los conductores se agrupan en Wave 1 (TOP 3) y Wave 2', () => {
    const dispatchResult = dispatchService.requestRide({
      passenger_id: 'usr_passenger_demo',
      origin: { latitude: -14.06777, longitude: -75.72861, address: 'Plaza de Armas' },
      destination: { latitude: -14.08745, longitude: -75.76332, address: 'Huacachina' },
      payment_method: 'yape',
      negotiated_fare: 20.00,
    });

    expect(dispatchResult.top_candidates.length).toBeGreaterThanOrEqual(1);
    expect(dispatchResult.wave_1_drivers.length).toBeLessThanOrEqual(3);
  });
});
