import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {

  test('debe mostrar error de credenciales inválidas', async ({ page }) => {
    // Ir a la página de login
    await page.goto('/login');

    // Validar que estamos en la página correcta (por título o algún elemento)
    await expect(page.locator('h2')).toContainText('Bienvenido de nuevo');

    // Llenar el formulario con credenciales incorrectas
    await page.fill('input[type="email"]', 'usuario_inexistente@example.com');
    await page.fill('input[type="password"]', 'contraseñaIncorrecta123');

    // Hacer clic en el botón de ingresar
    await page.click('button[type="submit"]');

    // Esperar a que aparezca el mensaje de error del backend/UI
    const errorMessage = page.locator('div.text-red-600').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('navegar a la pantalla de registro', async ({ page }) => {
    // Ir a la página de login
    await page.goto('/login');

    // Hacer clic en el enlace "Crear cuenta" o similar
    await page.click('text=Regístrate gratis');

    // Validar que se ha navegado al registro
    await expect(page).toHaveURL(/.*\/register/);
    await expect(page.locator('h2')).toContainText('Crea tu cuenta');
  });

});
