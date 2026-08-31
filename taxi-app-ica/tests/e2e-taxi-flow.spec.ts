import { test, expect } from '@playwright/test';

test.describe('Ecosistema Taxi App Ica - Smart Dispatch & Negociación', () => {
  test('Flujo 1: Asignación Rápida Auto-Match (Smart Match Score #1)', async ({ browser }) => {
    const passengerContext = await browser.newContext({ viewport: { width: 440, height: 900 } });
    const passengerPage = await passengerContext.newPage();

    await passengerPage.goto('http://localhost:4000/pasajero');
    await passengerPage.click('#tabModeAuto');
    await passengerPage.click('#btnRequestRide');

    // Debe auto-asignar al conductor #1 con alto Match Score
    await expect(passengerPage.locator('#panelMatched')).toBeVisible({ timeout: 6000 });
    await expect(passengerPage.locator('#driverName')).not.toBeEmpty();
    await expect(passengerPage.locator('#driverCar')).toBeVisible();
  });

  test('Flujo 2: Negociación inDrive (Pasajero propone y Conductor contraoferta)', async ({ browser }) => {
    const passengerContext = await browser.newContext({ viewport: { width: 440, height: 900 } });
    const passengerPage = await passengerContext.newPage();

    const driverContext = await browser.newContext({ viewport: { width: 440, height: 900 } });
    const driverPage = await driverContext.newPage();

    await driverPage.goto('http://localhost:4000/conductor');
    await passengerPage.goto('http://localhost:4000/pasajero');

    // Pasajero elige Modo Negociar
    await passengerPage.click('#tabModeBid');
    await passengerPage.click('#payYape');
    await passengerPage.click('#btnRequestRide');

    // Conductor recibe oferta y contraoferta
    await expect(driverPage.locator('#rideOfferModal')).toBeVisible({ timeout: 5000 });
    await driverPage.click('#counter2');

    // Pasajero ve y acepta la contraoferta
    await expect(passengerPage.locator('text=Aceptar Oferta').first()).toBeVisible({ timeout: 5000 });
    await passengerPage.locator('text=Aceptar Oferta').first().click();

    // Sincronizados en carrera activa
    await expect(passengerPage.locator('#panelMatched')).toBeVisible({ timeout: 5000 });
    await expect(driverPage.locator('#driverActiveTrip')).toBeVisible({ timeout: 5000 });

    // Completar viaje
    await driverPage.click('#btnTripAction');
    await driverPage.waitForTimeout(400);
    await driverPage.click('#btnTripAction');
    await driverPage.waitForTimeout(400);
    await driverPage.click('#btnTripAction');

    // Pantalla de pago Yape
    await expect(passengerPage.locator('#panelCompleted')).toBeVisible({ timeout: 5000 });
    await passengerPage.click('text=Finalizar y Calificar');
  });
});
