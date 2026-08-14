"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Cargar variables de entorno (asumimos que se corre desde backend/)
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
async function alterDatabase() {
    const connection = await promise_1.default.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smart_publish'
    });
    try {
        console.log('Verificando si la columna ai_images_used existe...');
        // Ejecutar alter table
        await connection.query(`
            ALTER TABLE workspaces 
            ADD COLUMN ai_images_used INT DEFAULT 0 AFTER ai_credits_used;
        `);
        console.log('✅ Columna ai_images_used agregada exitosamente a la tabla workspaces.');
    }
    catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ La columna ai_images_used ya existe en la base de datos.');
        }
        else {
            console.error('❌ Error al alterar la tabla:', error);
        }
    }
    finally {
        await connection.end();
    }
}
alterDatabase();
