const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

/**
 * Ejecuta un archivo SQL de políticas contra Postgres, sentencia por sentencia.
 * CORRECCIÓN (hallazgo crítico 1.4): antes, cualquier error en cualquier
 * sentencia se registraba como una simple "nota" y el script terminaba con
 * código de salida 0 (éxito) igual. Un pipeline de CI/CD interpretaba el
 * despliegue como exitoso aunque el RLS nunca se hubiera aplicado.
 *
 * Ahora: los errores esperables ("ya existe", por reintentar un despliegue)
 * se registran como información y se continúa. Cualquier otro error se
 * considera fatal: se imprime como ERROR y el proceso termina con código 1,
 * para que el pipeline de despliegue falle de forma visible.
 */
async function ejecutarArchivoSql(prisma, sqlPath, etiqueta) {
  if (!fs.existsSync(sqlPath)) {
    console.error(`ERROR FATAL: no se encontró el archivo de políticas "${etiqueta}" en ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf-8');

  // Separador de sentencias SQL respetando bloques de funciones ($$ ... $$)
  const statements = [];
  let current = '';
  let inDollarQuote = false;

  const lines = sql.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) continue;

    // Detectar si la línea abre o cierra un bloque $$
    const dollarMatches = (line.match(/\$\$/g) || []).length;
    if (dollarMatches % 2 !== 0) {
      inDollarQuote = !inDollarQuote;
    }

    current += line + '\n';

    if (!inDollarQuote && trimmed.endsWith(';')) {
      const cleanStmt = current.trim();
      if (cleanStmt.length > 0) {
        statements.push(cleanStmt);
      }
      current = '';
    }
  }

  if (current.trim().length > 0) {
    statements.push(current.trim());
  }

  let huboErrorFatal = false;

  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch (err) {
      const mensajeIndicaExistente = /already exists|ya existe/i.test(err.message || '');

      if (mensajeIndicaExistente) {
        console.log(`(omitido, ya existía) ${stmt.slice(0, 80)}...`);
        continue;
      }

      console.error(`ERROR FATAL ejecutando "${etiqueta}" en la sentencia:\n${stmt}\n`, err.message);
      huboErrorFatal = true;
      break;
    }
  }

  return !huboErrorFatal;
}

async function applyRls() {
  const dbUrl = process.env.DATABASE_URL;
  const memoriaPermitida = process.env.ALLOW_MEMORY_MODE === 'true';

  if (!dbUrl || dbUrl.trim() === '' || dbUrl.includes('memory') || dbUrl === 'demo') {
    if (!memoriaPermitida) {
      console.error(
        'ERROR FATAL: DATABASE_URL no está configurado y ALLOW_MEMORY_MODE no es "true". ' +
        'No se puede aplicar RLS sin una base de datos PostgreSQL real. Define DATABASE_URL.',
      );
      process.exit(1);
    }
    console.log('ALLOW_MEMORY_MODE=true: modo demo en memoria activo intencionalmente. Se omite RLS.');
    return;
  }

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('Conectado a PostgreSQL. Aplicando políticas de seguridad RLS...');

    const okPoliticas = await ejecutarArchivoSql(
      prisma,
      path.join(__dirname, '..', 'prisma', 'rls_policies.sql'),
      'rls_policies.sql',
    );

    const okFuncionLogin = await ejecutarArchivoSql(
      prisma,
      path.join(__dirname, '..', 'prisma', 'rls_auth_function.sql'),
      'rls_auth_function.sql',
    );

    if (!okPoliticas || !okFuncionLogin) {
      console.error('ERROR FATAL: la aplicación de políticas RLS terminó con errores. Abortando despliegue.');
      process.exit(1);
    }

    console.log('Políticas de seguridad Row Level Security (RLS) y función de login aplicadas exitosamente.');
  } catch (err) {
    console.error('ERROR FATAL al conectar o aplicar RLS:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyRls();
