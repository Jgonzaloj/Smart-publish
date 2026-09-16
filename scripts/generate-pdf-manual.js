const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function generateManual() {
  console.log('Iniciando navegador Chrome para capturar pantallas y generar PDF...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  // 1. Captura de Portal de Login
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);

  const imgLogin = path.join(screenshotsDir, '01-portal-login.png');
  await page.screenshot({ path: imgLogin });
  console.log('Captura 1: Portal de Login guardada');

  // Iniciar sesión con credenciales de administrador o vendedor
  await page.evaluate(() => {
    document.getElementById('portal-email').value = 'admin@crediya.com';
    document.getElementById('portal-password').value = 'admin123';
    // Omitir portada y entrar directamente a la app
    document.getElementById('landing-login-portal').classList.add('hidden');
    document.getElementById('app-main-layout').classList.remove('hidden');
    if (typeof state !== 'undefined') {
      state.token = 'mock_jwt_token';
      state.user = { id: 'usr-1', nombre: 'Carlos Cobrador', rol: 'VENDEDOR' };
      state.role = 'vendedor';
    }
    if (typeof cargarRutaHoy === 'function') cargarRutaHoy();
    if (typeof setTab === 'function') setTab('ruta');
  });
  await page.waitForTimeout(2000);

  // 2. Captura de Hoja de Ruta
  const imgRuta = path.join(screenshotsDir, '02-hoja-de-ruta.png');
  await page.screenshot({ path: imgRuta });
  console.log('Captura 2: Hoja de Ruta guardada');

  // 3. Expandir detalle de cliente
  await page.evaluate(() => {
    const card = document.querySelector('.client-card');
    if (card) {
      card.classList.add('expanded');
      const id = card.dataset.clientId || card.id.replace('card-', '');
      if (typeof toggleExpandirCliente === 'function') toggleExpandirCliente(id);
    }
  });
  await page.waitForTimeout(800);
  const imgCliente = path.join(screenshotsDir, '03-cliente-detalle.png');
  await page.screenshot({ path: imgCliente });
  console.log('Captura 3: Detalle de Cliente guardada');

  // 4. Modal de Abono
  await page.evaluate(() => {
    const card = document.querySelector('.client-card');
    const id = card ? (card.dataset.clientId || card.id.replace('card-', '')) : '1';
    if (typeof abrirModalAbono === 'function') abrirModalAbono(id);
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const input = document.getElementById('abono-monto');
    if (input) input.value = '10000';
  });
  const imgAbono = path.join(screenshotsDir, '04-modal-abono.png');
  await page.screenshot({ path: imgAbono });
  console.log('Captura 4: Modal de Abono guardada');

  // Cerrar modal de abono
  await page.evaluate(() => {
    if (typeof cerrarModalAbono === 'function') cerrarModalAbono();
  });
  await page.waitForTimeout(500);

  // 5. Ir a Cuadre de Caja
  await page.evaluate(() => {
    if (typeof setTab === 'function') setTab('caja');
  });
  await page.waitForTimeout(1500);
  const imgCaja = path.join(screenshotsDir, '05-cuadre-caja.png');
  await page.screenshot({ path: imgCaja });
  console.log('Captura 5: Cuadre de Caja guardada');

  // 6. Cambiar a Administrador y ver Dashboard
  await page.evaluate(async () => {
    if (typeof state !== 'undefined') {
      state.role = 'admin';
      state.user = { id: 'admin-1', nombre: 'Juan Administrador', rol: 'ADMIN' };
    }
    if (typeof setTab === 'function') setTab('dashboard');
    if (typeof cargarDashboardEjecutivo === 'function') cargarDashboardEjecutivo();
  });
  await page.waitForTimeout(2000);
  const imgDash = path.join(screenshotsDir, '06-dashboard.png');
  await page.screenshot({ path: imgDash });
  console.log('Captura 6: Dashboard guardada');

  // Convertir imágenes a base64
  const b64Login = fs.readFileSync(imgLogin).toString('base64');
  const b64Ruta = fs.readFileSync(imgRuta).toString('base64');
  const b64Cliente = fs.readFileSync(imgCliente).toString('base64');
  const b64Abono = fs.readFileSync(imgAbono).toString('base64');
  const b64Caja = fs.readFileSync(imgCaja).toString('base64');
  const b64Dash = fs.readFileSync(imgDash).toString('base64');

  // 7. Generar documento HTML estilizado para el PDF
  const manualHtml = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Manual Oficial de Usuario - CrediYa</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
      
      @page {
        size: A4;
        margin: 18mm 14mm 18mm 14mm;
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: 'Plus Jakarta Sans', sans-serif;
        color: #1e293b;
        background: #ffffff;
        font-size: 10.5pt;
        line-height: 1.6;
      }

      .page-break { page-break-before: always; }

      /* Portada */
      .cover {
        min-height: 850px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 60px 30px;
        background: radial-gradient(circle at top right, #312e81, #0f172a);
        color: white;
        border-radius: 16px;
      }
      .cover .badge {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        padding: 8px 20px;
        border-radius: 30px;
        font-weight: 700;
        font-size: 11pt;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        display: inline-block;
        margin-bottom: 25px;
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
      }
      .cover h1 {
        font-family: 'Outfit', sans-serif;
        font-size: 38pt;
        font-weight: 800;
        letter-spacing: -1px;
        color: #ffffff;
        margin-bottom: 12px;
      }
      .cover p.subtitle {
        font-size: 15pt;
        color: #cbd5e1;
        max-width: 520px;
        margin-bottom: 35px;
        line-height: 1.4;
      }
      .cover .highlights {
        display: flex;
        gap: 15px;
        margin-bottom: 40px;
      }
      .cover .highlight-item {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 12px 18px;
        border-radius: 10px;
        font-size: 10pt;
      }
      .cover .meta {
        font-size: 10pt;
        color: #94a3b8;
        border-top: 1px solid rgba(255,255,255,0.15);
        padding-top: 20px;
        width: 80%;
      }

      /* Contenido */
      .chapter-header {
        margin-bottom: 16px;
      }
      .chapter-tag {
        font-size: 9pt;
        font-weight: 700;
        color: #6366f1;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      h2 {
        font-family: 'Outfit', sans-serif;
        font-size: 20pt;
        font-weight: 800;
        color: #0f172a;
        margin-top: 4px;
        margin-bottom: 10px;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 6px;
      }
      h3 {
        font-family: 'Outfit', sans-serif;
        font-size: 13.5pt;
        font-weight: 700;
        color: #312e81;
        margin-top: 14px;
        margin-bottom: 8px;
      }
      p { margin-bottom: 12px; color: #334155; }

      .card-step {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-left: 4px solid #6366f1;
        padding: 14px 18px;
        border-radius: 8px;
        margin: 14px 0;
      }

      .img-preview {
        width: 100%;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        box-shadow: 0 4px 14px rgba(0,0,0,0.08);
        margin: 12px 0 16px 0;
      }

      ul, ol {
        margin-left: 20px;
        margin-bottom: 12px;
        color: #334155;
      }
      li { margin-bottom: 6px; }

      .tip-box {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-left: 4px solid #3b82f6;
        padding: 12px 16px;
        border-radius: 6px;
        margin: 14px 0;
        font-size: 10pt;
        color: #1e40af;
      }

      .security-box {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-left: 4px solid #22c55e;
        padding: 12px 16px;
        border-radius: 6px;
        margin: 14px 0;
        font-size: 10pt;
        color: #166534;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0;
        font-size: 9.5pt;
      }
      th, td {
        border: 1px solid #cbd5e1;
        padding: 9px 12px;
        text-align: left;
      }
      th {
        background: #f1f5f9;
        font-weight: 700;
        color: #0f172a;
      }
    </style>
  </head>
  <body>

    <!-- PÁGINA 1: PORTADA -->
    <div class="cover">
      <span class="badge">DOCUMENTO DE CAPACITACIÓN &bull; CLIENTE FINAL</span>
      <h1>⚡ CrediYa Microfinanzas</h1>
      <p class="subtitle">Manual Operativo Integral del Sistema de Créditos y Cobranza en Calle</p>
      
      <div class="highlights">
        <div class="highlight-item">📱 100% Móvil (PWA)</div>
        <div class="highlight-item">📶 Soporte Offline (Sin Internet)</div>
        <div class="highlight-item">🧾 Recibos con WhatsApp</div>
        <div class="highlight-item">🔒 Seguridad Bancaria Multi-Tenant</div>
      </div>

      <div class="meta">
        <strong>Para:</strong> Administradores, Supervisores y Cobradores en Ruta<br>
        <strong>Versión del Software:</strong> 2.0 Estable &bull; Septiembre 2026
      </div>
    </div>

    <!-- PÁGINA 2: ACCESO Y PORTAL -->
    <div class="page-break"></div>
    <div class="chapter-header">
      <span class="chapter-tag">Módulo 1</span>
      <h2>Portal de Ingreso y Seguridad de Acceso</h2>
    </div>
    <p>
      <strong>CrediYa</strong> está diseñado para operar tanto en computadoras de oficina como en teléfonos móviles de cobradores. El ingreso se realiza mediante credenciales seguras (correo y contraseña) o a través de un PIN personal de 4 dígitos.
    </p>

    <img class="img-preview" src="data:image/png;base64,${b64Login}" alt="Portal de Ingreso" />

    <div class="card-step">
      <h3>🔑 Pasos para Iniciar Sesión:</h3>
      <ol>
        <li>Abrir el navegador web en el teléfono o computadora e ingresar al enlace de tu empresa.</li>
        <li>Digitar el correo electrónico y la contraseña asignada por la administración.</li>
        <li>Activar la casilla <em>"Recordar sesión"</em> para no tener que escribir la contraseña todos los días en la moto o calle.</li>
        <li>Presionar el botón <strong>🚀 Entrar a mi Plataforma</strong>.</li>
      </ol>
    </div>

    <div class="security-box">
      <strong>🔒 Bloqueo Automático por PIN:</strong> Si el cobrador guarda el teléfono o bloquea la pantalla, la aplicación exige un PIN de 4 dígitos para volver a ver los saldos y datos de clientes, protegiendo el negocio ante pérdidas o robos del dispositivo.
    </div>

    <!-- PÁGINA 3: HOJA DE RUTA DIARIA -->
    <div class="page-break"></div>
    <div class="chapter-header">
      <span class="chapter-tag">Módulo 2</span>
      <h2>Hoja de Ruta Diaria de Cobranza</h2>
    </div>
    <p>
      Es la herramienta principal del cobrador en su jornada. Agrupa en una sola pantalla todos los clientes asignados para visitar hoy con métricas en tiempo real.
    </p>

    <img class="img-preview" src="data:image/png;base64,${b64Ruta}" alt="Hoja de Ruta de Cobranza" />

    <h3>Elementos Clave de la Pantalla:</h3>
    <ul>
      <li><strong>Métricas de Recaudo en Vivo:</strong> En los bloques superiores el cobrador ve cuánto dinero lleva recaudado hoy vs. el dinero esperado por cobrar.</li>
      <li><strong>Contador de Visitas:</strong> Total de clientes en la ruta, cuántos ya pagaron, cuántos faltan por visitar y cuántos se marcaron como ausentes.</li>
      <li><strong>Secuencia de Visita (#1, #2, #3):</strong> Cada cliente tiene un número de orden. El cobrador puede presionar las flechas <strong>▲ / ▼</strong> para reordenar la secuencia según la ruta de su moto.</li>
      <li><strong>Buscador Inteligente:</strong> Permite buscar instantáneamente por nombre, alias, teléfono o dirección.</li>
      <li><strong>Filtros por Estado:</strong> Permite filtrar entre <em>Todos</em>, <em>Por Cobrar</em>, <em>Cobrados</em> y <em>Ausentes</em>.</li>
    </ul>

    <!-- PÁGINA 4: FICHA DEL CLIENTE Y REGISTRO DE ABONO -->
    <div class="page-break"></div>
    <div class="chapter-header">
      <span class="chapter-tag">Módulo 3</span>
      <h2>Expediente del Cliente y Registro de Pago</h2>
    </div>
    <p>
      Al llegar al local o casa del cliente, el cobrador toca la tarjeta correspondiente para desplegar su ficha completa y opciones de cobro:
    </p>

    <img class="img-preview" src="data:image/png;base64,${b64Cliente}" alt="Ficha del Cliente Desplegada" />

    <p>
      Al hacer clic en el botón verde <strong>💵 Abonar</strong>, se abre la ventana de registro de pago:
    </p>

    <img class="img-preview" src="data:image/png;base64,${b64Abono}" alt="Modal de Registro de Abono" />

    <div class="card-step">
      <h3>Paso a Paso para Registrar el Cobro:</h3>
      <ol>
        <li>Verificar el valor de la cuota sugerida (el sistema la calcula automáticamente según el crédito).</li>
        <li>Si el cliente paga la cuota completa, parcial o abona de más, ingresar el monto real entregado en efectivo o transferencia.</li>
        <li>Seleccionar el método de pago (Efectivo, Nequi, Daviplata, Yape, Plin o Transferencia Bancaria).</li>
        <li>Presionar <strong>Registrar Abono</strong>.</li>
      </ol>
    </div>

    <div class="tip-box">
      <strong>✨ Envío Inmediato de Comprobante por WhatsApp:</strong>
      Apenas se registra el pago, se genera un recibo digital oficial con código QR. Con un solo clic en <em>"Enviar WhatsApp"</em>, el cobrador envía el recibo con fecha, hora, saldo restante y cuotas pendientes al chat del cliente.
    </div>

    <!-- PÁGINA 5: CLIENTES AUSENTES Y MORA -->
    <div class="page-break"></div>
    <div class="chapter-header">
      <span class="chapter-tag">Módulo 4</span>
      <h2>Gestión de Ausentes y Motor de Mora Automática</h2>
    </div>
    <p>
      Si el cobrador llega a visitar al cliente y no se encuentra o no tiene dinero:
    </p>

    <div class="card-step">
      <h3>🚪 ¿Cómo marcar un Cliente Ausente?</h3>
      <ol>
        <li>Tocar la tarjeta del cliente en la Hoja de Ruta.</li>
        <li>Presionar el botón <strong>🚪 Ausente</strong>.</li>
        <li>Opcionalmente escribir una nota breve (ej. <em>"Local cerrado, pasar después de las 4 PM"</em>).</li>
        <li>Confirmar. El cliente pasa automáticamente a la pestaña <em>Ausentes</em> y las métricas de la ruta se actualizan.</li>
      </ol>
    </div>

    <h3>⚡ Motor de Mora Automática Determinista</h3>
    <p>
      CrediYa cuenta con un algoritmo financiero que calcula a la medianoche (o en tiempo real al registrar pagos) las cuotas atrasadas de cada cliente:
    </p>
    <ul>
      <li><strong>Si el cliente se atrasa:</strong> Su etiqueta cambia a <span style="color:#e11d48; font-weight:700;">⚠️ ATRASADO</span> y su crédito pasa a estado <span style="color:#e11d48; font-weight:700;">EN MORA</span>.</li>
      <li><strong>Sincronización Bidireccional:</strong> Cuando el cliente entrega el dinero adeudado y se pone al día, el sistema de inmediato lo regresa a <span style="color:#16a34a; font-weight:700;">🟢 AL DÍA</span> sin necesidad de trámites manuales de oficina.</li>
    </ul>

    <!-- PÁGINA 6: CUADRE DE CAJA DIARIO -->
    <div class="page-break"></div>
    <div class="chapter-header">
      <span class="chapter-tag">Módulo 5</span>
      <h2>Cuadre y Cierre de Caja Diario (Arqueo)</h2>
    </div>
    <p>
      Al finalizar la ruta de cobro en calle, el cobrador ingresa al módulo <strong>Caja</strong> para liquidar el dinero ante la administración.
    </p>

    <img class="img-preview" src="data:image/png;base64,${b64Caja}" alt="Cuadre y Liquidación de Caja" />

    <h3>Flujo de Auditoría de Efectivo:</h3>
    <ul>
      <li><strong>Total Recaudado:</strong> Suma automática de todos los abonos cobrados durante el día.</li>
      <li><strong>Registro de Gastos Operativos:</strong> Botón <em>"Registrar Gasto"</em> para declarar egresos justificados (gasolina de la moto, viáticos, almuerzo, pinchazos de llanta).</li>
      <li><strong>Nuevos Préstamos Desembolsados:</strong> Si el cobrador entregó nuevo capital a un cliente en la calle, el desembolso resta del efectivo en mano automáticamente.</li>
      <li><strong>Saldo Neto a Entregar:</strong> El sistema calcula con exactitud matemática cuánto dinero físico debe entregar el cobrador.</li>
      <li><strong>Cierre de Caja:</strong> Al presionar <strong>"Cerrar Caja de Hoy"</strong>, el día operativo queda sellado con fecha, hora y firma digital para evitar alteraciones posteriores.</li>
    </ul>

    <!-- PÁGINA 7: TABLERO GERENCIAL -->
    <div class="page-break"></div>
    <div class="chapter-header">
      <span class="chapter-tag">Módulo 6</span>
      <h2>Dashboard Gerencial y Auditoría de Cartera</h2>
    </div>
    <p>
      Exclusivo para administradores y supervisores. Ofrece una vista panorámica en tiempo real de todo el negocio:
    </p>

    <img class="img-preview" src="data:image/png;base64,${b64Dash}" alt="Dashboard Financiero Gerencial" />

    <table>
      <thead>
        <tr>
          <th>Indicador Clave</th>
          <th>¿Qué representa para el dueño del negocio?</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Cartera Activa en la Calle</strong></td>
          <td>Dinero total prestado pendiente de cobro distribuido en todos los clientes.</td>
        </tr>
        <tr>
          <td><strong>Ganancias / Intereses Proyectados</strong></td>
          <td>Utilidad bruta esperada al liquidar los créditos vigentes.</td>
        </tr>
        <tr>
          <td><strong>Clientes al Día vs. Clientes en Mora</strong></td>
          <td>Semáforo de riesgo que indica el porcentaje de salud crediticia de la cartera.</td>
        </tr>
        <tr>
          <td><strong>Ranking de Cobradores</strong></td>
          <td>Tabla comparativa de rendimiento: efectividad de cobro y dinero ingresado por cada empleado.</td>
        </tr>
        <tr>
          <td><strong>Comportamiento Semanal</strong></td>
          <td>Gráfico de barras de cobros día por día (Lunes a Sábado) para detectar caídas de recaudación.</td>
        </tr>
      </tbody>
    </table>

    <div class="card-step">
      <h3>📶 Soporte de Trabajo Fuera de Línea (Offline-First)</h3>
      <p>
        Si el cobrador se encuentra en zonas sin cobertura celular (sótanos, zonas rurales o sin datos móviles), <strong>CrediYa sigue cobrando normalmente</strong>. Los cobros se almacenan de forma encriptada en la memoria local del teléfono y, al recuperar señal, se sincronizan en milisegundos con el servidor central.
      </p>
    </div>

  </body>
  </html>
  `;

  const htmlPath = path.join(__dirname, 'manual-cliente.html');
  fs.writeFileSync(htmlPath, manualHtml, 'utf-8');

  // 8. Renderizar a PDF con Playwright
  console.log('Compilando PDF oficial a partir de las capturas...');
  const pdfPage = await context.newPage();
  await pdfPage.goto('file://' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });

  const pdfPathRoot = 'c:\\Users\\PC\\Downloads\\dsddsdsdsds\\Manual-Operativo-CrediYa.pdf';
  const pdfPathBackend = path.join(__dirname, '..', 'Manual-Operativo-CrediYa.pdf');

  await pdfPage.pdf({
    path: pdfPathRoot,
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
  });

  // Copiar también a backend
  fs.copyFileSync(pdfPathRoot, pdfPathBackend);

  console.log('PDF generado exitosamente en:', pdfPathRoot);
  await browser.close();
}

generateManual().catch((err) => {
  console.error('Error al generar manual PDF:', err);
  process.exit(1);
});
