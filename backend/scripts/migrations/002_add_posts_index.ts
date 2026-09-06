import { pool } from '../../src/config/database';

async function addPostsCompositeIndex() {
    try {
        console.log('Verificando índice idx_workspace_status en tabla posts...');
        // Comprobar si el índice ya existe
        const [rows]: any = await pool.query(`
            SHOW INDEX FROM posts WHERE Key_name = 'idx_workspace_status';
        `);

        if (rows && rows.length > 0) {
            console.log('✅ El índice idx_workspace_status ya existe en la tabla posts.');
        } else {
            await pool.query('ALTER TABLE posts ADD INDEX idx_workspace_status (workspace_id, status);');
            console.log('✅ Índice compuesto idx_workspace_status (workspace_id, status) agregado con éxito.');
        }
    } catch (error: any) {
        if (error.code === 'ER_DUP_KEYNAME') {
            console.log('El índice idx_workspace_status ya existía.');
        } else {
            console.error('❌ Error agregando índice a la base de datos:', error);
            process.exit(1);
        }
    } finally {
        process.exit(0);
    }
}

addPostsCompositeIndex();
