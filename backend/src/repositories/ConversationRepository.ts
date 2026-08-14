import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import crypto from 'crypto';

export interface MessageRecord {
    id: string;
    workspace_id: string;
    client_phone: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: Date;
}

export class ConversationRepository {
    
    /**
     * Obtiene los últimos N mensajes de la conversación
     */
    async getHistory(workspaceId: string, clientPhone: string, limit: number = 5): Promise<MessageRecord[]> {
        try {
            // Aseguramos que la tabla exista (en un entorno real usaríamos migraciones)
            await this.ensureTableExists();

            const [rows] = await pool.query<RowDataPacket[]>(
                `SELECT * FROM conversations 
                 WHERE workspace_id = ? AND client_phone = ? 
                 ORDER BY created_at ASC 
                 LIMIT ?`,
                [workspaceId, clientPhone, limit]
            );

            return rows as MessageRecord[];
        } catch (error) {
            console.error('[ConversationRepository] Error al obtener historial', error);
            return []; // Fallback gracefully a no-history si falla la BD
        }
    }

    /**
     * Guarda un nuevo mensaje
     */
    async saveMessage(workspaceId: string, clientPhone: string, role: 'user' | 'assistant', content: string): Promise<void> {
        try {
            await this.ensureTableExists();
            
            const id = crypto.randomUUID();
            await pool.query<ResultSetHeader>(
                `INSERT INTO conversations (id, workspace_id, client_phone, role, content) 
                 VALUES (?, ?, ?, ?, ?)`,
                [id, workspaceId, clientPhone, role, content]
            );
        } catch (error) {
            console.error('[ConversationRepository] Error al guardar mensaje', error);
        }
    }

    // Helper MVP para no requerir migraciones complejas inmediatas
    private async ensureTableExists() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS conversations (
                id VARCHAR(36) PRIMARY KEY,
                workspace_id VARCHAR(36) NOT NULL,
                client_phone VARCHAR(20) NOT NULL,
                role ENUM('user', 'assistant') NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_conversation (workspace_id, client_phone)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
    }
}
