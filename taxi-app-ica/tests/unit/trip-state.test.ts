import { test, expect } from '@playwright/test';
import { TripStateService } from '../../src/services/trip/trip-state.service.js';

test.describe('Unit Tests: Trip State Machine Transitions', () => {
  test('Permite transiciones legales del ciclo de vida del viaje', () => {
    expect(TripStateService.isValidTransition('REQUESTED', 'ACCEPTED')).toBe(true);
    expect(TripStateService.isValidTransition('ACCEPTED', 'DRIVER_ARRIVING')).toBe(true);
    expect(TripStateService.isValidTransition('DRIVER_ARRIVED', 'TRIP_STARTED')).toBe(true);
    expect(TripStateService.isValidTransition('TRIP_STARTED', 'TRIP_COMPLETED')).toBe(true);
    expect(TripStateService.isValidTransition('TRIP_COMPLETED', 'PAID')).toBe(true);
  });

  test('Bloquea transiciones ilegales e inválidas', () => {
    expect(TripStateService.isValidTransition('TRIP_COMPLETED', 'SEARCHING')).toBe(false);
    expect(TripStateService.isValidTransition('PAID', 'REQUESTED')).toBe(false);
    expect(TripStateService.isValidTransition('CANCELLED', 'TRIP_STARTED')).toBe(false);
  });

  test('assertTransition lanza excepción en transición prohibida', () => {
    expect(() => {
      TripStateService.assertTransition('TRIP_COMPLETED', 'SEARCHING');
    }).toThrow();
  });
});
