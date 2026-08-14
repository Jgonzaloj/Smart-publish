import { test, expect } from '@playwright/test';

test.describe('SKILL-09 & 10: AI Conversation & Webhooks', () => {
  const API_URL = 'http://localhost:3000/api/whatsapp/webhook';

  test('debe retornar 403 en validación de webhook con token inválido', async ({ request }) => {
    const response = await request.get(`${API_URL}?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=1234`);
    expect(response.status()).toBe(403);
  });

  test('debe procesar un webhook entrante de WhatsApp correctamente', async ({ request }) => {
    // Simulamos la estructura exacta que manda Facebook
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          value: {
            metadata: { phone_number_id: '123456789' },
            messages: [{
              from: '51999999999',
              text: { body: 'Hola, quiero el precio de una página web' }
            }]
          }
        }]
      }]
    };

    const response = await request.post(API_URL, { data: payload });
    // El servidor debe retornar 200 inmediatamente a WhatsApp
    expect(response.status()).toBe(200);
  });
});
