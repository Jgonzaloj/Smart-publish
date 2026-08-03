import { redisConnection } from '../config/redis';

export class CacheService {
    /**
     * Guarda un valor en caché
     * @param key Clave única
     * @param value Objeto a guardar (se convertirá a JSON)
     * @param ttlSeconds Tiempo de vida en segundos
     */
    static async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
        try {
            await redisConnection.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } catch (error) {
            console.error(`[CacheService] Error seteando caché para ${key}:`, error);
        }
    }

    /**
     * Recupera un valor del caché
     * @param key Clave única
     */
    static async get<T>(key: string): Promise<T | null> {
        try {
            const data = await redisConnection.get(key);
            if (!data) return null;
            return JSON.parse(data) as T;
        } catch (error) {
            console.error(`[CacheService] Error leyendo caché para ${key}:`, error);
            return null;
        }
    }

    /**
     * Invalida (borra) una clave del caché
     */
    static async invalidate(key: string): Promise<void> {
        try {
            await redisConnection.del(key);
        } catch (error) {
            console.error(`[CacheService] Error invalidando caché para ${key}:`, error);
        }
    }
}
