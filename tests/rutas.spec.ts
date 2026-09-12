import { test, expect } from '@playwright/test';
import { RutasService } from '../src/rutas/rutas.service';
import { MoraService } from '../src/mora/mora.service';

test.describe('Senior Audit & Test Suite: Hoja de Ruta Diaria, Clientes Ausentes y Reordenamiento', () => {
  let rutasService: RutasService;
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
    rutasService = new RutasService(mockPrisma, moraService);
  });

  test('obtenerRutaHoy: Entrega clientes ordenados según ordenVisitas y calcula métricas del día', async () => {
    const cli1 = {
      id: 'cli-1',
      tenantId,
      vendedorId,
      nombresAlias: 'Carlos',
      apellidos: 'Vargas',
      documento: '101010',
      movil: '3001112233',
      telefono: null,
      direccion: 'Calle 10 # 5-20',
      estadoVisita: 'AL_DIA',
      creditos: [
        {
          id: 'cred-1',
          codigoCredito: 'CR-101',
          valorPrestamo: 500000,
          valorCuota: 25000,
          formaPago: 'diario',
          saldoActual: 400000,
          numeroCuotasTotal: 24,
          cuotasPagadas: 4,
          fechaInicio: new Date(),
          fechaVencimiento: new Date(Date.now() + 86400000 * 20),
          estado: 'ACTIVO',
        },
      ],
    };

    const cli2 = {
      id: 'cli-2',
      tenantId,
      vendedorId,
      nombresAlias: 'Beatriz',
      apellidos: 'Pinzón',
      documento: '202020',
      movil: '3009998877',
      telefono: null,
      direccion: 'Carrera 7 # 12-40',
      estadoVisita: 'ATRASADO',
      creditos: [
        {
          id: 'cred-2',
          codigoCredito: 'CR-102',
          valorPrestamo: 300000,
          valorCuota: 15000,
          formaPago: 'diario',
          saldoActual: 250000,
          numeroCuotasTotal: 24,
          cuotasPagadas: 2,
          fechaInicio: new Date(Date.now() - 86400000 * 5), // Empezó hace 5 días, pagó 2 -> atrasado
          fechaVencimiento: new Date(Date.now() + 86400000 * 19),
          estado: 'EN_MORA',
        },
      ],
    };

    const mockTx = {
      usuario: {
        findFirst: async () => ({ id: vendedorId, nombre: 'Juan Cobrador' }),
      },
      ruta: {
        findFirst: async () => ({
          id: 'ruta-1',
          nombreRuta: 'Ruta Centro',
          ordenVisitas: ['cli-2', 'cli-1'], // Nota: orden personalizado donde Beatriz (cli-2) va primero
        }),
      },
      cliente: {
        findMany: async () => [cli1, cli2],
      },
      abono: {
        findMany: async () => [
          {
            id: 'abono-hoy-1',
            creditoId: 'cred-1',
            valorAbonado: 25000,
            fecha: new Date(),
          },
        ],
      },
    };

    mockPrisma.withTenant = async (_tId: string, cb: any) => cb(mockTx);

    const rutaHoy = await rutasService.obtenerRutaHoy(mockUser, {});

    // Verificación de orden: cli-2 debe ser el primero (orden 1), cli-1 el segundo (orden 2)
    expect(rutaHoy.clientes.length).toBe(2);
    expect(rutaHoy.clientes[0].clienteId).toBe('cli-2');
    expect(rutaHoy.clientes[0].orden).toBe(1);
    expect(rutaHoy.clientes[1].clienteId).toBe('cli-1');
    expect(rutaHoy.clientes[1].orden).toBe(2);

    // Verificación de pagos de hoy
    expect(rutaHoy.clientes[1].haPagadoHoy).toBe(true);
    expect(rutaHoy.clientes[1].totalAbonadoHoy).toBe(25000);
    expect(rutaHoy.clientes[0].haPagadoHoy).toBe(false);

    // Verificación de métricas
    expect(rutaHoy.metricas.totalClientes).toBe(2);
    expect(rutaHoy.metricas.clientesCobradosHoy).toBe(1);
    expect(rutaHoy.metricas.clientesPendientesHoy).toBe(1);
    expect(rutaHoy.metricas.totalRecaudadoHoy).toBe(25000);
    expect(rutaHoy.metricas.totalEsperadoHoy).toBe(40000); // 25000 + 15000
  });

  test('marcarAusente: Actualiza exitosamente el estado de visita a AUSENTE', async () => {
    let clienteActualizado: any = null;
    const mockTx = {
      cliente: {
        findFirst: async () => ({
          id: 'cli-1',
          tenantId,
          vendedorId,
          nombresAlias: 'Carlos',
          estadoVisita: 'AL_DIA',
        }),
        update: async (args: any) => {
          clienteActualizado = args.data;
          return { id: 'cli-1', ...args.data };
        },
      },
    };

    mockPrisma.withTenant = async (_tId: string, cb: any) => cb(mockTx);

    const resultado = await rutasService.marcarAusente('cli-1', mockUser, {
      observaciones: 'Fui al local pero estaba cerrado por almuerzo',
    });

    expect(resultado.clienteId).toBe('cli-1');
    expect(resultado.estadoVisita).toBe('AUSENTE');
    expect(clienteActualizado.estadoVisita).toBe('AUSENTE');
  });

  test('marcarAusente: Bloquea intentos si el cliente pertenece a otro vendedor', async () => {
    const mockTx = {
      cliente: {
        findFirst: async () => ({
          id: 'cli-otro',
          tenantId,
          vendedorId: 'otro-vendedor-uuid', // Pertenece a otro vendedor
          nombresAlias: 'Extraño',
        }),
      },
    };

    mockPrisma.withTenant = async (_tId: string, cb: any) => cb(mockTx);

    await expect(rutasService.marcarAusente('cli-otro', mockUser)).rejects.toThrow(
      'No puedes marcar ausente a un cliente de otro vendedor',
    );
  });

  test('guardarOrdenRuta: Valida pertenencia de clientes y actualiza ordenVisitas', async () => {
    let rutaGuardada: any = null;
    const mockTx = {
      cliente: {
        count: async () => 2, // Valida que los 2 clientes pertenecen al tenant
      },
      ruta: {
        findFirst: async () => null, // No existía ruta previa
        create: async (args: any) => {
          rutaGuardada = args.data;
          return { id: 'nueva-ruta', ...args.data };
        },
      },
    };

    mockPrisma.withTenant = async (_tId: string, cb: any) => cb(mockTx);

    const resultado = await rutasService.guardarOrdenRuta(
      {
        ordenClienteIds: ['cli-1', 'cli-2'],
        nombreRuta: 'Ruta Norte Matutina',
      },
      mockUser,
    );

    expect(resultado.nombreRuta).toBe('Ruta Norte Matutina');
    expect(rutaGuardada.ordenVisitas).toEqual(['cli-1', 'cli-2']);
    expect(rutaGuardada.vendedorId).toBe(vendedorId);
  });
});
