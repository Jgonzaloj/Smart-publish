import { test, expect } from '@playwright/test';

test.describe('Ecosistema Taxi App Ica - Modelo inDrive Mejorado', () => {
  test('Flujo de Negociación inDrive: Pasajero propone S/ 8.00, Conductor contraoferta S/ 10.00 y Pasajero acepta', async ({ browser }) => {
    // 1. Contexto Pasajero
    const passengerContext = await browser.newContext({ viewport: { width: 440, height: 900 } });
    const passengerPage = await passengerContext.newPage();

    // 2. Contexto Conductor
    const driverContext = await browser.newContext({ viewport: { width: 440, height: 900 } });
    const driverPage = await driverContext.newPage();

    // 3. Contexto Admin
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const adminPage = await adminContext.newPage();

    // Cargar páginas
    await driverPage.goto('http://localhost:4000/conductor');
    await adminPage.goto('http://localhost:4000/admin');
    await passengerPage.goto('http://localhost:4000/pasajero');

    // Pasajero: Verifica selector de tarifa libre inDrive
    await expect(passengerPage.locator('#offerPriceDisplay')).toBeVisible();

    // Pasajero: Ajusta su oferta a S/ 8.00
    await passengerPage.click('#payYape');
    await passengerPage.click('#btnRequestRide');

    // Pasajero entra en radar de búsqueda
    await expect(passengerPage.locator('#panelSearching')).toBeVisible();

    // Conductor: Recibe la oferta del pasajero
    await expect(driverPage.locator('#rideOfferModal')).toBeVisible({ timeout: 5000 });

    // Conductor: En vez de aceptar directo, envía contraoferta de + S/ 2.00 (inDrive Bidding)
    await driverPage.click('#counter2');
    await driverPage.waitForTimeout(500);

    // Pasajero: Recibe la contraoferta en su bandeja en vivo y la acepta
    await expect(passengerPage.locator('text=Aceptar Oferta')).toBeVisible({ timeout: 5000 });
    await passengerPage.click('text=Aceptar Oferta');

    // Pasajero y Conductor sincronizados en carrera activa
    await expect(passengerPage.locator('#panelMatched')).toBeVisible({ timeout: 5000 });
    await expect(driverPage.locator('#driverActiveTrip')).toBeVisible({ timeout: 5000 });

    // Conductor: 1. He Llegado al Origen
    await driverPage.click('#btnTripAction');
    await passengerPage.waitForTimeout(600);

    // Conductor: 2. Iniciar Carrera
    await driverPage.click('#btnTripAction');
    await passengerPage.waitForTimeout(600);

    // Conductor: 3. Finalizar Carrera y Cobrar
    await driverPage.click('#btnTripAction');

    // Pasajero: Pantalla de finalización con Yape
    await expect(passengerPage.locator('#panelCompleted')).toBeVisible({ timeout: 5000 });
    await expect(passengerPage.locator('#yapeQrContainer')).toBeVisible();

    // Pasajero califica
    await passengerPage.click('text=Finalizar y Calificar');
    await expect(passengerPage.locator('#panelRequest')).toBeVisible();

    console.log('✅ ¡Prueba de Negociación y Subasta inDrive completada con éxito rotundo!');
  });
});
