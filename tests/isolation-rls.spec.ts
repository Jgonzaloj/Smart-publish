import { test, expect } from '@playwright/test';
import { PrismaService } from '../src/prisma/prisma.service';

test.describe('Senior Audit & Test Suite: Aislamiento RLS Multi-Tenant y Seguridad Defensiva', () => {
  let prismaService: PrismaService;

  test.beforeEach(() => {
    prismaService = new PrismaService();
  });

  test('Validación defensiva: Rechaza inyección SQL en tenantId antes de ejecutar SET LOCAL', async () => {
    const payloadsMaliciosos = [
      "1' OR '1'='1",
      "'; DROP TABLE creditos; --",
      "invalid-uuid-string",
      "12345",
      "../../etc/passwd",
      "",
    ];

    for (const payload of payloadsMaliciosos) {
      await expect(
        prismaService.withTenant(payload, async () => {}),
      ).rejects.toThrow('tenantId inválido');
    }
  });

  test('Acepta UUID v4 válido y ejecuta la transacción con SET LOCAL app.tenant_id', async () => {
    const validTenantId = 'e025b394-4d1a-4d43-85f8-9a3b6e82845c';
    let executedSql = '';

    // Mockeamos la transacción para auditar la sentencia SQL generada
    prismaService.$transaction = (async (cb: any) => {
      const mockTx = {
        $executeRawUnsafe: async (sql: string) => {
          executedSql = sql;
        },
      };
      return cb(mockTx);
    }) as any;

    const result = await prismaService.withTenant(validTenantId, async () => {
      return { success: true };
    });

    expect(result.success).toBe(true);
    expect(executedSql).toBe(`SET LOCAL app.tenant_id = '${validTenantId}'`);
  });
});
