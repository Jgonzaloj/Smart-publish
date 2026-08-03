import { pool } from '../config/database';

async function alterTable() {
    console.log('🔄 Agregando bullmq_job_id a posts...');
    try {
        await pool.query(`
            ALTER TABLE posts 
            ADD COLUMN bullmq_job_id VARCHAR(255) NULL AFTER status
        `);
        console.log('✅ Alteración completada exitosamente.');
    } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ La columna bullmq_job_id ya existe.');
        } else {
            console.error('❌ Error alterando la tabla:', error);
        }
    } finally {
        process.exit(0);
    }
}

alterTable();
