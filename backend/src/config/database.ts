import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración del Pool de Conexiones a la Base de Datos
export const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_publish',
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10, 
    idleTimeout: 60000, 
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Función para testear la conexión (útil al iniciar el servidor)
export const testDatabaseConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a la base de datos MySQL establecida correctamente.');
        connection.release();
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos MySQL:', error);
        process.exit(1); // Detener la app si no hay base de datos
    }
};
