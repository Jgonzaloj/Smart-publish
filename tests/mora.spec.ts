import { test, expect } from '@playwright/test';
import { MoraService } from '../src/mora/mora.service';

test.describe('Senior Audit & Test Suite: Mora Automática y Cálculo de Cuotas Atrasadas', () => {
  let moraService: MoraService;
  let mockPrisma: any;

  test.beforeEach(() => {
    mockPrisma = {
      tenant: {
        findMany: async () => [],
      },
      withTenant: async (_tenantId: string, cb: any) => cb(mockPrisma),
    };
    moraService = new MoraService(mockPrisma as any);
  });

  test('Forma de pago DIARIO: Calcula exactamente las cuotas atrasadas según días transcurridos', () => {
    const fechaInicio = new Date('2026-03-01T00:00:00');
    const fechaVencimiento = new Date('2026-03-31T00:00:00');
    const fechaReferencia = new Date('2026-03-06T00:00:00'); // Han transcurrido 5 días

    const credito = {
      fechaInicio,
      fechaVencimiento,
      formaPago: 'diario',
      numeroCuotasTotal: 30,
      cuotasPagadas: 3, // Pagó 3, debió haber pagado 5
      saldoActual: 500000 as any,
      estado: 'ACTIVO' as const,
    };

    const resultado = moraService.calcularAtraso(credito, fechaReferencia);

    expect(resultado.cuotasEsperadas).toBe(5);
    expect(resultado.cuotasAtrasadas).toBe(2);
    expect(resultado.estaEnMora).toBe(true);
    expect(resultado.nuevoEstado).toBe('EN_MORA');
  });

  test('Forma de pago DIARIO: Si va al día o adelantado, nuevoEstado es ACTIVO', () => {
    const fechaInicio = new Date('2026-03-01T00:00:00');
    const fechaVencimiento = new Date('2026-03-31T00:00:00');
    const fechaReferencia = new Date('2026-03-04T00:00:00'); // 3 días transcurridos

    const credito = {
      fechaInicio,
      fechaVencimiento,
      formaPago: 'diario',
      numeroCuotasTotal: 30,
      cuotasPagadas: 4, // Pagó 4 (adelantado por 1 cuota)
      saldoActual: 450000 as any,
      estado: 'EN_MORA' as const,
    };

    const resultado = moraService.calcularAtraso(credito, fechaReferencia);

    expect(resultado.cuotasEsperadas).toBe(3);
    expect(resultado.cuotasAtrasadas).toBe(0);
    expect(resultado.estaEnMora).toBe(false);
    expect(resultado.nuevoEstado).toBe('ACTIVO');
  });

  test('Forma de pago SEMANAL: Calcula múltiplos de 7 días', () => {
    const fechaInicio = new Date('2026-03-01T00:00:00');
    const fechaVencimiento = new Date('2026-05-01T00:00:00');
    const fechaReferencia = new Date('2026-03-16T00:00:00'); // 15 días transcurridos -> 2 semanas completas

    const credito = {
      fechaInicio,
      fechaVencimiento,
      formaPago: 'semanal',
      numeroCuotasTotal: 8,
      cuotasPagadas: 1, // Debió pagar 2
      saldoActual: 700000 as any,
      estado: 'ACTIVO' as const,
    };

    const resultado = moraService.calcularAtraso(credito, fechaReferencia);

    expect(resultado.cuotasEsperadas).toBe(2);
    expect(resultado.cuotasAtrasadas).toBe(1);
    expect(resultado.estaEnMora).toBe(true);
    expect(resultado.nuevoEstado).toBe('EN_MORA');
  });

  test('Forma de pago QUINCENAL: Calcula múltiplos de 15 días', () => {
    const fechaInicio = new Date('2026-01-01T00:00:00');
    const fechaVencimiento = new Date('2026-03-01T00:00:00');
    const fechaReferencia = new Date('2026-01-31T00:00:00'); // 30 días -> 2 quincenas

    const credito = {
      fechaInicio,
      fechaVencimiento,
      formaPago: 'quincenal',
      numeroCuotasTotal: 4,
      cuotasPagadas: 2, // Pagó las 2 quincenas
      saldoActual: 200000 as any,
      estado: 'ACTIVO' as const,
    };

    const resultado = moraService.calcularAtraso(credito, fechaReferencia);

    expect(resultado.cuotasEsperadas).toBe(2);
    expect(resultado.cuotasAtrasadas).toBe(0);
    expect(resultado.estaEnMora).toBe(false);
    expect(resultado.nuevoEstado).toBe('ACTIVO');
  });

  test('Crédito con fecha de vencimiento superada y saldo pendiente: Entra en mora obligatoriamente', () => {
    const fechaInicio = new Date('2026-01-01T00:00:00');
    const fechaVencimiento = new Date('2026-01-31T00:00:00');
    const fechaReferencia = new Date('2026-02-15T00:00:00'); // Vencido hace 15 días

    const credito = {
      fechaInicio,
      fechaVencimiento,
      formaPago: 'diario',
      numeroCuotasTotal: 30,
      cuotasPagadas: 28, // Faltaron 2 cuotas
      saldoActual: 50000 as any,
      estado: 'ACTIVO' as const,
    };

    const resultado = moraService.calcularAtraso(credito, fechaReferencia);

    expect(resultado.cuotasEsperadas).toBe(30); // Tope de cuotas
    expect(resultado.cuotasAtrasadas).toBe(2);
    expect(resultado.estaEnMora).toBe(true);
    expect(resultado.nuevoEstado).toBe('EN_MORA');
  });

  test('Ejecución masiva de Mora para Tenant actualiza créditos y clientes con aislamiento RLS', async () => {
    const tenantId = '11111111-2222-3333-4444-555555555555';
    const mockCreditos = [
      {
        id: 'cred-1',
        tenantId,
        codigoCredito: 'CR-001',
        clienteId: 'cli-1',
        fechaInicio: new Date('2026-03-01T00:00:00'),
        fechaVencimiento: new Date('2026-03-31T00:00:00'),
        formaPago: 'diario',
        numeroCuotasTotal: 30,
        cuotasPagadas: 1,
        saldoActual: 100000,
        estado: 'ACTIVO',
        cliente: {
          id: 'cli-1',
          nombresAlias: 'Ana',
          apellidos: 'Gómez',
          estadoVisita: 'AL_DIA',
        },
      },
      {
        id: 'cred-2',
        tenantId,
        codigoCredito: 'CR-002',
        clienteId: 'cli-2',
        fechaInicio: new Date('2026-03-01T00:00:00'),
        fechaVencimiento: new Date('2026-03-31T00:00:00'),
        formaPago: 'diario',
        numeroCuotasTotal: 30,
        cuotasPagadas: 10,
        saldoActual: 80000,
        estado: 'ACTIVO',
        cliente: {
          id: 'cli-2',
          nombresAlias: 'Pedro',
          apellidos: 'Ramírez',
          estadoVisita: 'AL_DIA',
        },
      },
    ];

    const updatesCredito: any[] = [];
    const updatesCliente: any[] = [];

    const mockTx = {
      credito: {
        findMany: async () => mockCreditos,
        update: async (args: any) => {
          updatesCredito.push(args);
          return args;
        },
      },
      cliente: {
        update: async (args: any) => {
          updatesCliente.push(args);
          return args;
        },
      },
    };

    mockPrisma.withTenant = async (_tId: string, cb: any) => cb(mockTx);

    // Ejecutar con fecha 2026-03-05 (4 días transcurridos -> 4 cuotas esperadas)
    // cred-1: 4 esperadas - 1 pagada = 3 atrasadas -> EN_MORA
    // cred-2: 4 esperadas - 10 pagadas = 0 atrasadas -> ACTIVO
    const resumen = await moraService.ejecutarParaTenant(tenantId, '2026-03-05');

    expect(resumen.totalEvaluados).toBe(2);
    expect(resumen.pasanAEnMora).toBe(1);
    expect(resumen.alDia).toBe(1);
    expect(updatesCredito.length).toBe(1);
    expect(updatesCredito[0].where.id).toBe('cred-1');
    expect(updatesCredito[0].data.estado).toBe('EN_MORA');
    expect(updatesCliente.length).toBe(1);
    expect(updatesCliente[0].where.id).toBe('cli-1');
    expect(updatesCliente[0].data.estadoVisita).toBe('ATRASADO');
  });
});
