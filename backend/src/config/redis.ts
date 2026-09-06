import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

// Configuración de conexión a Redis
export const redisConnection = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
    lazyConnect: isTest,
    enableOfflineQueue: !isTest,
    retryStrategy: isTest ? () => null : undefined
});

redisConnection.on('connect', () => {
    console.log('✅ Conectado a Redis exitosamente.');
});

redisConnection.on('error', (err) => {
    if (!isTest) {
        console.error('❌ Error de conexión a Redis:', err);
    }
});
