"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnection = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const isTest = process.env.NODE_ENV === 'test';
// Configuración de conexión a Redis
exports.redisConnection = new ioredis_1.default({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
    lazyConnect: isTest,
    enableOfflineQueue: !isTest,
    retryStrategy: isTest ? () => null : undefined
});
exports.redisConnection.on('connect', () => {
    console.log('✅ Conectado a Redis exitosamente.');
});
exports.redisConnection.on('error', (err) => {
    if (!isTest) {
        console.error('❌ Error de conexión a Redis:', err);
    }
});
