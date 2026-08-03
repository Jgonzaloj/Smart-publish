import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';

async function migrate() {
    console.log('🔄 Iniciando migración de la base de datos...');
    try {
        const schemaPath = path.join(__dirname, '../config/schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf-8');
        
        // Ejecutar las sentencias SQL una por una
        const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
        
        for (const statement of statements) {
            if (statement.trim()) {
                await pool.query(statement);
            }
        }
        
        console.log('✅ Migración completada exitosamente.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error ejecutando la migración:', error);
        process.exit(1);
    }
}

migrate();
