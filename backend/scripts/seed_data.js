const mysql = require('mysql2/promise');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function seedData() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'smart_publish';
  const password = process.env.DB_PASSWORD || 'smart123';
  const database = process.env.DB_NAME || 'smart_publish';

  console.log(`[Seed Data] Conectando a ${database} en ${host}...`);

  let conn;
  try {
    conn = await mysql.createConnection({ host, user, password, database });
  } catch (err) {
    console.error(`[Seed Data] Error de conexión: ${err.message}`);
    process.exit(1);
  }

  try {
    // 1. Obtener workspace del usuario admin
    const [users] = await conn.query('SELECT id, workspace_id, email FROM users WHERE email = ?', ['jpilco@gmail.com']);
    if (users.length === 0) {
      console.error('[Seed Data] Error: Usuario jpilco@gmail.com no encontrado. Ejecuta primero init_database.js');
      await conn.end();
      process.exit(1);
    }

    const workspaceId = users[0].workspace_id;
    const userId = users[0].id;
    console.log(`[Seed Data] Poblando datos para Workspace: ${workspaceId} (Usuario: ${users[0].email})`);

    // 2. Limpiar datos previos del workspace para evitar duplicados en seed
    console.log('[Seed Data] Limpiando datos de demostración anteriores...');
    await conn.query('DELETE FROM customers WHERE workspace_id = ?', [workspaceId]);
    await conn.query('DELETE FROM service_categories WHERE workspace_id = ?', [workspaceId]);
    await conn.query('DELETE FROM quotes WHERE workspace_id = ?', [workspaceId]);
    await conn.query('DELETE FROM social_accounts WHERE workspace_id = ?', [workspaceId]);

    // 3. Insertar Clientes (Customers) y Prospectos (Leads)
    console.log('[Seed Data] Insertando clientes y pipeline CRM...');
    const customersData = [
      { name: 'Carlos Mendoza', phone: '+51 987 654 321', email: 'carlos@empresa.com', source: 'WHATSAPP', status: 'NEW', score: 85, value: 350, notes: 'Interesado en Plan Business para redes' },
      { name: 'Mariana López', phone: '+51 912 345 678', email: 'mariana@boutique.pe', source: 'INSTAGRAM', status: 'QUALIFIED', score: 92, value: 600, notes: 'Solicitó cotización de campaña Meta Ads' },
      { name: 'Tech Solutions SAC', phone: '+51 955 443 322', email: 'ventas@techsol.pe', source: 'WEB', status: 'QUOTED', score: 78, value: 1200, notes: 'Cotización QT-2026-001 enviada' },
      { name: 'Dr. Roberto Silva', phone: '+51 944 332 110', email: 'clinica@silva.com', source: 'WHATSAPP', status: 'WON', score: 99, value: 450, notes: 'Servicio activado formalmente' }
    ];

    const customerMap = {};

    for (const c of customersData) {
      const custId = uuidv4();
      const leadId = uuidv4();
      customerMap[c.name] = custId;

      await conn.query(
        'INSERT INTO customers (id, workspace_id, name, phone, email, source) VALUES (?, ?, ?, ?, ?, ?)',
        [custId, workspaceId, c.name, c.phone, c.email, c.source]
      );

      await conn.query(
        'INSERT INTO leads (id, workspace_id, customer_id, status, score, estimated_value, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [leadId, workspaceId, custId, c.status, c.score, c.value, c.notes]
      );
    }
    console.log('  -> 4 Clientes y 4 Leads insertados con éxito.');

    // 4. Insertar Categorías, Servicios y Tarifas
    console.log('[Seed Data] Insertando catálogo oficial y precios...');
    const catalogData = [
      { cat: 'Marketing', srv: 'Gestión Redes Sociales Pro', amount: 250.00, duration: 'Mensual', cond: 'Incluye 12 posts y 4 reels de alta calidad' },
      { cat: 'Publicidad Digital', srv: 'Campaña Meta & TikTok Ads', amount: 450.00, duration: 'Mensual', cond: 'Optimización de ROI, presupuesto de pauta no incluido' },
      { cat: 'Desarrollo Web', srv: 'Desarrollo Web Landing Page', amount: 350.00, duration: 'Único', cond: 'Entrega en 5 días hábiles con hosting por 1 año' },
      { cat: 'Automatización & IA', srv: 'Bot IA WhatsApp Automatizado', amount: 180.00, duration: 'Setup + Mensual', cond: 'Configuración personalizada con RAG y catálogo' }
    ];

    for (const item of catalogData) {
      const catId = uuidv4();
      const srvId = uuidv4();
      const priceId = uuidv4();

      await conn.query(
        'INSERT INTO service_categories (id, workspace_id, name) VALUES (?, ?, ?)',
        [catId, workspaceId, item.cat]
      );

      await conn.query(
        'INSERT INTO services (id, workspace_id, category_id, name, description) VALUES (?, ?, ?, ?, ?)',
        [srvId, workspaceId, catId, item.srv, item.cond]
      );

      await conn.query(
        'INSERT INTO prices (id, service_id, amount, currency, duration, conditions) VALUES (?, ?, ?, ?, ?, ?)',
        [priceId, srvId, item.amount, 'USD', item.duration, item.cond]
      );
    }
    console.log('  -> 4 Categorías y Servicios con precios creados.');

    // 5. Insertar Conversaciones y Mensajes de WhatsApp & Instagram
    console.log('[Seed Data] Insertando conversaciones y mensajes...');
    const conv1Id = uuidv4();
    await conn.query(
      'INSERT INTO conversations (id, workspace_id, customer_id, channel, status, last_message_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [conv1Id, workspaceId, customerMap['Carlos Mendoza'], 'WHATSAPP', 'AI_HANDLED']
    );
    const msgs1 = [
      { sender: 'CUSTOMER', text: 'Hola, buenos días. Quisiera información de sus servicios de gestión de redes.' },
      { sender: 'BOT', text: '¡Hola Carlos! Con gusto te ayudo. Ofrecemos gestión de redes, publicidad en Meta/TikTok y desarrollo de chatbots.' },
      { sender: 'CUSTOMER', text: '¿Cuánto cuesta el plan para 3 marcas?' },
      { sender: 'BOT', text: 'Para 3 marcas nuestro Plan Pro tiene un precio oficial de 450 USD/mes con descuento por paquete. ¿Te gustaría recibir la cotización formal?' }
    ];
    for (const m of msgs1) {
      await conn.query(
        'INSERT INTO messages (id, conversation_id, sender, message_text) VALUES (?, ?, ?, ?)',
        [uuidv4(), conv1Id, m.sender, m.text]
      );
    }

    const conv2Id = uuidv4();
    await conn.query(
      'INSERT INTO conversations (id, workspace_id, customer_id, channel, status, last_message_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [conv2Id, workspaceId, customerMap['Mariana López'], 'WHATSAPP', 'HUMAN_NEEDED']
    );
    const msgs2 = [
      { sender: 'CUSTOMER', text: 'Hola, ya vi la cotización QT-2026-002.' },
      { sender: 'BOT', text: 'Excelente Mariana, ¿tienes alguna duda específica sobre los ítems cotizados?' },
      { sender: 'CUSTOMER', text: 'Quisiera coordinar una reunión presencial con el director para firmar el contrato.' }
    ];
    for (const m of msgs2) {
      await conn.query(
        'INSERT INTO messages (id, conversation_id, sender, message_text) VALUES (?, ?, ?, ?)',
        [uuidv4(), conv2Id, m.sender, m.text]
      );
    }
    console.log('  -> Conversaciones y mensajes en vivo estructurados.');

    // 6. Insertar Cotizaciones (Quotes)
    console.log('[Seed Data] Insertando cotizaciones formales...');
    const quote1Id = uuidv4();
    await conn.query(
      'INSERT INTO quotes (id, workspace_id, customer_id, quote_number, total_amount, currency, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [quote1Id, workspaceId, customerMap['Tech Solutions SAC'], 'QT-2026-001', 1200.00, 'USD', 'SENT', 'Propuesta integral para transformación digital.']
    );
    await conn.query(
      'INSERT INTO quote_items (id, quote_id, service_name, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)',
      [
        uuidv4(), quote1Id, 'Desarrollo Web Landing Page', 1, 350.00, 350.00,
        uuidv4(), quote1Id, 'Campaña Meta & TikTok Ads', 1, 450.00, 450.00
      ]
    );

    const quote2Id = uuidv4();
    await conn.query(
      'INSERT INTO quotes (id, workspace_id, customer_id, quote_number, total_amount, currency, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [quote2Id, workspaceId, customerMap['Mariana López'], 'QT-2026-002', 450.00, 'USD', 'ACCEPTED', 'Plan Pro para boutique online.']
    );
    await conn.query(
      'INSERT INTO quote_items (id, quote_id, service_name, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), quote2Id, 'Gestión Redes Sociales Pro', 1, 450.00, 450.00]
    );
    console.log('  -> 2 Cotizaciones formales emitidas.');

    // 7. Insertar Cuentas Sociales Conectadas
    console.log('[Seed Data] Conectando cuentas sociales al Workspace...');
    await conn.query(
      `INSERT INTO social_accounts (id, workspace_id, platform, account_name, platform_account_id, access_token, status)
       VALUES (?, ?, 'INSTAGRAM', 'Inversiones Vawi Oficial', 'ig_act_101', 'token_demo_vawi_ig', 'ACTIVE'),
              (?, ?, 'FACEBOOK', 'Smart Publish Media', 'fb_act_202', 'token_demo_fb_media', 'ACTIVE')`,
      [uuidv4(), workspaceId, uuidv4(), workspaceId]
    );
    console.log('  -> Cuentas de Instagram y Facebook sincronizadas.');

    console.log(`\n🎉 [Seed Data] ✅ Datos maestros poblados con éxito al 100% para ${users[0].email}!`);
  } catch (err) {
    console.error('[Seed Data] Error insertando datos:', err);
  } finally {
    await conn.end();
  }
}

seedData();
