"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationRepository = void 0;
const database_1 = require("../config/database");
const crypto_1 = __importDefault(require("crypto"));
class ConversationRepository {
    /**
     * Obtiene los últimos N mensajes de la conversación
     */
    async getHistory(workspaceId, clientPhone, limit = 5) {
        try {
            // Aseguramos que la tabla exista (en un entorno real usaríamos migraciones)
            await this.ensureTableExists();
            const [rows] = await database_1.pool.query(`SELECT * FROM conversations 
                 WHERE workspace_id = ? AND client_phone = ? 
                 ORDER BY created_at ASC 
                 LIMIT ?`, [workspaceId, clientPhone, limit]);
            return rows;
        }
        catch (error) {
            console.error('[ConversationRepository] Error al obtener historial', error);
            return []; // Fallback gracefully a no-history si falla la BD
        }
    }
    /**
     * Guarda un nuevo mensaje
     */
    async saveMessage(workspaceId, clientPhone, role, content) {
        try {
            await this.ensureTableExists();
            const id = crypto_1.default.randomUUID();
            await database_1.pool.query(`INSERT INTO conversations (id, workspace_id, client_phone, role, content) 
                 VALUES (?, ?, ?, ?, ?)`, [id, workspaceId, clientPhone, role, content]);
        }
        catch (error) {
            console.error('[ConversationRepository] Error al guardar mensaje', error);
        }
    }
    // Helper MVP para no requerir migraciones complejas inmediatas
    async ensureTableExists() {
        await database_1.pool.query(`
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
exports.ConversationRepository = ConversationRepository;
