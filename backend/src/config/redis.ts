import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de conexión a Redis
export const redisConnection = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
});

redisConnection.on('connect', () => {
    console.log('✅ Conectado a Redis exitosamente.');
});

redisConnection.on('error', (err) => {
    console.error('❌ Error de conexión a Redis:', err);
});
