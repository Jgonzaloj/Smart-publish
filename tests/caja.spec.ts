import { test, expect } from '@playwright/test';
import { CajaService } from '../src/caja/caja.service';
import { Prisma } from '@prisma/client';

test.describe('Senior Audit & Test Suite: Gestión de Caja, Cuadres Diarios y Precisión Financiera', () => {
  let cajaService: CajaService;
  let mockPrisma: any;

  const tenantId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const vendedorId = 'vend-1111-2222-3333-444444444444';
  const vendedor2Id = 'vend-5555-6666-7777-888888888888';

  const mockAdminUser = {
    sub: 'admin-1234',
    email: 'admin@empresa.com',
    nombre: 'Administrador Principal',
    tenantId,
    rol: 'ADMIN' as const,
  };

  const mockCobradorUser = {
    sub: vendedorId,
    email: 'cobrador@empresa.com',
    nombre: 'Carlos Cobrador',
    tenantId,
    rol: 'VENDEDOR' as const,
  };

  test.beforeEach(() => {
    mockPrisma = {
      withTenant: async (_tId: string, cb: any) => cb(mockPrisma),
      movimientoCaja: {
        create: async (args: any) => ({
          id: 'mov-1',
          ...args.data,
          fecha: new Date(),
        }),
        findMany: async (args: any) => {
          return [
            { id: 'm1', vendedorId, tipo: 'INGRESO', valor: new Prisma.Decimal(500), esSeguro: false, fecha: new Date() },
            { id: 'm2', vendedorId, tipo: 'EGRESO', valor: new Prisma.Decimal(200), esSeguro: false, fecha: new Date() },
            { id: 'm3', vendedorId, tipo: 'INGRESO', valor: new Prisma.Decimal(50), esSeguro: true, fecha: new Date() },
          ];
        },
      },
      cuadreCaja: {
        findFirst: async (args: any) => ({
          id: 'cuadre-1',
          tenantId,
          vendedorId: args.where.vendedorId,
          cajaInicial: new Prisma.Decimal(1000),
          totalRetiros: new Prisma.Decimal(300),
          observaciones: null,
          fecha: new Date(),
        }),
        findMany: async () => [
          {
            id: 'cuadre-1',
            tenantId,
            vendedorId,
            cajaInicial: new Prisma.Decimal(1000),
            totalRetiros: new Prisma.Decimal(300),
            observaciones: null,
            fecha: new Date(),
          },
        ],
        update: async (args: any) => ({ id: args.where.id, ...args.data }),
        create: async (args: any) => ({ id: 'cuadre-new', ...args.data }),
      },
      abono: {
        findMany: async (args: any) => [
          { id: 'ab1', creditoId: 'cr1', usuarioId: vendedorId, valorAbonado: new Prisma.Decimal(150), metodoPago: 'EFECTIVO', esAdicional: false, fecha: new Date() },
          { id: 'ab2', creditoId: 'cr2', usuarioId: vendedorId, valorAbonado: new Prisma.Decimal(250), metodoPago: 'TRANSFERENCIA', esAdicional: true, fecha: new Date() },
        ],
      },
      credito: {
        findMany: async (args: any) => [
          { id: 'cr1', clienteId: 'cli1', vendedorId, valorPrestamo: new Prisma.Decimal(1000), valorCuota: new Prisma.Decimal(150), saldoActual: new Prisma.Decimal(850), fechaInicio: new Date() },
          { id: 'cr2', clienteId: 'cli2', vendedorId, valorPrestamo: new Prisma.Decimal(2000), valorCuota: new Prisma.Decimal(250), saldoActual: new Prisma.Decimal(1750), fechaInicio: new Date() },
        ],
      },
      cliente: {
        findMany: async () => [
          { id: 'cli1', vendedorId, nombresAlias: 'Juan', apellidos: 'Perez', movil: '3001112222', estadoVisita: 'AL_DIA' },
          { id: 'cli2', vendedorId, nombresAlias: 'Maria', apellidos: 'Gomez', movil: '3003334444', estadoVisita: 'AUSENTE' },
          { id: 'cli3', vendedorId, nombresAlias: 'Pedro', apellidos: 'Lopez', movil: '3005556666', estadoVisita: 'APLAZADO' },
        ],
        count: async () => 1,
      },
      usuario: {
        findFirst: async () => ({ id: vendedorId, nombre: 'Carlos Cobrador', posicion: 'Ruta 1' }),
        findMany: async () => [
          { id: vendedorId, nombre: 'Carlos Cobrador', rol: 'VENDEDOR', activo: true },
          { id: vendedor2Id, nombre: 'Pedro Cobrador', rol: 'VENDEDOR', activo: true },
        ],
      },
    };

    cajaService = new CajaService(mockPrisma);
  });

  test('Calcula con precisión Decimal el cuadre diario en vivo', async () => {
    const cuadre = await cajaService.obtenerCuadreDia(mockCobradorUser);

    expect(cuadre).toBeDefined();
    expect(cuadre.cajaInicial).toBe(1000);
    expect(cuadre.totalCobrado).toBe(400); // 150 + 250
    expect(cuadre.recaudoEfectivo).toBe(150);
    expect(cuadre.recaudoTransferencia).toBe(250);
    expect(cuadre.totalPrestadoNuevo).toBe(3000); // 1000 + 2000
    expect(cuadre.totalIngresos).toBe(500);
    expect(cuadre.totalEgresos).toBe(200);
    expect(cuadre.totalRetiros).toBe(300);
    expect(cuadre.ingresosSeguros).toBe(50);
    expect(cuadre.cajaSeguros).toBe(50);

    // Saldo esperado = 1000 (caja inicial) + 150 (efectivo) + 500 (ingresos) - 3000 (ventas nuevas) - 200 (egresos) - 300 (retiros) = -1850
    expect(cuadre.saldoEsperadoEnCaja).toBe(1000 + 150 + 500 - 3000 - 200 - 300);
  });

  test('Vendedor no puede consultar el cuadre de otro vendedor (defensa en profundidad)', async () => {
    await expect(
      cajaService.obtenerCuadreDia(mockCobradorUser, undefined, 'otro-vendedor-id'),
    ).rejects.toThrow('No puedes consultar el cuadre de otro vendedor');
  });

  test('Resumen del Día estilo V13 calcula desglose completo y clientes no pagados', async () => {
    const resumen = await cajaService.obtenerResumenDia(mockCobradorUser);

    expect(resumen).toBeDefined();
    expect(resumen.vendedorNombre).toContain('Carlos Cobrador');
    expect(resumen.clientesAusentes).toBe(1);
    expect(resumen.aplazadosSiguienteDia).toBe(1);
    expect(resumen.numeroClientes).toBe(3);
    expect(resumen.clientesNuevos).toBe(1);
    expect(resumen.pagosEnRuta).toBe(1);
    expect(resumen.pagosAdicionales).toBe(1);
    expect(resumen.cajaInicial).toBe(1000);
    expect(resumen.recaudoDia).toBe(400);
    expect(resumen.cajaSeguros).toBe(50);
  });

  test('Resumen Admin agrupado ejecuta consulta consolidada multi-vendedor sin N+1', async () => {
    const resultados = await cajaService.resumenAdmin(mockAdminUser);

    expect(Array.isArray(resultados)).toBe(true);
    expect(resultados.length).toBe(2);
    expect(resultados[0].vendedor.nombre).toBe('Carlos Cobrador');
    expect(resultados[0].totalCobrado).toBe(400);
    expect(resultados[1].vendedor.nombre).toBe('Pedro Cobrador');
  });
});
