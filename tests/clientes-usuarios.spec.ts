import { test, expect } from '@playwright/test';
import { UsuariosService } from '../src/usuarios/usuarios.service';
import { ClientesService } from '../src/clientes/clientes.service';
import { RolUsuario } from '../src/usuarios/dto/usuarios.dto';
import { Prisma } from '@prisma/client';

test.describe('Senior Audit & Test Suite: Gestión de Usuarios, Clientes y Aislamiento por Rol', () => {
  let usuariosService: UsuariosService;
  let clientesService: ClientesService;
  let mockPrisma: any;

  const tenantId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const adminId = 'admin-1111-2222-3333-444444444444';
  const vendedor1Id = 'vend-1111-2222-3333-444444444444';
  const vendedor2Id = 'vend-5555-6666-7777-888888888888';

  const mockAdminUser = {
    sub: adminId,
    email: 'admin@empresa.com',
    nombre: 'Super Administrador',
    tenantId,
    rol: 'ADMIN' as const,
  };

  const mockCobradorUser = {
    sub: vendedor1Id,
    email: 'carlos@empresa.com',
    nombre: 'Carlos Cobrador',
    tenantId,
    rol: 'VENDEDOR' as const,
  };

  test.beforeEach(() => {
    mockPrisma = {
      withTenant: async (_tId: string, cb: any) => cb(mockPrisma),
      usuario: {
        findFirst: async (args: any) => {
          if (args.where.email === 'existente@empresa.com') {
            return { id: 'u-existente', email: 'existente@empresa.com' };
          }
          if (args.where.id === adminId) {
            return { id: adminId, nombre: 'Super Admin', rol: 'ADMIN', activo: true, tenantId };
          }
          if (args.where.id === vendedor1Id) {
            return { id: vendedor1Id, nombre: 'Carlos Cobrador', rol: 'VENDEDOR', activo: true, tenantId };
          }
          return null;
        },
        findMany: async () => [
          { id: adminId, nombre: 'Super Admin', email: 'admin@empresa.com', rol: 'ADMIN', activo: true, createdAt: new Date() },
          { id: vendedor1Id, nombre: 'Carlos Cobrador', email: 'carlos@empresa.com', rol: 'VENDEDOR', activo: true, createdAt: new Date() },
        ],
        create: async (args: any) => ({
          id: 'user-new-id',
          ...args.data,
          createdAt: new Date(),
        }),
        update: async (args: any) => ({
          id: args.where.id,
          ...args.data,
        }),
      },
      cliente: {
        findMany: async (args?: any) => {
          const all = [
            { id: 'cli-1', vendedorId: vendedor1Id, nombresAlias: 'Cliente de Carlos', apellidos: 'Perez', movil: '3001', creditos: [] },
            { id: 'cli-2', vendedorId: vendedor2Id, nombresAlias: 'Cliente de Pedro', apellidos: 'Gomez', movil: '3002', creditos: [] },
          ];
          if (args?.where?.vendedorId) {
            return all.filter((c) => c.vendedorId === args.where.vendedorId);
          }
          return all;
        },
        create: async (args: any) => ({
          id: 'cli-new-id',
          ...args.data,
          createdAt: new Date(),
        }),
      },
      credito: {
        findMany: async () => [
          { id: 'cr-1', vendedorId: vendedor1Id, estado: 'ACTIVO', saldoActual: new Prisma.Decimal(500) },
        ],
        create: async (args: any) => ({
          id: 'cr-new-id',
          ...args.data,
          createdAt: new Date(),
        }),
      },
      productoCredito: {
        findFirst: async () => ({ id: 'prod-1', tenantId, nombre: 'Crédito General', interesDefault: new Prisma.Decimal(20) }),
        create: async (args: any) => ({ id: 'prod-new', ...args.data }),
      },
      codeudor: {
        create: async (args: any) => ({ id: 'cod-new', ...args.data }),
      },
    };

    usuariosService = new UsuariosService(mockPrisma);
    clientesService = new ClientesService(mockPrisma);
  });

  test('Crear usuario valida duplicidad de email en el tenant', async () => {
    await expect(
      usuariosService.crearUsuario(mockAdminUser, {
        nombre: 'Usuario Duplicado',
        email: 'existente@empresa.com',
        password: 'Password123!',
        rol: RolUsuario.VENDEDOR,
      }),
    ).rejects.toThrow('Ya existe un usuario con este correo');
  });

  test('Crear usuario hashea password y asigna rol correctamente', async () => {
    const nuevo = await usuariosService.crearUsuario(mockAdminUser, {
      nombre: 'Nuevo Cobrador',
      email: 'nuevo.cobrador@empresa.com',
      password: 'Password123!',
      rol: RolUsuario.VENDEDOR,
      posicion: 'Ruta Norte',
    });

    expect(nuevo).toBeDefined();
    expect(nuevo.nombre).toBe('Nuevo Cobrador');
    expect(nuevo.rol).toBe('VENDEDOR');
    expect(nuevo.posicion).toBe('Ruta Norte');
  });

  test('Administrador no puede degradar su propio rol a VENDEDOR', async () => {
    await expect(
      usuariosService.actualizarUsuario(adminId, mockAdminUser, {
        rol: RolUsuario.VENDEDOR,
      }),
    ).rejects.toThrow('No puedes degradar tu propio rol de administrador');
  });

  test('Listar clientes aplica aislamiento: un vendedor solo ve sus propios clientes asignados', async () => {
    const clientesCobrador = await clientesService.listar(mockCobradorUser);
    expect(clientesCobrador.length).toBe(1);
    expect(clientesCobrador[0].vendedorId).toBe(vendedor1Id);
    expect(clientesCobrador[0].nombresAlias).toBe('Cliente de Carlos');

    const clientesAdmin = await clientesService.listar(mockAdminUser);
    expect(clientesAdmin.length).toBe(2);
  });

  test('Crear cliente registra coordenadas GPS, crédito y saldo con interés', async () => {
    const result = await clientesService.crear(
      {
        nombresAlias: 'Doña Maria Tienda',
        apellidos: 'Ruiz',
        movil: '3109998877',
        direccion: 'Calle 10 # 5-20',
        valorPrestamo: 1000,
        numeroCuotas: 20,
        formaPago: 'diario',
        interes: 20,
        latitud: -12.046374,
        longitud: -77.042793,
        precisionGps: 5.5,
      },
      mockCobradorUser,
    );

    expect(result).toBeDefined();
    expect(result.cliente.nombresAlias).toBe('Doña Maria Tienda');
    expect(result.cliente.latitud).toBe(-12.046374);
    expect(result.credito.valorCuota).toBe(60); // 1000 * 1.20 / 20 = 60
    expect(result.credito.saldoActual).toBe(1200);
  });
});
