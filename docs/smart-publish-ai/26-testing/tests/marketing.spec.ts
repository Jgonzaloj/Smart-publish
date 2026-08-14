import { test, expect } from '@playwright/test';
import { runMarketingCampaign } from '../../14-marketing/marketing.orchestrator';

test.describe('SKILL 14-18: Marketing AI Flow', () => {
  test('debe orquestar una campaña de marketing completa exitosamente', async () => {
    // Probamos directamente la función del orquestador en Node
    // Simula que el usuario escribió: "Quiero vender más servicios en Navidad"
    const goal = 'Quiero vender más servicios de redes sociales en Navidad';
    const tenantId = 'tenant_1';
    
    const result = await runMarketingCampaign(goal, tenantId);
    
    // El flujo mockeado siempre aprueba y pasa por copy -> art -> qa -> publish
    expect(result).toBe(true);
  });
});
