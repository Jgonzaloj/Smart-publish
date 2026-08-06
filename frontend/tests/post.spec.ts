import { test, expect } from '@playwright/test';

test.describe('Composer Flow (Creación de Posts)', () => {

  // Hook que se ejecuta antes de cada prueba para asegurar que el usuario esté logueado
  // Nota: En un entorno real, crearíamos un usuario de prueba en la BD o usaríamos un Mock.
  test.beforeEach(async ({ page }) => {
    // 1. Ir al registro para crear un usuario de prueba dinámico
    await page.goto('/register');
    
    const randomUser = `test_${Date.now()}@example.com`;
    await page.fill('input[placeholder="Juan Pérez"]', 'Usuario Test');
    await page.fill('input[type="email"]', randomUser);
    await page.fill('input[type="password"]', 'contraseña123');
    
    // Registrar
    await page.click('button[type="submit"]');

    // Esperar a que redirija a /login (tarda 2s por el mensaje de éxito)
    await page.waitForURL(/.*\/login/);

    // 2. Llenar credenciales en el login con el usuario que acabamos de crear
    await page.fill('input[type="email"]', randomUser);
    await page.fill('input[type="password"]', 'contraseña123');
    await page.click('button[type="submit"]');

    // 3. Esperar a que redirija al Dashboard principal
    await page.waitForURL('**/');
  });

  test('debe permitir escribir un post y mostrar el botón de publicar', async ({ page }) => {
    // 1. Navegar al Composer
    await page.goto('/compose');
    await expect(page.locator('h2').filter({ hasText: 'Creador de Posts' })).toBeVisible();

    // 2. Escribir contenido manualmente en el textarea
    const postContent = 'Este es un post de prueba generado automáticamente por Playwright 🤖🚀';
    await page.fill('textarea', postContent);

    // 3. Validar que el texto se refleje en la vista previa (Mockup de la derecha)
    // El mockup de Facebook tiene la clase .whitespace-pre-wrap
    const previewText = page.locator('.whitespace-pre-wrap').first();
    await expect(previewText).toContainText(postContent);

    // 4. Intentar publicar
    // Escuchamos el evento de `alert` del navegador ya que el botón dispara un alert() nativo en Composer.tsx
    page.on('dialog', async dialog => {
      // El mensaje puede ser de éxito o de error dependiendo si hay cuentas vinculadas,
      // pero verificamos que el sistema intente interactuar.
      expect(dialog.message()).toBeTruthy();
      await dialog.accept();
    });

    await page.click('button:has-text("Publicar Ahora")');
  });

  test('debe requerir imagen al seleccionar Instagram', async ({ page }) => {
    await page.goto('/compose');

    // Seleccionar Instagram
    await page.click('button:has-text("Instagram")');

    // Validar que el diseño cambió y pide imagen obligatoria en la vista previa
    await expect(page.locator('text=Requiere imagen obligatoria')).toBeVisible();

    // Escribir contenido
    await page.fill('textarea', 'Post para Instagram sin imagen');

    // Escuchar la alerta de validación
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    // Intentar publicar
    await page.click('button:has-text("Publicar Ahora")');

    // Validar que el frontend bloqueó la publicación por falta de imagen
    expect(alertMessage).toContain('Instagram requiere obligatoriamente una imagen');
  });

});
