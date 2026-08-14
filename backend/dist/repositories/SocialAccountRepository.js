"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialAccountRepository = void 0;
const database_1 = require("../config/database");
class SocialAccountRepository {
    async findByPlatformAndAccountId(platform, accountId) {
        const [rows] = await database_1.pool.query('SELECT * FROM social_accounts WHERE platform = ? AND platform_account_id = ? LIMIT 1', [platform, accountId]);
        return rows.length > 0 ? rows[0] : null;
    }
    async findById(id) {
        const [rows] = await database_1.pool.query('SELECT * FROM social_accounts WHERE id = ? LIMIT 1', [id]);
        return rows.length > 0 ? rows[0] : null;
    }
    async findActiveByPlatform(platform) {
        const [rows] = await database_1.pool.query('SELECT * FROM social_accounts WHERE platform = ? AND status = ?', [platform, 'ACTIVE']);
        return rows;
    }
    async findByWorkspace(workspaceId) {
        const [rows] = await database_1.pool.query('SELECT * FROM social_accounts WHERE workspace_id = ?', [workspaceId]);
        return rows;
    }
    async createOrUpdate(account) {
        // Upsert logic (Insert or Update on Duplicate Key)
        // Since we are using standard UUIDs, if we want to prevent duplicate accounts for the same platform_account_id
        // we should probably delete the old one or just update it.
        const existing = await this.findByPlatformAndAccountId(account.platform, account.platform_account_id);
        if (existing) {
            await database_1.pool.query(`UPDATE social_accounts 
                 SET access_token = ?, refresh_token = ?, token_expires_at = ?, status = 'ACTIVE', account_name = ?
                 WHERE id = ?`, [account.access_token, account.refresh_token, account.token_expires_at, account.account_name, existing.id]);
        }
        else {
            await database_1.pool.query(`INSERT INTO social_accounts 
                (id, workspace_id, platform, platform_account_id, account_name, access_token, refresh_token, token_expires_at, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                account.id,
                account.workspace_id,
                account.platform,
                account.platform_account_id,
                account.account_name,
                account.access_token,
                account.refresh_token,
                account.token_expires_at,
                account.status || 'ACTIVE'
            ]);
        }
    }
    async deleteByPlatformAndAccountId(platform, accountId) {
        await database_1.pool.query('DELETE FROM social_accounts WHERE platform = ? AND platform_account_id = ?', [platform, accountId]);
    }
}
exports.SocialAccountRepository = SocialAccountRepository;
