"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const memory_adapter_1 = require("./memory-adapter");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor() {
        super();
        this.logger = new common_1.Logger(PrismaService_1.name);
        this.memoryClient = null;
        this.isMemoryMode = false;
        return new Proxy(this, {
            get(target, prop, receiver) {
                if (target.isMemoryMode && target.memoryClient) {
                    if (prop in target.memoryClient) {
                        const val = target.memoryClient[prop];
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
        const memoriaPermitida = process.env.ALLOW_MEMORY_MODE === 'true';
        if (!dbUrl || dbUrl.trim() === '' || dbUrl.includes('memory') || dbUrl === 'demo') {
            if (!memoriaPermitida) {
                this.logger.error('DATABASE_URL no está configurado y ALLOW_MEMORY_MODE no está en "true". ' +
                    'Por seguridad, la aplicación NO arrancará en modo memoria de forma implícita ' +
                    '(ese modo no aplica aislamiento por empresa). Define DATABASE_URL apuntando a ' +
                    'PostgreSQL, o exporta ALLOW_MEMORY_MODE=true si de verdad quieres una demo local sin base de datos.');
                process.exit(1);
            }
            this.logger.warn('ALLOW_MEMORY_MODE=true detectado. Iniciando en MODO DEMO EN MEMORIA (sin aislamiento ' +
                'real por empresa). Este modo NUNCA debe usarse en producción.');
            this.isMemoryMode = true;
            this.memoryClient = new memory_adapter_1.MemoryPrismaClient();
            return;
        }
        try {
            await this.$connect();
            this.logger.log('Conectado exitosamente a la base de datos PostgreSQL.');
        }
        catch (err) {
            if (nodeEnv === 'production' || !memoriaPermitida) {
                this.logger.error(`No fue posible conectar a PostgreSQL (${err.message}). La aplicación se detiene ` +
                    'para evitar arrancar sin aislamiento por empresa. Revisa DATABASE_URL y que la ' +
                    'base de datos esté disponible.');
                process.exit(1);
            }
            this.logger.warn(`No fue posible conectar a PostgreSQL (${err.message}) y ALLOW_MEMORY_MODE=true está ` +
                'presente. Iniciando en MODO DEMO EN MEMORIA únicamente porque se solicitó explícitamente.');
            this.isMemoryMode = true;
            this.memoryClient = new memory_adapter_1.MemoryPrismaClient();
        }
    }
    async onModuleDestroy() {
        if (!this.isMemoryMode) {
            try {
                await this.$disconnect();
            }
            catch { }
        }
    }
    async withTenant(tenantId, callback) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(tenantId)) {
            throw new Error('tenantId inválido');
        }
        if (this.isMemoryMode && this.memoryClient) {
            return this.memoryClient.$transaction(async (tx) => {
                return callback(tx);
            });
        }
        return this.$transaction(async (tx) => {
            await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
            return callback(tx);
        });
    }
    async buscarCredencialesLogin(email) {
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
            const filas = (await this.$queryRawUnsafe(`SELECT id, tenant_id AS "tenantId", password_hash AS "passwordHash", rol, nombre, activo
           FROM usuarios
           WHERE LOWER(TRIM(email)) = $1 AND activo = true
           LIMIT 1`, cleanEmail));
            if (filas && filas[0]) return filas[0];
        } catch {}
        try {
            const filasFunc = (await this.$queryRawUnsafe(`SELECT id, tenant_id AS "tenantId", password_hash AS "passwordHash", rol, nombre, activo
           FROM buscar_credenciales_login($1)`, cleanEmail));
            return filasFunc[0] || null;
        } catch {
            return null;
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map