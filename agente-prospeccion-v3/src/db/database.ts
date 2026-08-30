import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  // Asegurar que exista el directorio storage y screenshots
  if (!fs.existsSync(config.STORAGE_PATH)) {
    fs.mkdirSync(config.STORAGE_PATH, { recursive: true });
  }
  if (!fs.existsSync(config.SCREENSHOTS_PATH)) {
    fs.mkdirSync(config.SCREENSHOTS_PATH, { recursive: true });
  }

  dbInstance = new Database(config.DB_PATH);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  // Inicializar esquema
  const schemaPath = path.resolve(process.cwd(), 'src', 'db', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    dbInstance.exec(schemaSql);
  }

  // Inicializar dominio de salud por defecto si no existe
  const existingDomain = dbInstance.prepare('SELECT id FROM domain_health LIMIT 1').get();
  if (!existingDomain) {
    dbInstance.prepare(`
      INSERT INTO domain_health (id, domain, bounce_rate_24h, spam_complaints, circuit_breaker_active)
      VALUES ('dh_default', 'auditoria.tudominio.com', 0.0, 0, 0)
    `).run();
  }

  return dbInstance;
}
