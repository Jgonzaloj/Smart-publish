import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = path.join(process.cwd(), 'playwright_audit_artifacts');

test.beforeAll(() => {
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  }
});

// Setup mock session and intercept all API calls to ensure zero external backend dependencies
test.beforeEach(async ({ page }) => {
  // Mock API endpoints
  await page.route('**/api/**', async route => {
    const url = route.request().url();
    
    if (url.includes('/crm/leads')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          leads: [
            { id: 'lead-1', customer_name: 'Carlos Mendoza', customer_phone: '+51 987 654 321', customer_email: 'carlos@empresa.com', status: 'NEW', score: 85, estimated_value: 350, customer_source: 'WHATSAPP', notes: 'Interesado en Plan Business', created_at: new Date().toISOString() },
            { id: 'lead-2', customer_name: 'Mariana López', customer_phone: '+51 912 345 678', customer_email: 'mariana@boutique.pe', status: 'QUALIFIED', score: 92, estimated_value: 600, customer_source: 'INSTAGRAM', notes: 'Solicitó cotización de campaña Meta Ads', created_at: new Date().toISOString() },
            { id: 'lead-4', customer_name: 'Dr. Roberto Silva', customer_phone: '+51 944 332 110', customer_email: 'clinica@silva.com', status: 'WON', score: 99, estimated_value: 450, customer_source: 'WHATSAPP', notes: 'Servicio activado', created_at: new Date().toISOString() }
          ]
        })
      });
    }

    if (url.includes('/conversations')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          conversations: [
            {
              id: 'conv-1',
              customer_name: 'Carlos Mendoza',
              customer_phone: '+51 987 654 321',
              channel: 'WHATSAPP',
              status: 'AI_HANDLED',
              last_message: '¿Cuánto cuesta el plan para 3 marcas?',
              last_message_at: new Date().toISOString(),
              unread_count: 0,
              messages: [
                { id: 'm1', sender: 'CUSTOMER', text: 'Hola, quisiera información de sus servicios.', time: '14:25' },
                { id: 'm2', sender: 'BOT', text: '¡Hola Carlos! Ofrecemos gestión de redes y campañas con IA.', time: '14:26' },
                { id: 'm3', sender: 'CUSTOMER', text: '¿Cuánto cuesta el plan para 3 marcas?', time: '14:30' }
              ]
            }
          ]
        })
      });
    }

    if (url.includes('/catalog')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          services: [
            { id: 'srv-1', name: 'Gestión Redes Sociales Pro', category_name: 'Marketing Digital', amount: 250.00, currency: 'USD', duration: 'Mensual', conditions: 'Incluye 12 posts y 4 reels', is_active: true },
            { id: 'srv-2', name: 'Campaña Meta & TikTok Ads', category_name: 'Publicidad Digital', amount: 450.00, currency: 'USD', duration: 'Mensual', conditions: 'Presupuesto de pauta no incluido', is_active: true }
          ]
        })
      });
    }

    if (url.includes('/quotes')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          quotes: [
            {
              id: 'qt-101',
              quote_number: 'QT-2026-001',
              customer_name: 'Tech Solutions SAC',
              total_amount: 1200.00,
              currency: 'USD',
              status: 'SENT',
              valid_until: '2026-09-01T00:00:00.000Z',
              items: [
                { service_name: 'Desarrollo Web Landing Page', quantity: 1, unit_price: 350.00, total: 350.00 }
              ],
              created_at: new Date().toISOString()
            }
          ]
        })
      });
    }

    if (url.includes('/observability/metrics')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          summary: {
            total_ai_requests: 1420,
            total_tokens_used: 284500,
            estimated_ai_cost_usd: 0.85,
            average_latency_ms: 680,
            qa_acceptance_rate: 94.6,
            human_handoff_rate: 5.4
          },
          recent_runs: [
            {
              id: 'run-901',
              task_type: 'SALES_TRIAGE_WHATSAPP',
              model: 'gemini-1.5-flash',
              tokens: 185,
              latency_ms: 540,
              status: 'SUCCESS',
              decision: 'Clasificado como SALES_INQUIRY. Consultó SKILL-08 (Catálogo) y envió precio oficial.',
              timestamp: new Date().toISOString()
            }
          ]
        })
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        accounts: [
          { id: 'acc-1', platform: 'INSTAGRAM', account_name: 'Inversiones Vawi Oficial', status: 'ACTIVE' },
          { id: 'acc-2', platform: 'FACEBOOK', account_name: 'Smart Publish Media', status: 'ACTIVE' }
        ],
        posts: []
      })
    });
  });

  // Inject session directly before page script runs
  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'mock_valid_token_e2e');
    localStorage.setItem('auth_user', JSON.stringify({
      id: 'usr-1',
      email: 'admin@smartpublish.ai',
      role: 'SUPERADMIN',
      workspace_id: 'ws-123'
    }));
  });
});

test.describe('Smart Publish AI - Full Suite End-to-End Audit', () => {

  test('1. Dashboard Page & KPI Metrics', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Panel de Control Central');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '01_dashboard.png'), fullPage: true });
  });

  test('2. CRM Pipeline & Kanban Board (SKILL-07)', async ({ page }) => {
    await page.goto('/crm', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Pipeline de Ventas & Leads');
    await expect(page.locator('h3:has-text("Nuevo Prospecto")')).toBeVisible();
    await expect(page.locator('h3:has-text("Cerrado Ganado")')).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '02_crm_kanban.png'), fullPage: true });
  });

  test('3. WhatsApp & Omnichannel Inbox (SKILL-09 / 10)', async ({ page }) => {
    await page.goto('/inbox', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('WhatsApp & Omnichannel Inbox');
    await expect(page.locator('h4:has-text("Carlos Mendoza")').first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '03_whatsapp_inbox.png'), fullPage: true });
  });

  test('4. Official Catalog & Anti-Hallucination Pricing (SKILL-08)', async ({ page }) => {
    await page.goto('/catalog', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Catálogo & Tarifario Oficial');
    await expect(page.locator('text=Garantía Anti-Alucinación Activa')).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '04_catalog_pricing.png'), fullPage: true });
  });

  test('5. Formal Quotation Engine (SKILL-12)', async ({ page }) => {
    await page.goto('/quotes', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Cotizaciones Formales');
    await expect(page.locator('text=QT-2026-001')).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '05_quotes_engine.png'), fullPage: true });
  });

  test('6. Knowledge Base & RAG Semantic Search (SKILL-19)', async ({ page }) => {
    await page.goto('/knowledge', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Base de Conocimiento Empresarial');
    await expect(page.locator('text=Archivos Indexados')).toBeVisible();
    
    // Test semantic search simulator
    await page.fill('input[placeholder*="cancelar"]', '¿Cómo funcionan las garantías?');
    await page.click('button:has-text("Probar Búsqueda Vectorial")');
    await page.waitForTimeout(800);
    await expect(page.locator('text=Fragmento Relevante').first()).toBeVisible();

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '06_knowledge_rag.png'), fullPage: true });
  });

  test('7. AI Observability & Decision Reasoning (SKILL-25)', async ({ page }) => {
    await page.goto('/observability', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Observabilidad de Inteligencia Artificial');
    await expect(page.locator('text=Peticiones Totales IA')).toBeVisible();
    await expect(page.locator('text=¿Por qué la IA tomó esta decisión?').first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '07_ai_observability.png'), fullPage: true });
  });

  test('8. Dark Mode Toggle & Visual Integrity', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.click('button[title*="Cambiar a modo"]');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '08_dark_mode_dashboard.png'), fullPage: true });
  });

  test('9. 404 Error Page & Fallback Route', async ({ page }) => {
    await page.goto('/random-unknown-url-404', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('404');
    await expect(page.locator('h2')).toContainText('Página No Encontrada');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '09_404_not_found.png'), fullPage: true });
  });

  test('10. Mobile Responsive Layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/crm', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Pipeline de Ventas');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '10_mobile_crm.png'), fullPage: true });
  });

});
