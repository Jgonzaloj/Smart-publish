const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function initDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'smart_publish';

  console.log(`[Init DB] Conectando a MySQL en ${host} con usuario "${user}"...`);

  let rootConn;
  try {
    // 1. Conectar al servidor para asegurar que la base de datos exista
    rootConn = await mysql.createConnection({ host, user, password });
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`[Init DB] Base de datos "${database}" asegurada.`);
    await rootConn.end();
  } catch (err) {
    console.error(`[Init DB] Error conectando a MySQL: ${err.message}`);
    process.exit(1);
  }

  // 2. Conectar a la base de datos específica
  const dbConn = await mysql.createConnection({ host, user, password, database, multipleStatements: true });

  try {
    // 3. Leer schema.sql y ejecutar
    const schemaPath = path.resolve(__dirname, '../src/config/schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log(`[Init DB] Aplicando esquema desde ${schemaPath}...`);
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      // Separar por punto y coma para ejecutar cada sentencia limpiamente
      const statements = schemaSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          await dbConn.query(statement);
        } catch (stmtErr) {
          // Ignorar advertencias si la tabla ya existe
          if (!stmtErr.message.includes('already exists')) {
            console.warn(`[Init DB] Nota en sentencia: ${stmtErr.message}`);
          }
        }
      }
      console.log(`[Init DB] ✅ Todas las tablas de schema.sql han sido creadas/verificadas con éxito.`);
    }

    // 4. Asegurar Workspace por defecto
    const [workspaces] = await dbConn.query('SELECT id FROM workspaces LIMIT 1');
    let defaultWorkspaceId;
    if (workspaces.length === 0) {
      defaultWorkspaceId = uuidv4();
      await dbConn.query(
        'INSERT INTO workspaces (id, name, plan_id, plan_status) VALUES (?, ?, ?, ?)',
        [defaultWorkspaceId, 'Workspace Principal', 'pro', 'active']
      );
      console.log(`[Init DB] ✅ Workspace por defecto creado: ${defaultWorkspaceId}`);
    } else {
      defaultWorkspaceId = workspaces[0].id;
    }

    // 5. Asegurar Usuario Administrador (jpilco@gmail.com / 12345678)
    const adminEmail = 'jpilco@gmail.com';
    const adminPass = '12345678';
    const [users] = await dbConn.query('SELECT id FROM users WHERE email = ?', [adminEmail]);

    const passwordHash = await bcrypt.hash(adminPass, 10);

    if (users.length === 0) {
      const adminId = uuidv4();
      await dbConn.query(
        'INSERT INTO users (id, workspace_id, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [adminId, defaultWorkspaceId, adminEmail, passwordHash, 'SUPERADMIN']
      );
      console.log(`[Init DB] ✅ Usuario SuperAdmin creado: ${adminEmail} (Contraseña: ${adminPass})`);
    } else {
      await dbConn.query(
        'UPDATE users SET password_hash = ?, role = ? WHERE email = ?',
        [passwordHash, 'SUPERADMIN', adminEmail]
      );
      console.log(`[Init DB] ✅ Usuario SuperAdmin actualizado: ${adminEmail} (Contraseña: ${adminPass})`);
    }

    console.log(`[Init DB] 🚀 Inicialización de Base de Datos completada al 100%.`);
  } catch (err) {
    console.error(`[Init DB] Error durante la inicialización:`, err);
  } finally {
    await dbConn.end();
  }
}

initDatabase();
