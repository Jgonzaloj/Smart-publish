import { test, expect } from '@playwright/test';
import { MatchingService } from '../../src/services/dispatch/matching.service.js';
import { Driver } from '../../src/types/index.js';

test.describe('Unit Tests: Smart Dispatch Matching Engine', () => {
  const matchingService = new MatchingService();

  const driverA: Driver = {
    id: 'drv_001',
    phone: '956111222',
    full_name: 'Carlos Ruiz',
    role: 'driver',
    rating_avg: 4.95,
    total_rides: 120,
    status: 'online',
    current_location: { latitude: -14.0680, longitude: -75.7290, address: 'Centro' },
    wallet_balance: 80,
    commission_rate: 0.10,
    created_at: new Date().toISOString(),
  };

  const driverB: Driver = {
    id: 'drv_002',
    phone: '956333444',
    full_name: 'Pedro Ramos',
    role: 'driver',
    rating_avg: 4.5,
    total_rides: 40,
    status: 'online',
    current_location: { latitude: -14.0950, longitude: -75.7550, address: 'Lejos' },
    wallet_balance: 30,
    commission_rate: 0.10,
    created_at: new Date().toISOString(),
  };

  test('Conductor cercano y con alta calificación obtiene mayor MatchScore', () => {
    const candidateA = matchingService.calculateMatchScore(driverA, 0.8, 3, 0.98, 5.0);
    const candidateB = matchingService.calculateMatchScore(driverB, 4.5, 11, 0.80, 2.0);

    expect(candidateA.match_score).toBeGreaterThan(candidateB.match_score);
    expect(candidateA.match_score).toBeGreaterThanOrEqual(85);
    expect(candidateA.score_breakdown.eta_score).toBeGreaterThan(candidateB.score_breakdown.eta_score);
  });
});
