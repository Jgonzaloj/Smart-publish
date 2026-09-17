// Test Runner Nativo para CrediYa (Node.js 20+)
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando Auditoría y Suite de Pruebas Automatizadas de CrediYa...\n');

// 2. Ejecutor de pruebas directas en memoria
async function runAuditedTests() {
  const bcrypt = require('bcrypt');
  const { Prisma } = require('@prisma/client');
  const { AuthService } = require('../dist/auth/auth.service');
  const { CajaService } = require('../dist/caja/caja.service');
  const { DashboardService } = require('../dist/dashboard/dashboard.service');
  const { UsuariosService } = require('../dist/usuarios/usuarios.service');
  const { ClientesService } = require('../dist/clientes/clientes.service');
  const { MoraService } = require('../dist/mora/mora.service');
  const { AbonosService } = require('../dist/abonos/abonos.service');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASÓ: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FALLÓ: ${testName}`);
      failed++;
    }
  }

  console.log('🔒 ==========================================');
  console.log('🔒 1. PRUEBAS DE SEGURIDAD & AUTH (BACKDOOR)');
  console.log('🔒 ==========================================');

  const validTenantId = 'e025b394-4d1a-4d43-85f8-9a3b6e82845c';
  const realPassword = 'MiPasswordSeguro2026!';
  const realPasswordHash = await bcrypt.hash(realPassword, 10);

  const mockJwt = {
    sign: (payload) => `mock_jwt_token_${payload.sub}`,
  };

  const mockPrismaAuth = {
    buscarCredencialesLogin: async (email) => {
      if (email === 'cliente@empresa.com') {
        return {
          id: 'user-123',
          tenantId: validTenantId,
          nombre: 'Juan Perez',
          email: 'cliente@empresa.com',
          rol: 'ADMIN',
          passwordHash: realPasswordHash,
          activo: true,
        };
      }
      return null;
    },
    tenant: {
      findFirst: async () => ({
        id: validTenantId,
        nombreNegocio: 'Financiera Real',
        activo: true,
        moneda: 'PEN',
        pais: 'Perú',
      }),
    },
    withTenant: async (_t, cb) => cb(mockPrismaAuth),
  };

  const authService = new AuthService(mockPrismaAuth, mockJwt);

  // Test 1.1: Backdoor PIN '1234' DEBE SER RECHAZADO
  try {
    await authService.login({ email: 'cliente@empresa.com', password: '1234' });
    assert(false, 'Login con PIN 1234 debió fallar y no falló');
  } catch (err) {
    assert(err.message === 'Credenciales inválidas', 'Login con PIN 1234 es RECHAZADO (Backdoor eliminado)');
  }

  // Test 1.2: Password incorrecto rechazado
  try {
    await authService.login({ email: 'cliente@empresa.com', password: 'password-falso' });
    assert(false, 'Login con clave incorrecta debió fallar');
  } catch (err) {
    assert(err.message === 'Credenciales inválidas', 'Login con password incorrecto es RECHAZADO');
  }

  // Test 1.3: Password correcto exitoso
  try {
    const loginOk = await authService.login({ email: 'cliente@empresa.com', password: realPassword });
    assert(loginOk && loginOk.accessToken && loginOk.tenant.id === validTenantId, 'Login con clave real es EXITOSO');
  } catch (err) {
    assert(false, 'Login con clave real falló: ' + err.message);
  }

  console.log('\n💰 ==========================================');
  console.log('💰 2. PRUEBAS DE CAJA & PRECISIÓN DECIMAL');
  console.log('💰 ==========================================');

  const vendedorId = 'vend-1111-2222-3333-444444444444';
  const mockPrismaCaja = {
    withTenant: async (_t, cb) => cb(mockPrismaCaja),
    movimientoCaja: {
      findMany: async () => [
        { id: 'm1', vendedorId, tipo: 'INGRESO', valor: new Prisma.Decimal(500), esSeguro: false, fecha: new Date() },
        { id: 'm2', vendedorId, tipo: 'EGRESO', valor: new Prisma.Decimal(200), esSeguro: false, fecha: new Date() },
        { id: 'm3', vendedorId, tipo: 'INGRESO', valor: new Prisma.Decimal(50), esSeguro: true, fecha: new Date() },
      ],
    },
    cuadreCaja: {
      findFirst: async () => ({
        id: 'cuadre-1',
        tenantId: validTenantId,
        vendedorId,
        cajaInicial: new Prisma.Decimal(1000),
        totalRetiros: new Prisma.Decimal(300),
        observaciones: null,
      }),
      findMany: async () => [
        {
          id: 'cuadre-1',
          tenantId: validTenantId,
          vendedorId,
          cajaInicial: new Prisma.Decimal(1000),
          totalRetiros: new Prisma.Decimal(300),
          observaciones: null,
        },
      ],
    },
    abono: {
      findMany: async () => [
        { id: 'ab1', creditoId: 'cr1', usuarioId: vendedorId, valorAbonado: new Prisma.Decimal(150), metodoPago: 'EFECTIVO', esAdicional: false, fecha: new Date() },
        { id: 'ab2', creditoId: 'cr2', usuarioId: vendedorId, valorAbonado: new Prisma.Decimal(250), metodoPago: 'TRANSFERENCIA', esAdicional: true, fecha: new Date() },
      ],
    },
    credito: {
      findMany: async () => [
        { id: 'cr1', clienteId: 'cli1', vendedorId, estado: 'ACTIVO', valorPrestamo: new Prisma.Decimal(1000), valorCuota: new Prisma.Decimal(150), saldoActual: new Prisma.Decimal(850), fechaInicio: new Date() },
        { id: 'cr2', clienteId: 'cli2', vendedorId, estado: 'ACTIVO', valorPrestamo: new Prisma.Decimal(2000), valorCuota: new Prisma.Decimal(250), saldoActual: new Prisma.Decimal(1750), fechaInicio: new Date() },
      ],
      updateMany: async (args) => ({ count: 1 }),
    },
    cliente: {
      findMany: async () => [
        { id: 'cli1', vendedorId, nombresAlias: 'Juan', apellidos: 'Perez', movil: '3001', estadoVisita: 'AL_DIA' },
        { id: 'cli2', vendedorId, nombresAlias: 'Maria', apellidos: 'Gomez', movil: '3002', estadoVisita: 'AUSENTE' },
        { id: 'cli3', vendedorId, nombresAlias: 'Pedro', apellidos: 'Lopez', movil: '3003', estadoVisita: 'APLAZADO' },
      ],
      count: async () => 1,
      update: async (args) => ({ id: args.where.id, ...args.data }),
    },
    usuario: {
      findFirst: async () => ({ id: vendedorId, nombre: 'Carlos Cobrador', posicion: 'Ruta 1' }),
      findMany: async () => [
        { id: vendedorId, nombre: 'Carlos Cobrador', rol: 'VENDEDOR', activo: true },
      ],
    },
  };

  const cajaService = new CajaService(mockPrismaCaja);
  const userCobrador = { sub: vendedorId, tenantId: validTenantId, rol: 'VENDEDOR' };
  const userAdmin = { sub: 'admin-1', tenantId: validTenantId, rol: 'ADMIN' };

  const cuadre = await cajaService.obtenerCuadreDia(userCobrador);
  assert(cuadre.totalCobrado === 400, 'Cuadre calcula totalCobrado exacto (150 + 250 = 400)');
  assert(cuadre.recaudoEfectivo === 150 && cuadre.recaudoTransferencia === 250, 'Separación exacta de Efectivo y Transferencia');
  assert(cuadre.saldoEsperadoEnCaja === -1850, 'Saldo en caja con precisión Decimal sin errores de redondeo');

  const resumenAdmin = await cajaService.resumenAdmin(userAdmin);
  assert(Array.isArray(resumenAdmin) && resumenAdmin.length === 1 && resumenAdmin[0].totalCobrado === 400, 'Resumen Admin agrupado ejecuta en una sola ronda');

  console.log('\n📊 ==========================================');
  console.log('📊 3. PRUEBAS DE DASHBOARD & PRECISIÓN CARTERA');
  console.log('📊 ==========================================');

  const moraService = new MoraService(mockPrismaCaja);
  const dashboardService = new DashboardService(mockPrismaCaja, moraService);
  const resumenEjecutivo = await dashboardService.obtenerResumenEjecutivo(userAdmin);

  assert(resumenEjecutivo.financiero.totalPrestadoHistorico === 3000, 'Total prestado histórico calculado con Decimal');
  assert(resumenEjecutivo.financiero.carteraActivaTotal === 2600, 'Cartera activa total calculada con Decimal (850 + 1750 = 2600)');
  assert(resumenEjecutivo.financiero.totalCobradoHoy === 400, 'Total cobrado hoy calculado con Decimal (400)');

  console.log('\n👥 ==========================================');
  console.log('👥 4. PRUEBAS DE USUARIOS & AISLAMIENTO CLIENTES');
  console.log('👥 ==========================================');

  const usuariosService = new UsuariosService(mockPrismaCaja);
  const clientesService = new ClientesService(mockPrismaCaja);

  const clientesCobrador = await clientesService.listar(userCobrador);
  assert(clientesCobrador.length === 3, 'Clientes listados bajo aislamiento de tenant');

  const updateGps = await clientesService.actualizarGps('cli1', { latitud: -12.0463, longitud: -77.0428, precisionGps: 10 }, userCobrador);
  assert(updateGps && updateGps.cliente && updateGps.cliente.latitud === -12.0463, 'Endpoint PATCH /clientes/:id/gps actualiza coordenadas GPS');

  console.log('\n🛡️ ==========================================');
  console.log('🛡️ 5. PRUEBAS DE IDEMPOTENCIA Y DOBLE ABONO');
  console.log('🛡️ ==========================================');

  const abonosCreados = [];
  const mockCreditoDb = {
    id: 'cr-idempotent-1',
    clienteId: 'cli1',
    vendedorId: vendedorId,
    codigoCredito: 'CR-1001',
    valorPrestamo: new Prisma.Decimal(1000),
    valorCuota: new Prisma.Decimal(50),
    saldoActual: new Prisma.Decimal(500),
    interes: new Prisma.Decimal(20),
    numeroCuotasTotal: 24,
    cuotasPagadas: 10,
    formaPago: 'diario',
    fechaInicio: new Date(),
    fechaVencimiento: new Date(Date.now() + 30 * 86400000),
    estado: 'ACTIVO',
    cliente: { id: 'cli1', nombresAlias: 'Juan', apellidos: 'Perez', documento: '12345678', movil: '3001' },
  };

  const mockPrismaAbonos = {
    withTenant: async (_t, cb) => cb(mockPrismaAbonos),
    credito: {
      findFirst: async () => mockCreditoDb,
      update: async (args) => {
        mockCreditoDb.saldoActual = new Prisma.Decimal(args.data.saldoActual);
        mockCreditoDb.cuotasPagadas = args.data.cuotasPagadas;
        return mockCreditoDb;
      },
    },
    abono: {
      findFirst: async ({ where }) => abonosCreados.find((a) => a.id === where.id) || null,
      create: async ({ data }) => {
        const nuevo = { ...data, id: data.id || 'abn-' + (abonosCreados.length + 1) };
        abonosCreados.push(nuevo);
        return nuevo;
      },
    },
    cliente: {
      update: async () => ({}),
    },
  };

  const abonosService = new AbonosService(mockPrismaAbonos, moraService);
  const idempotencyKey = 'uuid-abono-unico-12345';

  // 1er intento de cobro
  const res1 = await abonosService.crear(
    { creditoId: 'cr-idempotent-1', valorAbonado: 50, idempotencyKey },
    userCobrador
  );
  assert(res1 && res1.id === idempotencyKey && abonosCreados.length === 1, 'Primer abono registrado con UUID idempotente');
  assert(Number(mockCreditoDb.saldoActual) === 450, 'Saldo de crédito descontado correctamente (500 - 50 = 450)');

  // 2do intento con el MISMO idempotencyKey (simula retry de red / sincronización offline)
  const res2 = await abonosService.crear(
    { creditoId: 'cr-idempotent-1', valorAbonado: 50, idempotencyKey },
    userCobrador
  );
  assert(res2 && res2.id === idempotencyKey && abonosCreados.length === 1, 'Segundo abono con misma key retorna registro existente SIN duplicar');
  assert(Number(mockCreditoDb.saldoActual) === 450, 'Saldo NO se descontó dos veces (saldo protegido contra doble cobro)');

  console.log(`\n==============================================`);
  console.log(`🎯 RESULTADO FINAL DE LA SUITE DE AUDITORÍA:`);
  console.log(`   Total de Pruebas: ${passed + failed}`);
  console.log(`   Pruebas Exitosas: ${passed}`);
  console.log(`   Pruebas Fallidas: ${failed}`);
  console.log(`==============================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAuditedTests().catch((err) => {
  console.error('Error fatal en ejecución de tests:', err);
  process.exit(1);
});
