const fs = require('fs');

console.log('--- Iniciando integración de Resumen del Día V13 ---');

// 1. MODIFICAR public/index.html
let html = fs.readFileSync('public/index.html', 'utf8');

// Insertar en Drawer Menu item de Resumen del Día
if (!html.includes('drawer-tab-resumen-dia')) {
  html = html.replace(
    '<button type="button" class="drawer-nav-item" id="drawer-tab-caja"',
    `<button type="button" class="drawer-nav-item" id="drawer-tab-resumen-dia" onclick="setTab('resumen-dia'); cerrarDrawerMenu();">
          <span class="nav-item-icon">📋</span>
          <span>Resumen del Día</span>
        </button>
        <button type="button" class="drawer-nav-item" id="drawer-tab-caja"`
  );
}

// Insertar en Dropdown Menu
if (!html.includes('data-tab="resumen-dia"')) {
  html = html.replace(
    '<button type="button" class="tab-btn menu-item" id="tab-caja"',
    `<button type="button" class="tab-btn menu-item" id="tab-resumen-dia" data-tab="resumen-dia" onclick="setTab('resumen-dia')">
              <span class="item-icon">📋</span>
              <div class="item-info">
                <strong>Resumen del Día</strong>
                <small>Liquidación completa, ausentes, seguros y caja</small>
              </div>
            </button>
            <button type="button" class="tab-btn menu-item" id="tab-caja"`
  );
}

// Insertar en Bottom Dock
if (!html.includes('mob-nav-resumen')) {
  html = html.replace(
    '<button type="button" class="mob-nav-btn" id="mob-nav-caja"',
    `<button type="button" class="mob-nav-btn" id="mob-nav-resumen" onclick="setTab('resumen-dia')">
      <span class="mob-nav-icon">📋</span>
      <span class="mob-nav-label">Resumen</span>
    </button>
    <button type="button" class="mob-nav-btn" id="mob-nav-caja"`
  );
}

// Insertar sección #sec-resumen-dia antes de #sec-caja
const secResumenHTML = `
    <!-- ============================================================ -->
    <!-- SECCIÓN: RESUMEN DEL DÍA (COMPATIBILIDAD V13 MEJORADA)        -->
    <!-- ============================================================ -->
    <section id="sec-resumen-dia" class="tab-section">
      <div class="section-header">
        <div>
          <h2>:: Resumen del Día ::</h2>
          <p id="res-dia-vendedor-nombre">Vendedor: -</p>
        </div>
        <div class="section-actions">
          <button type="button" class="btn-secondary" onclick="abrirModalCajaInicial()">⚙️ Base / Caja Inicial</button>
          <button type="button" class="btn-secondary" onclick="abrirModalSeguros()">🛡️ Mov. Seguros</button>
          <button type="button" class="btn-primary" onclick="cargarResumenDia()">🔄 Actualizar</button>
        </div>
      </div>

      <!-- TARJETA RESUMEN ESTILO V13 GLASSMORPHISM -->
      <div class="v13-resumen-card">
        <div class="v13-card-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.1rem;">⚡</span>
            <strong id="v13-header-vendedor" style="font-size: 0.95rem;">Vendedor: Cargando...</strong>
          </div>
          <span class="status-badge status-al-dia" id="v13-header-fecha">Hoy</span>
        </div>

        <div class="v13-rows-container">
          <div class="v13-row">
            <span class="v13-label">Fecha de Ruta</span>
            <strong class="v13-val" id="res-fecha-ruta">-</strong>
          </div>
          <div class="v13-row">
            <span class="v13-label">Clientes Ausentes</span>
            <strong class="v13-val text-danger" id="res-clientes-ausentes">0</strong>
          </div>
          <div class="v13-row">
            <span class="v13-label">Aplazados Siguiente Día</span>
            <strong class="v13-val text-warning" id="res-aplazados-dia">0</strong>
          </div>
          <div class="v13-row">
            <span class="v13-label">Número Clientes</span>
            <strong class="v13-val" id="res-numero-clientes">0</strong>
          </div>
          <div class="v13-row">
            <span class="v13-label">Clientes Nuevos</span>
            <strong class="v13-val text-success" id="res-clientes-nuevos">0</strong>
          </div>
          <div class="v13-row v13-highlight">
            <span class="v13-label">Pagos Registrados</span>
            <strong class="v13-val" id="res-pagos-registrados">0/0 Adicionales: 0</strong>
          </div>
          <div class="v13-row">
            <span class="v13-label">Caja Inicial <button type="button" class="btn-edit-caja" onclick="abrirModalCajaInicial()" title="Editar base inicial">✏️</button></span>
            <strong class="v13-val text-accent" id="res-caja-inicial">$0.00</strong>
          </div>
          <div class="v13-row">
            <span class="v13-label">Recaudo Esperado</span>
            <strong class="v13-val" id="res-recaudo-esperado">$0.00 (100%)</strong>
          </div>
          <div class="v13-row v13-highlight">
            <span class="v13-label">Recaudo del día</span>
            <strong class="v13-val text-success" id="res-recaudo-dia">$0.00 (0.0%)</strong>
          </div>
          <div class="v13-row">
            <span class="v13-label">Efectivo/Transferencia</span>
            <strong class="v13-val" id="res-efectivo-transferencia">$0.00 / $0.00</strong>
          </div>
          <div class="v13-row">
            <span class="v13-label">Total Ventas</span>
            <strong class="v13-val text-warning" id="res-total-ventas">$0.00</strong>
          </div>
          <div class="v13-row">
            <span class="v13-label">Retiros Caja</span>
            <strong class="v13-val text-danger" id="res-retiros-caja">$0.00</strong>
          </div>
          <div class="v13-row">
            <span class="v13-label">Egresos</span>
            <strong class="v13-val text-danger" id="res-egresos">$0.00</strong>
          </div>
          <div class="v13-row">
            <span class="v13-label">Ingresos</span>
            <strong class="v13-val text-success" id="res-ingresos">$0.00</strong>
          </div>
          <div class="v13-row">
            <span class="v13-label">Retiro de Caja Seguros</span>
            <strong class="v13-val text-danger" id="res-retiro-seguros">$0.00</strong>
          </div>
          <div class="v13-row">
            <span class="v13-label">Ingresos de Seguros</span>
            <strong class="v13-val text-success" id="res-ingresos-seguros">$0.00</strong>
          </div>
          <div class="v13-row">
            <span class="v13-label">Caja Seguros</span>
            <strong class="v13-val" id="res-caja-seguros">$0.00</strong>
          </div>
          <div class="v13-row v13-final-row">
            <span class="v13-label" style="font-weight: 800; font-size: 1.05rem;">Saldo en Caja</span>
            <strong class="v13-val" id="res-saldo-en-caja" style="font-size: 1.35rem; color: var(--badge-green); font-family: var(--font-display);">$0.00</strong>
          </div>
          <div class="v13-row v13-toggle-row">
            <span class="v13-label" style="font-weight: 700;">Sincronización Automatica</span>
            <label class="switch-toggle">
              <input type="checkbox" id="toggle-sync-auto" checked onchange="toggleSyncAuto(this.checked)">
              <span class="slider round"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- BOTONES DE ACCIÓN INFERIORES V13 -->
      <div class="v13-bottom-actions">
        <button type="button" class="btn-v13-action" onclick="abrirModalNoPagados()">
          <span>✔️ No Pagos</span>
        </button>
        <button type="button" class="btn-v13-action" onclick="abrirModalCajaInicial()">
          <span>✔️ Configuraciones</span>
        </button>
      </div>
    </section>
`;

if (!html.includes('id="sec-resumen-dia"')) {
  html = html.replace('<!-- SECCIÓN 4: CUADRE DE CAJA -->', secResumenHTML + '\n    <!-- SECCIÓN 4: CUADRE DE CAJA -->');
}

// Actualizar Modal Abono para soportar método de pago y adicional
if (!html.includes('id="modal-abono-metodo"')) {
  const abonoFields = `
        <div class="form-group" style="margin-top: 15px;">
          <label id="lbl-modal-abono-monto">Valor a Abonar ($) *</label>
          <input type="number" id="modal-abono-monto" min="0.01" step="any" placeholder="0.00">
        </div>

        <div class="form-group">
          <label>Forma / Método de Cobro</label>
          <select id="modal-abono-metodo" class="select-vendedor-admin" style="font-size: 0.88rem;">
            <option value="EFECTIVO" selected>💵 Efectivo</option>
            <option value="TRANSFERENCIA">📱 Transferencia Bancaria</option>
            <option value="NEQUI">📲 Nequi / Daviplata</option>
            <option value="YAPE">📲 Yape / Plin</option>
            <option value="OTRO">💳 Otro medio digital</option>
          </select>
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="remember-me" style="font-size: 0.82rem;">
            <input type="checkbox" id="modal-abono-adicional">
            <span>Pago Adicional (Cliente fuera de la ruta de hoy)</span>
          </label>
        </div>`;

  html = html.replace(
    `<div class="form-group" style="margin-top: 15px;">\n          <label id="lbl-modal-abono-monto">Valor a Abonar ($)</label>\n          <input type="number" id="modal-abono-monto" min="0.01" step="any" placeholder="0.00">\n        </div>`,
    abonoFields
  );
}

// Modales V13: Aplazar, Caja Inicial, No Pagados, Seguros
const modalesV13 = `
  <!-- MODAL: APLAZAR VISITA (SIGUIENTE DÍA) -->
  <div id="modal-aplazar" class="modal-backdrop hidden">
    <div class="modal-card">
      <div class="modal-header">
        <h3>⏳ Aplazar Visita para Mañana</h3>
        <button class="modal-close" onclick="cerrarModalAplazar()">✕</button>
      </div>
      <div class="modal-body">
        <p>Cliente: <strong id="modal-aplazar-cliente">-</strong></p>
        <p class="text-muted">El cliente quedará registrado como <strong>Aplazado Siguiente Día</strong> para cobro prioritario en la ruta de mañana.</p>
        <div class="form-group" style="margin-top: 15px;">
          <label>Motivo / Observación (Opcional)</label>
          <input type="text" id="modal-aplazar-obs" placeholder="Ej. Pidió pasar mañana a primera hora">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="cerrarModalAplazar()">Cancelar</button>
        <button class="btn-danger" style="background: #F59E0B; border-color: #F59E0B;" onclick="confirmarAplazado()">⏳ Confirmar Aplazado</button>
      </div>
    </div>
  </div>

  <!-- MODAL: BASE / CAJA INICIAL DEL DÍA -->
  <div id="modal-caja-inicial" class="modal-backdrop hidden">
    <div class="modal-card">
      <div class="modal-header">
        <h3>⚙️ Base / Caja Inicial del Día</h3>
        <button class="modal-close" onclick="cerrarModalCajaInicial()">✕</button>
      </div>
      <div class="modal-body">
        <p class="text-muted">Ingresa el dinero en efectivo con el que arranca el cobrador la jornada para el cálculo exacto del cuadre.</p>
        <div class="form-group mt-3">
          <label id="lbl-caja-inicial-monto">Monto de Caja Inicial ($) *</label>
          <input type="number" id="input-caja-inicial-valor" min="0" step="any" placeholder="Ej. 1037.50">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="cerrarModalCajaInicial()">Cancelar</button>
        <button class="btn-primary" onclick="guardarCajaInicial()">💾 Guardar Base</button>
      </div>
    </div>
  </div>

  <!-- MODAL: NO PAGOS (CLIENTES PENDIENTES HOY) -->
  <div id="modal-no-pagados" class="modal-backdrop hidden">
    <div class="modal-card modal-lg">
      <div class="modal-header">
        <div>
          <h3>📋 Clientes No Pagados (Hoy)</h3>
          <p class="text-muted text-sm" id="modal-no-pagados-subtitulo">Listado de clientes pendientes de visita o abono</p>
        </div>
        <button class="modal-close" onclick="cerrarModalNoPagados()">✕</button>
      </div>
      <div class="modal-body">
        <div class="table-container" style="max-height: 380px; overflow-y: auto; padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Cuota</th>
                <th>Saldo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="tabla-no-pagados-body">
              <tr><td colspan="5" class="empty-cell">Cargando clientes...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="cerrarModalNoPagados()">Cerrar</button>
      </div>
    </div>
  </div>

  <!-- MODAL: CAJA DE SEGUROS -->
  <div id="modal-seguros" class="modal-backdrop hidden">
    <div class="modal-card">
      <div class="modal-header">
        <h3>🛡️ Movimiento en Caja de Seguros</h3>
        <button class="modal-close" onclick="cerrarModalSeguros()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Tipo de Movimiento</label>
          <select id="seg-tipo" class="select-vendedor-admin">
            <option value="INGRESO">➕ Ingreso de Seguro (Cobro Prima)</option>
            <option value="EGRESO">➖ Retiro de Caja Seguro (Entrega)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Concepto</label>
          <input type="text" id="seg-concepto" placeholder="Ej. Prima microcrédito cliente">
        </div>
        <div class="form-group">
          <label id="lbl-seg-valor">Valor ($) *</label>
          <input type="number" id="seg-valor" min="0.01" step="any" placeholder="0.00">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="cerrarModalSeguros()">Cancelar</button>
        <button class="btn-primary" onclick="guardarMovimientoSeguro()">Guardar</button>
      </div>
    </div>
  </div>
`;

if (!html.includes('id="modal-aplazar"')) {
  html = html.replace('<!-- TOAST NOTIFICACIONES -->', modalesV13 + '\n  <!-- TOAST NOTIFICACIONES -->');
}

// BUMP asset versions
html = html.replace(/style\.css\?v=[^"']+/g, 'style.css?v=20260915-09');
html = html.replace(/app\.js\?v=[^"']+/g, 'app.js?v=20260915-09');

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('HTML actualizado con éxito');
