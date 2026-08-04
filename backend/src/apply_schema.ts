import { pool } from './config/database';

async function apply() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS campaigns (
                id VARCHAR(36) PRIMARY KEY,
                workspace_id VARCHAR(36) NOT NULL,
                social_account_id VARCHAR(36) NOT NULL,
                topic VARCHAR(255) NOT NULL,
                frequency_cron VARCHAR(50) NOT NULL,
                status ENUM('ACTIVE', 'PAUSED', 'COMPLETED') DEFAULT 'ACTIVE',
                last_run_at TIMESTAMP NULL,
                next_run_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
                FOREIGN KEY (social_account_id) REFERENCES social_accounts(id) ON DELETE CASCADE
            );
        `);
        console.log("Table 'campaigns' created successfully.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
apply();
