"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDatabaseConnection = exports.pool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (process.env.NODE_ENV === 'production' && (!process.env.DB_USER || !process.env.DB_PASSWORD)) {
    console.error('FATAL SECURITY ERROR: DB_USER y DB_PASSWORD deben estar explícitamente configurados en entorno de producción.');
    process.exit(1);
}
const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'smart_publish';
// Configuración del Pool de Conexiones a la Base de Datos
exports.pool = promise_1.default.createPool({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});
// Función para testear la conexión e inicializar la DB de forma robusta
const testDatabaseConnection = async () => {
    let retries = 5;
    while (retries > 0) {
        try {
            // 1. Intentar conectar sin base de datos específica para crearla si no existe
            const initConnection = await promise_1.default.createConnection({
                host: dbHost,
                user: dbUser,
                password: dbPassword
            });
            await initConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
            await initConnection.end();
            // 2. Probar la conexión al pool con la base de datos ya asegurada
            const connection = await exports.pool.getConnection();
            console.log('✅ Conexión a la base de datos MySQL establecida correctamente.');
            connection.release();
            return; // Éxito, salir del bucle
        }
        catch (error) {
            console.error(`❌ Error al conectar con MySQL. Reintentos restantes: ${retries - 1}. Detalles:`, error.message);
            retries -= 1;
            if (retries === 0) {
                console.error('❌ No se pudo conectar a la base de datos tras múltiples intentos.');
                process.exit(1); // Detener la app solo si fallan todos los reintentos
            }
            // Esperar 3 segundos antes del próximo reintento (backoff)
            await new Promise(res => setTimeout(res, 3000));
        }
    }
};
exports.testDatabaseConnection = testDatabaseConnection;
