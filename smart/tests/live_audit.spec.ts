import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const LIVE_URL = 'https://redes.inversionesvawi.com';
const SCREENSHOT_DIR = path.join(process.cwd(), 'playwright_live_artifacts');

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test.describe('Live Production Audit - redes.inversionesvawi.com', () => {

  test('1. Security, Headers & Initial Redirect Audit', async ({ page }) => {
    const consoleLogs: string[] = [];
    const failedRequests: { url: string; status?: number; error?: string }[] = [];

    page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('requestfailed', req => failedRequests.push({ url: req.url(), error: req.failure()?.errorText }));
    page.on('response', res => {
      if (res.status() >= 400) {
        failedRequests.push({ url: res.url(), status: res.status() });
      }
    });

    const response = await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    expect(response).not.toBeNull();
    console.log(`[HTTP STATUS]: ${response?.status()}`);
    console.log(`[FINAL URL]: ${page.url()}`);
    console.log(`[HEADERS]:`, response?.headers());

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_initial_landing.png'), fullPage: true });

    console.log(`[CONSOLE LOGS COUNT]: ${consoleLogs.length}`);
    consoleLogs.forEach(l => console.log('LOG:', l));
    console.log(`[FAILED REQUESTS]:`, JSON.stringify(failedRequests, null, 2));
  });

  test('2. Login Page UI & Form Interaction Audit', async ({ page }) => {
    const apiCalls: { url: string; method: string; postData?: string; status?: number; responseBody?: string }[] = [];

    page.on('request', req => {
      if (req.url().includes('/api/')) {
        apiCalls.push({ url: req.url(), method: req.method(), postData: req.postData() || undefined });
      }
    });

    page.on('response', async res => {
      if (res.url().includes('/api/')) {
        const matching = apiCalls.find(c => c.url === res.url());
        if (matching) {
          matching.status = res.status();
          try {
            matching.responseBody = await res.text();
          } catch (e) {}
        }
      }
    });

    await page.goto(`${LIVE_URL}/login`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_login_page.png'), fullPage: true });

    // Validate key UI elements
    const heading = page.locator('h1, h2').first();
    console.log('[LOGIN HEADING]:', await heading.textContent());

    // Test form filling with invalid credentials to test API connection
    await page.fill('input[type="email"]', 'audit_test@inversionesvawi.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_login_filled.png') });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_login_submitted.png') });
    console.log('[API CALLS ON LOGIN SUBMIT]:', JSON.stringify(apiCalls, null, 2));
  });

  test('3. Register Page & Auth Flow Audit', async ({ page }) => {
    await page.goto(`${LIVE_URL}/register`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_register_page.png'), fullPage: true });

    const inputs = await page.locator('input').count();
    console.log(`[REGISTER INPUTS COUNT]: ${inputs}`);
  });

  test('4. Password Recovery Flow Audit', async ({ page }) => {
    await page.goto(`${LIVE_URL}/forgot-password`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_forgot_password.png'), fullPage: true });
  });

  test('5. Protected Routes & Navigation Guard Audit', async ({ page }) => {
    const routesToTest = [
      '/',
      '/calendar',
      '/compose',
      '/campaigns',
      '/settings',
      '/billing',
      '/superadmin',
      '/crm',
      '/whatsapp',
      '/catalog'
    ];

    for (const route of routesToTest) {
      await page.goto(`${LIVE_URL}${route}`, { waitUntil: 'networkidle' });
      const currentUrl = page.url();
      console.log(`[ROUTE CHECK]: Tried ${route} -> Ended at ${currentUrl}`);
    }
  });

  test('6. Mobile Responsiveness & Viewport Audit', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${LIVE_URL}/login`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_mobile_login.png'), fullPage: true });
  });

});
