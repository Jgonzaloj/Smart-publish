import { test, expect } from '@playwright/test';
import { PricingEngine } from '../../src/services/tariff/pricing-engine.js';

test.describe('Unit Tests: Smart Fare Pricing Engine', () => {
  const pricingEngine = new PricingEngine();

  test('Calcula correctamente tarifa urbana estándar (Plaza de Armas -> C.C. El Quinde)', () => {
    const origin = { latitude: -14.06777, longitude: -75.72861, address: 'Plaza de Armas' };
    const destination = { latitude: -14.07542, longitude: -75.73418, address: 'C.C. El Quinde' };

    const result = pricingEngine.calculatePrice(origin, destination);

    expect(result.recommendedFare).toBeGreaterThanOrEqual(6.00);
    expect(result.minimumOffer).toBeGreaterThanOrEqual(6.00);
    expect(result.maximumRecommendedOffer).toBeGreaterThan(result.recommendedFare);
    expect(result.confidence).toBeGreaterThan(0.85);
    expect(result.distanceKm).toBeGreaterThan(0);
  });

  test('Aplica recargo automático a zona turística Huacachina', () => {
    const origin = { latitude: -14.06777, longitude: -75.72861, address: 'Plaza de Armas' };
    const destHuacachina = { latitude: -14.08745, longitude: -75.76332, address: 'Huacachina' };

    const result = pricingEngine.calculatePrice(origin, destHuacachina);

    expect(result.breakdown).toContain('Huacachina (+20%)');
    expect(result.recommendedFare).toBeGreaterThan(12.00);
  });
});
