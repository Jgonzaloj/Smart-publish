import * as bcrypt from 'bcrypt';

export interface InMemoryStore {
  tenants: any[];
  usuarios: any[];
  productosCredito: any[];
  clientes: any[];
  codeudores: any[];
  creditos: any[];
  abonos: any[];
  movimientosCaja: any[];
  cuadresCaja: any[];
  rutas: any[];
}

export function createInitialData(): InMemoryStore {
  const tenantId = 'e025b394-4d1a-4d43-85f8-9a3b6e82845c';
  const adminId = 'u-admin-001';
  const cobradorId = 'u-cobrador-001';
  const productoId = 'prod-001';

  const cli1Id = 'cli-001';
  const cli2Id = 'cli-002';
  const cli3Id = 'cli-003';

  const cred1Id = 'cred-001';
  const cred2Id = 'cred-002';
  const cred3Id = 'cred-003';

  const now = new Date();
  const cincoDiasAtras = new Date(Date.now() - 86400000 * 5);
  const veinteDiasAtras = new Date(Date.now() - 86400000 * 20);

  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const cobradorPasswordHash = bcrypt.hashSync('cobrador123', 10);
  const pinHash = bcrypt.hashSync('1234', 10);

  return {
    tenants: [
      {
        id: tenantId,
        nombreNegocio: 'CrediYa Microfinanzas',
        plan: 'premium',
        activo: true,
        createdAt: new Date(),
      },
    ],
    usuarios: [
      {
        id: adminId,
        tenantId,
        nombre: 'Juan Pérez (Administrador)',
        rol: 'ADMIN',
        email: 'admin@crediya.com',
        telefono: '3001002030',
        passwordHash: adminPasswordHash,
        pinHash,
        posicion: 'Oficina Central',
        activo: true,
        createdAt: new Date(),
      },
      {
        id: cobradorId,
        tenantId,
        nombre: 'Carlos Cobrador',
        rol: 'VENDEDOR',
        email: 'carlos@crediya.com',
        telefono: '3109876543',
        passwordHash: cobradorPasswordHash,
        pinHash,
        posicion: 'Ruta 1 - Centro',
        activo: true,
        createdAt: new Date(),
      },
    ],
    productosCredito: [
      {
        id: productoId,
        tenantId,
        nombre: 'Crédito Diario 20%',
        interesDefault: 20.0,
        activo: true,
      },
    ],
    clientes: [
      {
        id: cli1Id,
        tenantId,
        vendedorId: cobradorId,
        nombresAlias: 'Doña Marta Gómez',
        apellidos: 'Vargas',
        documento: '52147896',
        movil: '3001234567',
        telefono: '601234567',
        direccion: 'Calle 10 # 4-20 (Tienda Don Pedro)',
        estadoVisita: 'AL_DIA',
        createdAt: new Date(),
      },
      {
        id: cli2Id,
        tenantId,
        vendedorId: cobradorId,
        nombresAlias: 'Don Jorge Ramírez',
        apellidos: 'Castro',
        documento: '79654123',
        movil: '3157894561',
        telefono: null,
        direccion: 'Carrera 15 # 8-32 (Taller Mecánico)',
        estadoVisita: 'ATRASADO',
        createdAt: cincoDiasAtras,
      },
      {
        id: cli3Id,
        tenantId,
        vendedorId: cobradorId,
        nombresAlias: 'Lucía Herrera',
        apellidos: 'Morales',
        documento: '1023456789',
        movil: '3206549870',
        telefono: null,
        direccion: 'Av 6 # 12-50 (Salón de Belleza)',
        estadoVisita: 'AL_DIA',
        createdAt: veinteDiasAtras,
      },
    ],
    codeudores: [],
    creditos: [
      {
        id: cred1Id,
        tenantId,
        clienteId: cli1Id,
        vendedorId: cobradorId,
        productoId,
        codigoCredito: 'CR-784521',
        valorPrestamo: 300000,
        valorCuota: 15000,
        interes: 20,
        numeroCuotasTotal: 24,
        cuotasPagadas: 10,
        formaPago: 'diario',
        saldoActual: 210000,
        fechaInicio: new Date(Date.now() - 86400000 * 10),
        fechaVencimiento: new Date(Date.now() + 86400000 * 14),
        estado: 'ACTIVO',
        renovadoDeId: null,
        tieneSeguro: false,
      },
      {
        id: cred2Id,
        tenantId,
        clienteId: cli2Id,
        vendedorId: cobradorId,
        productoId,
        codigoCredito: 'CR-932145',
        valorPrestamo: 200000,
        valorCuota: 10000,
        interes: 20,
        numeroCuotasTotal: 24,
        cuotasPagadas: 1, // Lleva 5 días y solo pagó 1 -> 4 cuotas atrasadas!
        formaPago: 'diario',
        saldoActual: 230000,
        fechaInicio: cincoDiasAtras,
        fechaVencimiento: new Date(Date.now() + 86400000 * 19),
        estado: 'EN_MORA',
        renovadoDeId: null,
        tieneSeguro: false,
      },
      {
        id: cred3Id,
        tenantId,
        clienteId: cli3Id,
        vendedorId: cobradorId,
        productoId,
        codigoCredito: 'CR-451236',
        valorPrestamo: 150000,
        valorCuota: 7500,
        interes: 20,
        numeroCuotasTotal: 24,
        cuotasPagadas: 20, // Solo le faltan 4 cuotas ($30,000) -> Excelente candidata para renovación!
        formaPago: 'diario',
        saldoActual: 30000,
        fechaInicio: veinteDiasAtras,
        fechaVencimiento: new Date(Date.now() + 86400000 * 4),
        estado: 'ACTIVO',
        renovadoDeId: null,
        tieneSeguro: false,
      },
    ],
    abonos: [
      {
        id: 'abono-demo-001',
        tenantId,
        creditoId: cred1Id,
        usuarioId: cobradorId,
        fecha: new Date(), // Pagó hoy
        saldoAnterior: 225000,
        valorAbonado: 15000,
        saldoNuevo: 210000,
        numeroCuota: 10,
        cuotasAtrasadas: 0,
      },
    ],
    movimientosCaja: [
      {
        id: 'mov-001',
        tenantId,
        vendedorId: cobradorId,
        tipo: 'INGRESO',
        concepto: 'Base inicial de caja',
        valor: 100000,
        fecha: new Date(),
      },
    ],
    cuadresCaja: [],
    rutas: [
      {
        id: 'ruta-001',
        tenantId,
        vendedorId: cobradorId,
        nombreRuta: 'Ruta 1 - Centro Comercial',
        ordenVisitas: [cli1Id, cli2Id, cli3Id],
      },
    ],
  };
}
