import { test, expect } from '@playwright/test';

test.describe('SKILL-05: Auth & Security API', () => {
  const API_URL = 'http://localhost:3000/api/auth';

  test('debe retornar 401 con credenciales inválidas', async ({ request }) => {
    const response = await request.post(`${API_URL}/login`, {
      data: {
        email: 'wrong@smartpublish.ai',
        password: 'wrong'
      }
    });
    
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Credenciales inválidas');
  });

  test('debe retornar token con credenciales válidas', async ({ request }) => {
    const response = await request.post(`${API_URL}/login`, {
      data: {
        email: 'admin@smartpublish.ai',
        password: 'admin123'
      }
    });
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.token).toBeDefined();
    expect(body.message).toBe('Autenticación exitosa');
  });
});
