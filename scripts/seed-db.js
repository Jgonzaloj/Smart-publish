const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function seed() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('Conectado a PostgreSQL para inicializar datos...');

    const tenantId = 'e025b394-4d1a-4d43-85f8-9a3b6e82845c';

    // 1. Crear Tenant si no existe
    let tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          id: tenantId,
          nombreNegocio: 'CrediYa Microfinanzas',
          plan: 'premium',
          activo: true,
        },
      });
      console.log('Tenant creado:', tenant.nombreNegocio);
    } else {
      console.log('Tenant ya existe:', tenant.nombreNegocio);
    }

    // Passwords hasheadas con bcrypt (cost 10)
    // admin123 => $2b$10$xntpFpn.XQS/i3JT10M0FOdRzVyB/yTsaXpBULL/WUyhG/2lXVe9C
    // 1234     => $2b$10$O.rQUizk8BCqI7FitwFsFe4IWjnu03BH/G0VrjTsv2PLlFHan3CgC

    // 2. Crear Administrador
    const adminEmail = 'admin@crediya.com';
    let admin = await prisma.usuario.findFirst({ where: { email: adminEmail } });
    if (!admin) {
      admin = await prisma.usuario.create({
        data: {
          id: 'u-admin-001',
          tenantId: tenantId,
          nombre: 'Juan Pérez (Administrador)',
          rol: 'ADMIN',
          email: adminEmail,
          telefono: '3001002030',
          passwordHash: '$2b$10$xntpFpn.XQS/i3JT10M0FOdRzVyB/yTsaXpBULL/WUyhG/2lXVe9C',
          pinHash: '$2b$10$O.rQUizk8BCqI7FitwFsFe4IWjnu03BH/G0VrjTsv2PLlFHan3CgC',
          posicion: 'Oficina Central',
          activo: true,
        },
      });
      console.log('Usuario Administrador creado:', admin.email);
    } else {
      console.log('Usuario Administrador ya existe:', admin.email);
    }

    // 3. Crear Cobrador / Vendedor
    const cobradorEmail = 'carlos@crediya.com';
    let cobrador = await prisma.usuario.findFirst({ where: { email: cobradorEmail } });
    if (!cobrador) {
      cobrador = await prisma.usuario.create({
        data: {
          id: 'u-cobrador-001',
          tenantId: tenantId,
          nombre: 'Carlos Cobrador',
          rol: 'VENDEDOR',
          email: cobradorEmail,
          telefono: '3109876543',
          passwordHash: '$2b$10$11jWpjfDgW9zzFxZfxKZv.tTJ5wPY4pbEa0OtrAi1wltgwSM4a2DG',
          pinHash: '$2b$10$O.rQUizk8BCqI7FitwFsFe4IWjnu03BH/G0VrjTsv2PLlFHan3CgC',
          posicion: 'Ruta 1 - Centro',
          activo: true,
        },
      });
      console.log('Usuario Cobrador creado:', cobrador.email);
    } else {
      console.log('Usuario Cobrador ya existe:', cobrador.email);
    }

    // 4. Crear Producto de Crédito por defecto
    const prod = await prisma.productoCredito.findFirst({ where: { tenantId } });
    if (!prod) {
      await prisma.productoCredito.create({
        data: {
          tenantId,
          nombre: 'Crédito Diario / Semanal',
          interesDefault: 20.0,
          activo: true,
        },
      });
      console.log('Producto de crédito creado');
    }

    console.log('\n--- DATOS DE ACCESO LISTOS ---');
    console.log('Administrador: admin@crediya.com | Clave: admin123 | PIN: 1234');
    console.log('Cobrador:      carlos@crediya.com | Clave: admin123 | PIN: 1234');
    console.log('------------------------------\n');
  } catch (err) {
    console.error('Error inicializando base de datos:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
