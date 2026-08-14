import { test, expect } from '@playwright/test';

test.describe('SKILL-24: Multitenant Isolation Middleware', () => {
  const API_URL = 'http://localhost:3000/api/crm/leads';

  test('debe denegar el acceso si no se provee el X-Tenant-ID', async ({ request }) => {
    const response = await request.get(API_URL); // Petición sin header
    expect(response.status()).toBe(403);
    
    const body = await response.json();
    expect(body.error).toBe('Acceso Denegado: Faltan credenciales de empresa (Tenant ID no proporcionado).');
  });

  test('debe permitir el acceso si se provee el X-Tenant-ID', async ({ request }) => {
    const response = await request.get(API_URL, {
        headers: { 'X-Tenant-ID': 'tenant_123' }
    });
    // Debe dar 200 OK
    expect(response.status()).toBe(200);
  });
});
