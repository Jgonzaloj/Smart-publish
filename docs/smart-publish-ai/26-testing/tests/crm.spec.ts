import { test, expect } from '@playwright/test';

test.describe('SKILL-07: CRM & Leads API', () => {
  const API_URL = 'http://localhost:3000/api/crm';

  test('debe retornar 400 si faltan datos al crear un Lead', async ({ request }) => {
    const response = await request.post(`${API_URL}/leads`, {
      headers: { 'X-Tenant-ID': 'tenant_test' },
      data: {
        name: 'Lead sin contacto'
      }
    });
    
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Faltan datos obligatorios (name y al menos phone o email)');
  });

  test('debe crear un Lead correctamente con estado NEW', async ({ request }) => {
    const response = await request.post(`${API_URL}/leads`, {
      headers: { 'X-Tenant-ID': 'tenant_test' },
      data: {
        name: 'Cliente Potencial',
        phone: '+123456789'
      }
    });
    
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe('Cliente Potencial');
    expect(body.status).toBe('NEW');
    expect(body.score).toBe(0);
  });

  test('debe listar los Leads creados', async ({ request }) => {
    const response = await request.get(`${API_URL}/leads`, { headers: { 'X-Tenant-ID': 'tenant_test' } });
    expect(response.status()).toBe(200);
    
    const leads = await response.json();
    expect(Array.isArray(leads)).toBeTruthy();
    expect(leads.length).toBeGreaterThan(0);
    expect(leads[0].status).toBe('NEW');
  });
});
