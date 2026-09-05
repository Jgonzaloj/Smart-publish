import { test } from '@playwright/test';

test('debug navigation', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'mock_valid_jwt');
    localStorage.setItem('auth_user', JSON.stringify({
      id: 'usr-1',
      email: 'admin@smartpublish.ai',
      role: 'SUPERADMIN',
      workspace_id: 'ws-123'
    }));
  });

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  console.log('LOGIN URL:', page.url());

  // Try filling login form directly
  await page.fill('input[type="email"]', 'admin@smartpublish.ai');
  await page.fill('input[type="password"]', 'admin123');

  // Intercept the login POST request
  await page.route('**/api/auth/login', async route => {
    console.log('Intercepted login request!');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        token: 'mock_jwt_token',
        user: { id: '1', email: 'admin@smartpublish.ai', role: 'SUPERADMIN' },
        workspace_id: 'ws_test'
      })
    });
  });

  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  console.log('POST SUBMIT URL:', page.url());

  await page.goto('http://localhost:5173/crm', { waitUntil: 'networkidle' });
  console.log('CRM URL:', page.url());
  const h1 = await page.locator('h1').textContent().catch(() => 'NOT FOUND');
  console.log('CRM H1:', h1);
});
