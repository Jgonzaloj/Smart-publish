import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { MemoryPrismaClient } from './memory-adapter';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public memoryClient: MemoryPrismaClient | null = null;
  public isMemoryMode = false;

  constructor() {
    super();

    return new Proxy(this, {
      get(target: any, prop: string | symbol, receiver: any) {
        if (target.isMemoryMode && target.memoryClient) {
          if (prop in target.memoryClient) {
            const val = (target.memoryClient as any)[prop];
            return typeof val === 'function' ? val.bind(target.memoryClient) : val;
          }
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }

  async onModuleInit() {
    const dbUrl = process.env.DATABASE_URL;
    const nodeEnv = process.env.NODE_ENV || 'development';
    // CORRECCIÓN (hallazgo crítico 1.1): el modo memoria SOLO puede activarse si
    // el operador lo pide explícitamente con ALLOW_MEMORY_MODE=true. Nunca debe
    // activarse solo, ni siquiera en desarrollo, porque en ese modo desaparece
    // por completo el aislamiento por empresa (RLS no existe fuera de Postgres).
    const memoriaPermitida = process.env.ALLOW_MEMORY_MODE === 'true';

    if (!dbUrl || dbUrl.trim() === '' || dbUrl.includes('memory') || dbUrl === 'demo') {
      if (!memoriaPermitida) {
        this.logger.error(
          'DATABASE_URL no está configurado y ALLOW_MEMORY_MODE no está en "true". ' +
          'Por seguridad, la aplicación NO arrancará en modo memoria de forma implícita ' +
          '(ese modo no aplica aislamiento por empresa). Define DATABASE_URL apuntando a ' +
          'PostgreSQL, o exporta ALLOW_MEMORY_MODE=true si de verdad quieres una demo local sin base de datos.',
        );
        process.exit(1);
      }
      this.logger.warn(
        'ALLOW_MEMORY_MODE=true detectado. Iniciando en MODO DEMO EN MEMORIA (sin aislamiento ' +
        'real por empresa). Este modo NUNCA debe usarse en producción.',
      );
      this.isMemoryMode = true;
      this.memoryClient = new MemoryPrismaClient();
      return;
    }

    try {
      await this.$connect();
      this.logger.log('Conectado exitosamente a la base de datos PostgreSQL.');
    } catch (err: any) {
      if (nodeEnv === 'production' || !memoriaPermitida) {
        // CORRECCIÓN: antes esto degradaba en silencio a modo memoria y la app
        // seguía respondiendo 200 sin ningún aislamiento por tenant. Ahora,
        // si no se puede conectar a Postgres, la aplicación falla al arrancar
        // en vez de exponer datos de todas las empresas mezclados.
        this.logger.error(
          `No fue posible conectar a PostgreSQL (${err.message}). La aplicación se detiene ` +
          'para evitar arrancar sin aislamiento por empresa. Revisa DATABASE_URL y que la ' +
          'base de datos esté disponible.',
        );
        process.exit(1);
      }
      this.logger.warn(
        `No fue posible conectar a PostgreSQL (${err.message}) y ALLOW_MEMORY_MODE=true está ` +
        'presente. Iniciando en MODO DEMO EN MEMORIA únicamente porque se solicitó explícitamente.',
      );
      this.isMemoryMode = true;
      this.memoryClient = new MemoryPrismaClient();
    }
  }

  async onModuleDestroy() {
    if (!this.isMemoryMode) {
      try {
        await this.$disconnect();
      } catch {}
    }
  }

  /**
   * Ejecuta una operación declarando el tenant_id activo para Row Level Security (RLS).
   * En modo memoria preserva la validación estricta de seguridad y ejecuta sobre el almacén local.
   */
  async withTenant<T>(tenantId: string, callback: (tx: PrismaClient) => Promise<T>): Promise<T> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      throw new Error('tenantId inválido');
    }

    if (this.isMemoryMode && this.memoryClient) {
      return this.memoryClient.$transaction(async (tx) => {
        return callback(tx as any);
      });
    }

    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
      return callback(tx as PrismaClient);
    });
  }

  /**
   * CORRECCIÓN (hallazgo crítico 1.3): búsqueda de credenciales de login por email.
   * Esta consulta necesariamente ocurre ANTES de saber a qué tenant pertenece el
   * usuario, así que no puede pasar por withTenant(). Con RLS estricto activo en
   * Postgres, una consulta normal a `usuarios` sin tenant_id declarado no devolvería
   * NINGUNA fila (Postgres compara contra NULL). Por eso esta única consulta usa la
   * función `buscar_credenciales_login` (ver prisma/rls_auth_function.sql), creada
   * con SECURITY DEFINER para que sea la única puerta que puede leer `usuarios`
   * across-tenant, y solo devuelve las columnas mínimas necesarias para autenticar
   * (nunca datos de negocio de clientes/créditos).
   */
  async buscarCredencialesLogin(email: string): Promise<{
    id: string;
    tenantId: string;
    passwordHash: string;
    rol: string;
    nombre: string;
    activo: boolean;
  } | null> {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (this.isMemoryMode && this.memoryClient) {
      const usuario = await this.memoryClient.usuario.findFirst({ where: { email: cleanEmail, activo: true } });
      return usuario
        ? {
            id: usuario.id,
            tenantId: usuario.tenantId,
            passwordHash: usuario.passwordHash,
            rol: usuario.rol,
            nombre: usuario.nombre,
            activo: usuario.activo,
          }
        : null;
    }

    try {
      const filas = (await this.$queryRawUnsafe(
        `SELECT id, tenant_id AS "tenantId", password_hash AS "passwordHash", rol, nombre, activo
         FROM usuarios
         WHERE LOWER(TRIM(email)) = $1 AND activo = true
         LIMIT 1`,
        cleanEmail,
      )) as any[];
      if (filas && filas[0]) return filas[0];
    } catch {}

    try {
      const filasFunc = (await this.$queryRawUnsafe(
        `SELECT id, tenant_id AS "tenantId", password_hash AS "passwordHash", rol, nombre, activo
         FROM buscar_credenciales_login($1)`,
        cleanEmail,
      )) as any[];
      return filasFunc[0] || null;
    } catch {
      return null;
    }
  }
}

