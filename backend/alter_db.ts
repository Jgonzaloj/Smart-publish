import { pool } from './src/config/database';

async function alterDb() {
    try {
        await pool.query('ALTER TABLE posts ADD COLUMN media_url VARCHAR(255) NULL;');
        console.log('Tabla posts alterada con éxito (media_url)');
    } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('La columna media_url ya existe.');
        } else {
            console.error('Error alterando DB:', error);
        }
    } finally {
        process.exit(0);
    }
}

alterDb();
