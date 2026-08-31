import { test, expect } from '@playwright/test';

test.describe('Ecosistema Smart Mobility Ica - Tests E2E', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ request }) => {
    await request.post('http://localhost:4000/api/drivers/drv_mario_1/status', { data: { status: 'online' } });
    await request.post('http://localhost:4000/api/drivers/drv_jorge_2/status', { data: { status: 'online' } });
  });

  test('Flujo E2E: Ciclo Completo de Negociación, Carrera y Pago Yape', async ({ browser }) => {
    const driverContext = await browser.newContext({ viewport: { width: 440, height: 900 } });
    const driverPage = await driverContext.newPage();

    const passengerContext = await browser.newContext({ viewport: { width: 440, height: 900 } });
    const passengerPage = await passengerContext.newPage();

    await driverPage.goto('http://localhost:4000/conductor');
    await passengerPage.goto('http://localhost:4000/pasajero');

    // Pasajero elige Modo Negociar
    await passengerPage.click('#tabModeBid');
    await passengerPage.click('#payYape');
    await passengerPage.evaluate(() => (window as any).handleRequestRide());

    // Conductor recibe oferta y contraoferta
    await expect(driverPage.locator('#rideOfferModal')).toBeVisible({ timeout: 6000 });
    await driverPage.click('#counter2');

    // Pasajero ve y acepta la contraoferta
    await expect(passengerPage.locator('text=Aceptar Oferta').first()).toBeVisible({ timeout: 6000 });
    await passengerPage.locator('text=Aceptar Oferta').first().click();

    // Sincronizados en carrera activa
    await expect(passengerPage.locator('#panelMatched')).toBeVisible({ timeout: 6000 });
    await expect(driverPage.locator('#driverActiveTrip')).toBeVisible({ timeout: 6000 });

    // Completar viaje (Llegada -> Inicio -> Fin)
    await driverPage.click('#btnTripAction');
    await driverPage.waitForTimeout(600);

    await driverPage.click('#btnTripAction');
    await driverPage.waitForTimeout(600);

    await driverPage.click('#btnTripAction');
    await driverPage.waitForTimeout(600);

    // Pantalla de pago Yape
    await expect(passengerPage.locator('#panelCompleted')).toBeVisible({ timeout: 6000 });
    await passengerPage.click('text=Finalizar y Calificar');
  });

  test('Flujo E2E: Selección Directa de Conductor TOP 3 con MatchScore', async ({ browser }) => {
    const passengerContext = await browser.newContext({ viewport: { width: 440, height: 900 } });
    const passengerPage = await passengerContext.newPage();

    await passengerPage.goto('http://localhost:4000/pasajero');
    await passengerPage.click('#tabModeSelect');
    await passengerPage.evaluate(() => (window as any).handleRequestRide());

    // Debe mostrar la lista de candidatos rankeados
    await expect(passengerPage.locator('#panelSearching')).toBeVisible({ timeout: 6000 });
    await expect(passengerPage.locator('.driver-card-select').first()).toBeVisible({ timeout: 6000 });

    // Pasajero elige al conductor #1
    await passengerPage.locator('.driver-card-select button').first().click();
    await expect(passengerPage.locator('#panelMatched')).toBeVisible({ timeout: 6000 });
  });
});
