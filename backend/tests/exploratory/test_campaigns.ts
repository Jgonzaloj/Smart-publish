import { pool } from './src/config/database';

async function test() {
    try {
        const [rows] = await pool.query('SELECT 1 FROM campaigns LIMIT 1');
        console.log('Campaigns table exists!');
    } catch (e) {
        console.error('Database Error:', e);
    }
    process.exit();
}
test();
