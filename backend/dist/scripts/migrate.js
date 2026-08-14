"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function migrate() {
    console.log('🔄 Iniciando migración de la base de datos...');
    try {
        const schemaPath = path_1.default.join(__dirname, '../config/schema.sql');
        const sql = fs_1.default.readFileSync(schemaPath, 'utf-8');
        // Ejecutar las sentencias SQL una por una
        const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
        for (const statement of statements) {
            if (statement.trim()) {
                await database_1.pool.query(statement);
            }
        }
        console.log('✅ Migración completada exitosamente.');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error ejecutando la migración:', error);
        process.exit(1);
    }
}
migrate();
