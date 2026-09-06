import { test, expect } from '@playwright/test';

const API_BASE = 'https://api.redes.inversionesvawi.com';

test.describe('Live Backend API Probing - api.redes.inversionesvawi.com', () => {

  test('1. Health Check Endpoint', async ({ request }) => {
    try {
      const res = await request.get(`${API_BASE}/health`);
      console.log(`[API HEALTH STATUS]: ${res.status()}`);
      console.log(`[API HEALTH BODY]:`, await res.text());
    } catch (e: any) {
      console.log(`[API HEALTH ERROR]:`, e.message);
    }
  });

  test('2. Auth Routes Probe', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: 'wrong@test.com', password: '123' }
    });
    console.log(`[API LOGIN STATUS]: ${res.status()}`);
    console.log(`[API LOGIN BODY]:`, await res.text());
  });

  test('3. WhatsApp Webhook Probe (SKILL-10)', async ({ request }) => {
    try {
      const res = await request.get(`${API_BASE}/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test&hub.challenge=1158201444`);
      console.log(`[API WEBHOOK WHATSAPP STATUS]: ${res.status()}`);
      console.log(`[API WEBHOOK WHATSAPP BODY]:`, await res.text());
    } catch (e: any) {
      console.log(`[API WEBHOOK ERROR]:`, e.message);
    }
  });

  test('4. AI & Automation Endpoints Probe (SKILL-14 / SKILL-20)', async ({ request }) => {
    try {
      const res = await request.post(`${API_BASE}/api/ai/suggest`, {
        data: { topic: 'Café de especialidad' }
      });
      console.log(`[API AI SUGGEST STATUS]: ${res.status()}`);
      console.log(`[API AI SUGGEST BODY]:`, await res.text());
    } catch (e: any) {
      console.log(`[API AI ERROR]:`, e.message);
    }
  });

  test('5. Billing Endpoints Probe (SKILL-23)', async ({ request }) => {
    try {
      const res = await request.post(`${API_BASE}/api/billing/create-checkout-session`, {
        data: { priceId: 'price_test_123' }
      });
      console.log(`[API BILLING STATUS]: ${res.status()}`);
      console.log(`[API BILLING BODY]:`, await res.text());
    } catch (e: any) {
      console.log(`[API BILLING PLANS ERROR]:`, e.message);
    }
  });

  test('6. CRM & Catalog Probe (SKILL-07 / SKILL-08)', async ({ request }) => {
    try {
      const resCRM = await request.get(`${API_BASE}/api/crm/leads`);
      console.log(`[API CRM STATUS]: ${resCRM.status()}`);
    } catch (e: any) {
      console.log(`[API CRM ERROR]:`, e.message);
    }

    try {
      const resCat = await request.get(`${API_BASE}/api/catalog`);
      console.log(`[API CATALOG STATUS]: ${resCat.status()}`);
    } catch (e: any) {
      console.log(`[API CATALOG ERROR]:`, e.message);
    }
  });

});
