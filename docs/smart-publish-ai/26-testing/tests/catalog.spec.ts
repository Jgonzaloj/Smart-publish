import { test, expect } from '@playwright/test';

test.describe('SKILL-08: Catalog API', () => {
  const API_URL = 'http://localhost:3000/api/catalog';

  test('debe listar los servicios disponibles', async ({ request }) => {
    const response = await request.get(`${API_URL}`, { headers: { 'X-Tenant-ID': 'tenant_test' } });
    expect(response.status()).toBe(200);
    
    const services = await response.json();
    expect(Array.isArray(services)).toBeTruthy();
    expect(services.length).toBeGreaterThan(0);
    expect(services[0].id).toBeDefined();
    expect(services[0].price).toBeDefined();
  });

  test('debe retornar 404 para un servicio inexistente', async ({ request }) => {
    const response = await request.get(`${API_URL}/serv_invitado/price`, { headers: { 'X-Tenant-ID': 'tenant_test' } });
    expect(response.status()).toBe(404);
  });

  test('debe retornar el precio y moneda de un servicio', async ({ request }) => {
    // Tomando el ID 'serv_123' del mock de memoria
    const response = await request.get(`${API_URL}/serv_123/price`, { headers: { 'X-Tenant-ID': 'tenant_test' } });
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.price).toBe(250);
    expect(data.currency).toBe('USD');
  });
});
