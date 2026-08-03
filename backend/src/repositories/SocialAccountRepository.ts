import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface SocialAccount {
    id: string;
    workspace_id: string;
    platform: 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK';
    account_name: string;
    platform_account_id: string;
    access_token: string;
    refresh_token?: string;
    token_expires_at?: Date;
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export class SocialAccountRepository {
    async findByPlatformAndAccountId(platform: string, accountId: string): Promise<SocialAccount | null> {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM social_accounts WHERE platform = ? AND platform_account_id = ? LIMIT 1',
            [platform, accountId]
        );
        return rows.length > 0 ? (rows[0] as SocialAccount) : null;
    }

    async findActiveByPlatform(platform: string): Promise<SocialAccount[]> {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM social_accounts WHERE platform = ? AND status = ?',
            [platform, 'ACTIVE']
        );
        return rows as SocialAccount[];
    }

    async createOrUpdate(account: Partial<SocialAccount>): Promise<void> {
        // Upsert logic (Insert or Update on Duplicate Key)
        // Since we are using standard UUIDs, if we want to prevent duplicate accounts for the same platform_account_id
        // we should probably delete the old one or just update it.
        const existing = await this.findByPlatformAndAccountId(account.platform!, account.platform_account_id!);
        
        if (existing) {
            await pool.query(
                `UPDATE social_accounts 
                 SET access_token = ?, refresh_token = ?, token_expires_at = ?, status = 'ACTIVE', account_name = ?
                 WHERE id = ?`,
                [account.access_token, account.refresh_token, account.token_expires_at, account.account_name, existing.id]
            );
        } else {
            await pool.query(
                `INSERT INTO social_accounts 
                (id, workspace_id, platform, platform_account_id, account_name, access_token, refresh_token, token_expires_at, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    account.id, 
                    account.workspace_id, 
                    account.platform, 
                    account.platform_account_id, 
                    account.account_name, 
                    account.access_token, 
                    account.refresh_token,
                    account.token_expires_at,
                    account.status || 'ACTIVE'
                ]
            );
        }
    }

    async deleteByPlatformAndAccountId(platform: string, accountId: string): Promise<void> {
        await pool.query('DELETE FROM social_accounts WHERE platform = ? AND platform_account_id = ?', [platform, accountId]);
    }
}
