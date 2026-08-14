import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno (asumimos que se corre desde backend/)
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function alterDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smart_publish'
    });

    try {
        console.log('Verificando si la columna ai_images_used existe...');
        
        // Ejecutar alter table
        await connection.query(`
            ALTER TABLE workspaces 
            ADD COLUMN ai_images_used INT DEFAULT 0 AFTER ai_credits_used;
        `);
        
        console.log('✅ Columna ai_images_used agregada exitosamente a la tabla workspaces.');
    } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ La columna ai_images_used ya existe en la base de datos.');
        } else {
            console.error('❌ Error al alterar la tabla:', error);
        }
    } finally {
        await connection.end();
    }
}

alterDatabase();
