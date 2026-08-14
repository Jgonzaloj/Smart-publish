"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const redis_1 = require("../config/redis");
class CacheService {
    /**
     * Guarda un valor en caché
     * @param key Clave única
     * @param value Objeto a guardar (se convertirá a JSON)
     * @param ttlSeconds Tiempo de vida en segundos
     */
    static async set(key, value, ttlSeconds = 3600) {
        try {
            await redis_1.redisConnection.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        }
        catch (error) {
            console.error(`[CacheService] Error seteando caché para ${key}:`, error);
        }
    }
    /**
     * Recupera un valor del caché
     * @param key Clave única
     */
    static async get(key) {
        try {
            const data = await redis_1.redisConnection.get(key);
            if (!data)
                return null;
            return JSON.parse(data);
        }
        catch (error) {
            console.error(`[CacheService] Error leyendo caché para ${key}:`, error);
            return null;
        }
    }
    /**
     * Invalida (borra) una clave del caché
     */
    static async invalidate(key) {
        try {
            await redis_1.redisConnection.del(key);
        }
        catch (error) {
            console.error(`[CacheService] Error invalidando caché para ${key}:`, error);
        }
    }
}
exports.CacheService = CacheService;
