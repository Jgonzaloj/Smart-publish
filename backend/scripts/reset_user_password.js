const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function resetPassword() {
  const email = process.argv[2] || 'jpilco@gmail.com';
  const newPassword = process.argv[3] || '12345678';

  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'smart_publish';

  try {
    const conn = await mysql.createConnection({ host, user, password, database });
    
    // Buscar usuario
    const [rows] = await conn.query('SELECT id, email FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      console.log(`❌ No se encontró usuario con el correo: ${email}`);
      console.log('Usuarios existentes en la base de datos:');
      const [allUsers] = await conn.query('SELECT id, email, role FROM users');
      console.table(allUsers);
      await conn.end();
      return;
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await conn.query('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);
    
    console.log(`✅ Contraseña restablecida exitosamente para: ${email}`);
    console.log(`🔑 Nueva contraseña: ${newPassword}`);
    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

resetPassword();
