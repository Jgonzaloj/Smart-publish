import { test, expect } from '@playwright/test';
import { AbonosService } from '../src/abonos/abonos.service';
import { MoraService } from '../src/mora/mora.service';

test.describe('Senior Audit & Test Suite: Sincronización Abonos + Mora en Tiempo Real', () => {
  let abonosService: AbonosService;
  let moraService: MoraService;
  let mockPrisma: any;

  const tenantId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const vendedorId = 'vend-1111-2222-3333-444444444444';
  const mockUser = {
    sub: vendedorId,
    email: 'cobrador@creditos.com',
    nombre: 'Carlos Cobrador',
    tenantId,
    rol: 'VENDEDOR' as const,
  };

  test.beforeEach(() => {
    mockPrisma = {
      tenant: { findMany: async () => [] },
      withTenant: async (_tId: string, cb: any) => cb(mockPrisma),
    };
    moraService = new MoraService(mockPrisma);
    abonosService = new AbonosService(mockPrisma, moraService);
  });

  test('Registrar abono: Si el cliente queda al día, el crédito vuelve a ACTIVO y el cliente a AL_DIA', async () => {
    let abonoCreado: any = null;
    let creditoActualizado: any = null;
    let clienteActualizado: any = null;

    const mockCredito = {
      id: 'cred-1',
      tenantId,
      clienteId: 'cli-1',
      vendedorId,
      codigoCredito: 'CR-555',
      valorPrestamo: 300000,
      valorCuota: 15000,
      formaPago: 'diario',
      saldoActual: 200000,
      numeroCuotasTotal: 20,
      cuotasPagadas: 2, // Llevaba 2 cuotas pagadas
      fechaInicio: new Date(Date.now() - 86400000 * 3), // 3 días transcurridos -> esperaba 3 cuotas (estaba 1 atrasado)
      fechaVencimiento: new Date(Date.now() + 86400000 * 17),
      estado: 'EN_MORA',
      cliente: {
        id: 'cli-1',
        estadoVisita: 'ATRASADO',
      },
    };

    const mockTx = {
      credito: {
        findFirst: async () => mockCredito,
        update: async (args: any) => {
          creditoActualizado = args.data;
          return { ...mockCredito, ...args.data };
        },
      },
      cliente: {
        update: async (args: any) => {
          clienteActualizado = args.data;
          return { ...mockCredito.cliente, ...args.data };
        },
      },
      abono: {
        create: async (args: any) => {
          abonoCreado = args.data;
          return { id: 'abono-nuevo-1', ...args.data };
        },
      },
    };

    mockPrisma.withTenant = async (_tId: string, cb: any) => cb(mockTx);

    const resAbono = await abonosService.crear(
      {
        creditoId: 'cred-1',
        valorAbonado: 15000,
      },
      mockUser,
    );

    // Al pagar la cuota 3, ya tiene 3 pagadas para 3 días transcurridos -> 0 atrasadas
    expect(abonoCreado.valorAbonado).toBe(15000);
    expect(abonoCreado.saldoNuevo).toBe(185000);
    expect(abonoCreado.numeroCuota).toBe(3);
    expect(abonoCreado.cuotasAtrasadas).toBe(0);

    expect(creditoActualizado.cuotasPagadas).toBe(3);
    expect(creditoActualizado.estado).toBe('ACTIVO'); // Vuelve de EN_MORA a ACTIVO

    expect(clienteActualizado.estadoVisita).toBe('AL_DIA'); // Vuelve de ATRASADO a AL_DIA
  });

  test('Registrar abono que liquida la totalidad del saldo: Estado pasa a PAGADO y cuotas atrasadas a 0', async () => {
    let creditoActualizado: any = null;

    const mockCredito = {
      id: 'cred-2',
      tenantId,
      clienteId: 'cli-2',
      vendedorId,
      codigoCredito: 'CR-777',
      valorPrestamo: 100000,
      valorCuota: 25000,
      formaPago: 'diario',
      saldoActual: 25000, // Última cuota pendiente
      numeroCuotasTotal: 4,
      cuotasPagadas: 3,
      fechaInicio: new Date(),
      fechaVencimiento: new Date(Date.now() + 86400000 * 10),
      estado: 'ACTIVO',
      cliente: {
        id: 'cli-2',
        estadoVisita: 'AL_DIA',
      },
    };

    const mockTx = {
      credito: {
        findFirst: async () => mockCredito,
        update: async (args: any) => {
          creditoActualizado = args.data;
          return { ...mockCredito, ...args.data };
        },
      },
      cliente: {
        update: async () => {},
      },
      abono: {
        create: async (args: any) => ({ id: 'abono-final', ...args.data }),
      },
    };

    mockPrisma.withTenant = async (_tId: string, cb: any) => cb(mockTx);

    await abonosService.crear(
      {
        creditoId: 'cred-2',
        valorAbonado: 25000,
      },
      mockUser,
    );

    expect(creditoActualizado.saldoActual).toBe(0);
    expect(creditoActualizado.estado).toBe('PAGADO');
  });

  test('Validación financiera: Rechaza abonos mayores al saldo actual del crédito', async () => {
    const mockCredito = {
      id: 'cred-3',
      tenantId,
      clienteId: 'cli-3',
      vendedorId,
      saldoActual: 50000,
      cuotasPagadas: 0,
      estado: 'ACTIVO',
      cliente: { id: 'cli-3' },
    };

    const mockTx = {
      credito: { findFirst: async () => mockCredito },
    };

    mockPrisma.withTenant = async (_tId: string, cb: any) => cb(mockTx);

    await expect(
      abonosService.crear(
        {
          creditoId: 'cred-3',
          valorAbonado: 80000, // Mayor a 50000
        },
        mockUser,
      ),
    ).rejects.toThrow('El abono no puede ser mayor al saldo pendiente');
  });
});
