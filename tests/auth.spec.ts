import { test, expect } from '@playwright/test';
import { AuthService } from '../src/auth/auth.service';
import * as bcrypt from 'bcrypt';

test.describe('Senior Audit & Test Suite: Autenticación, Seguridad y Bloqueo de Puertas Traseras', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockJwt: any;

  const validTenantId = 'e025b394-4d1a-4d43-85f8-9a3b6e82845c';
  const realPassword = 'MiPasswordSeguro2026!';
  let realPasswordHash: string;

  test.beforeAll(async () => {
    realPasswordHash = await bcrypt.hash(realPassword, 10);
  });

  test.beforeEach(() => {
    mockJwt = {
      sign: (payload: any) => `mock_jwt_token_${payload.sub}`,
    };

    mockPrisma = {
      buscarCredencialesLogin: async (email: string) => {
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
        if (email === 'inactivo@empresa.com') {
          return {
            id: 'user-inactivo',
            tenantId: validTenantId,
            nombre: 'Usuario Inactivo',
            email: 'inactivo@empresa.com',
            rol: 'VENDEDOR',
            passwordHash: realPasswordHash,
            activo: false,
          };
        }
        return null;
      },
      tenant: {
        findFirst: async (args: any) => {
          if (args.where.id === validTenantId) {
            return {
              id: validTenantId,
              nombreNegocio: 'Financiera Real',
              activo: true,
              moneda: 'PEN',
              pais: 'Perú',
            };
          }
          if (args.where.id === 'tenant-suspendido') {
            return {
              id: 'tenant-suspendido',
              nombreNegocio: 'Empresa Morosa',
              activo: false,
              moneda: 'PEN',
              pais: 'Perú',
            };
          }
          return null;
        },
        create: async (args: any) => ({
          id: 'new-tenant-uuid-1234',
          ...args.data,
        }),
      },
      usuario: {
        findFirst: async (args: any) => {
          if (args.where.email === 'existente@empresa.com') {
            return { id: 'user-existente' };
          }
          return null;
        },
        create: async (args: any) => ({
          id: 'new-user-uuid-5678',
          ...args.data,
        }),
      },
      productoCredito: {
        create: async (args: any) => ({
          id: 'new-prod-uuid',
          ...args.data,
        }),
      },
      withTenant: async (_tId: string, cb: any) => cb(mockPrisma),
    };

    authService = new AuthService(mockPrisma, mockJwt as any);
  });

  test('🔴 Seguridad Crítica: Login con PIN "1234" o clave errónea DEBE FALLAR con UnauthorizedException', async () => {
    // Intentar entrar a una cuenta real usando el bypass "1234"
    await expect(
      authService.login({
        email: 'cliente@empresa.com',
        password: '1234',
      }),
    ).rejects.toThrow('Credenciales inválidas');

    // Intentar con contraseña incorrecta cualquiera
    await expect(
      authService.login({
        email: 'cliente@empresa.com',
        password: 'clave-incorrecta-totalmente',
      }),
    ).rejects.toThrow('Credenciales inválidas');
  });

  test('Login con contraseña correcta debe autenticar exitosamente y retornar token con tenant', async () => {
    const response = await authService.login({
      email: 'cliente@empresa.com',
      password: realPassword,
    });

    expect(response).toBeDefined();
    expect(response.accessToken).toBe('mock_jwt_token_user-123');
    expect(response.usuario.email || response.usuario.nombre).toBe('Juan Perez');
    expect(response.tenant.id).toBe(validTenantId);
    expect(response.tenant.nombreNegocio).toBe('Financiera Real');
  });

  test('Login con usuario inactivo debe ser rechazado', async () => {
    await expect(
      authService.login({
        email: 'inactivo@empresa.com',
        password: realPassword,
      }),
    ).rejects.toThrow('Credenciales inválidas');
  });

  test('Login con email inexistente debe ser rechazado', async () => {
    await expect(
      authService.login({
        email: 'noexiste@empresa.com',
        password: realPassword,
      }),
    ).rejects.toThrow('Credenciales inválidas');
  });

  test('Registro de nuevo negocio crea tenant, usuario admin y producto por defecto', async () => {
    // Sobrescribir buscarCredencialesLogin para devolver el usuario recién creado
    mockPrisma.buscarCredencialesLogin = async (email: string) => {
      if (email === 'nuevo-admin@empresa.com') {
        return {
          id: 'new-user-uuid-5678',
          tenantId: 'new-tenant-uuid-1234',
          nombre: 'Nuevo Admin',
          email: 'nuevo-admin@empresa.com',
          rol: 'ADMIN',
          passwordHash: realPasswordHash,
          activo: true,
        };
      }
      return null;
    };

    const result = await authService.registrarNegocio(
      'Mi Nueva Financiera',
      'Nuevo Admin',
      'nuevo-admin@empresa.com',
      realPassword,
      'COP',
      'Colombia',
    );

    expect(result).toBeDefined();
    expect(result.accessToken).toBe('mock_jwt_token_new-user-uuid-5678');
  });

  test('Registro de negocio rechaza email duplicado', async () => {
    await expect(
      authService.registrarNegocio(
        'Otra Empresa',
        'Admin Duplicado',
        'existente@empresa.com',
        realPassword,
      ),
    ).rejects.toThrow('El correo ya está registrado');
  });
});
