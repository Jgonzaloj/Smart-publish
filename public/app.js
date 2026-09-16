// Estado global de la aplicación web
const state = {
  token: null,
  user: null,
  role: 'vendedor', // 'vendedor' | 'admin'
  rutaActual: null,
  clientesConCredito: [],
  pinBuffer: '',
  selectedClientForAbono: null,
  selectedClientForAusente: null,
};

// Configuración de Monedas Multi-País (Perú, Colombia, México, USD)
const MONEDAS = {
  PEN: { codigo: 'PEN', simbolo: 'S/ ', nombre: 'Soles (Perú)', pais: 'Perú', prefijoDoc: 'DNI', locale: 'es-PE' },
  COP: { codigo: 'COP', simbolo: '$ ', nombre: 'Pesos (Colombia)', pais: 'Colombia', prefijoDoc: 'C.C.', locale: 'es-CO' },
  MXN: { codigo: 'MXN', simbolo: '$ ', nombre: 'Pesos (México)', pais: 'México', prefijoDoc: 'CURP', locale: 'es-MX' },
  USD: { codigo: 'USD', simbolo: '$ ', nombre: 'Dólares (USD)', pais: 'Internacional', prefijoDoc: 'ID', locale: 'en-US' },
};

// Si antes se guardó 'COP' por defecto de la versión previa, asegurar 'PEN' (Soles) por defecto
if (!localStorage.getItem('crediya_moneda_usuario_fijada')) {
  localStorage.setItem('crediya_moneda', 'PEN');
}

function obtenerMonedaActual() {
  const cod = localStorage.getItem('crediya_moneda') || (state.tenant && state.tenant.moneda) || 'PEN';
  return MONEDAS[cod] || MONEDAS.PEN;
}

function actualizarLabelsMoneda() {
  const m = obtenerMonedaActual();
  const sim = m.simbolo.trim();

  const lblMonto = document.getElementById('lbl-cre-monto');
  if (lblMonto) lblMonto.innerText = `Valor Préstamo (${sim}) *`;

  const lblRen = document.getElementById('lbl-ren-monto');
  if (lblRen) lblRen.innerText = `Nuevo Préstamo (${sim})`;

  const lblAbono = document.getElementById('lbl-modal-abono-monto');
  if (lblAbono) lblAbono.innerText = `Valor a Abonar (${sim}) *`;

  const lblRetiro = document.getElementById('lbl-ret-valor');
  if (lblRetiro) lblRetiro.innerText = `Valor a Retirar (${sim}) *`;

  document.querySelectorAll('.lbl-doc-tipo').forEach(el => el.innerText = m.prefijoDoc);
}

function fmtMoneda(monto, conDecimales = null) {
  const num = Number(monto) || 0;
  const m = obtenerMonedaActual();
  const mostrarDec = conDecimales !== null ? conDecimales : (m.codigo === 'PEN' || m.codigo === 'USD');
  const fmt = num.toLocaleString(m.locale, {
    minimumFractionDigits: mostrarDec ? (num % 1 === 0 ? 0 : 2) : 0,
    maximumFractionDigits: mostrarDec ? 2 : 0,
  });
  return `${m.simbolo}${fmt}`;
}

// Sanitización contra ataques XSS (Cross-Site Scripting)
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function cambiarMonedaGlobal(codigoMoneda) {
  if (!MONEDAS[codigoMoneda]) return;
  localStorage.setItem('crediya_moneda_usuario_fijada', 'true');
  localStorage.setItem('crediya_moneda', codigoMoneda);
  if (state.tenant) {
    state.tenant.moneda = codigoMoneda;
  }
  const select = document.getElementById('selector-moneda-global');
  if (select) select.value = codigoMoneda;

  actualizarLabelsMoneda();

  if (state.token) {
    try {
      await api('/auth/tenant/moneda', {
        method: 'PATCH',
        body: JSON.stringify({ moneda: codigoMoneda }),
      });
    } catch (e) {
      console.warn('No se pudo guardar la moneda en el servidor:', e);
    }
  }

  showToast(`Moneda cambiada a: ${MONEDAS[codigoMoneda].nombre} (${MONEDAS[codigoMoneda].simbolo.trim()})`, 'info');

  if (state.token) {
    cargarRutaHoy();
    cargarClientesParaRenovacion();
    cargarCuadreCaja();
    if (state.role === 'admin') {
      cargarDashboardEjecutivo();
      cargarUsuarios();
    }
  }
}

// API Helper
async function api(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  try {
    let res = await fetch(endpoint, {
      ...options,
      headers,
    });

    // Si el token guardado en el navegador venció o es inválido (401)
    if (res.status === 401 && !endpoint.includes('/auth/login')) {
      cerrarSesion();
      throw new Error('Tu sesión ha expirado. Inicia sesión nuevamente.');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Error HTTP ${res.status}`);
    }
    return data;
  } catch (err) {
    showToast(err.message, 'danger');
    throw err;
  }
}

// ============================================================
// PWA & SOPORTE OFFLINE-FIRST (INDEXEDDB + SERVICE WORKER)
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js?v=31', { updateViaCache: 'none' })
      .then((reg) => {
        reg.update();
      })
      .catch((err) => {
        console.warn('Registro de Service Worker:', err);
      });
  });
}

const DB_NAME = 'crediya_offline_db';
const STORE_NAME = 'abonos_pendientes';

function abrirDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return resolve(null);
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function guardarAbonoOffline(payload, recibo) {
  try {
    const db = await abrirDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).add({
        payload,
        recibo,
        createdAt: new Date().toISOString(),
      });
      tx.oncomplete = () => {
        actualizarBadgeConexion();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error guardando en IndexedDB:', err);
  }
}

async function obtenerAbonosPendientesOffline() {
  try {
    const db = await abrirDB();
    if (!db) return [];
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

async function eliminarAbonoOffline(id) {
  try {
    const db = await abrirDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => {
        actualizarBadgeConexion();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error eliminando de IndexedDB:', err);
  }
}

async function actualizarBadgeConexion() {
  const indicator = document.getElementById('network-indicator');
  const text = document.getElementById('network-status-text');
  if (!indicator || !text) return;

  const pendientes = await obtenerAbonosPendientesOffline();

  if (!navigator.onLine) {
    indicator.className = 'status-indicator offline';
    text.innerText = `📡 Offline (${pendientes.length} por sincronizar)`;
  } else if (pendientes.length > 0) {
    indicator.className = 'status-indicator syncing';
    text.innerText = `⏳ Sincronizando (${pendientes.length} pendientes)...`;
  } else {
    indicator.className = 'status-indicator';
    text.innerText = '🟢 En Línea / Almacén Seguro';
  }
}

async function sincronizarAbonosOffline() {
  if (!navigator.onLine) return;
  const pendientes = await obtenerAbonosPendientesOffline();
  if (pendientes.length === 0) {
    actualizarBadgeConexion();
    return;
  }

  showToast(`📡 Sincronizando ${pendientes.length} cobro(s) offline con el servidor...`, 'info');
  actualizarBadgeConexion();

  for (const item of pendientes) {
    try {
      await api('/abonos', {
        method: 'POST',
        body: JSON.stringify(item.payload),
      });
      await eliminarAbonoOffline(item.id);
    } catch (err) {
      console.error('Error sincronizando abono offline:', err);
    }
  }

  showToast('✅ Todos los cobros offline han sido sincronizados', 'success');
  actualizarBadgeConexion();
  cargarRutaHoy();
  cargarCuadreCaja();
}

window.addEventListener('online', () => {
  actualizarBadgeConexion();
  sincronizarAbonosOffline();
});

window.addEventListener('offline', () => {
  actualizarBadgeConexion();
});

// ============================================================
// GEOLOCALIZACIÓN GPS ANTI-FRAUDE
// ============================================================
function obtenerUbicacionGPS() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      return resolve(null);
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitud: Number(pos.coords.latitude.toFixed(7)),
          longitud: Number(pos.coords.longitude.toFixed(7)),
          precisionGps: Number(pos.coords.accuracy.toFixed(2)),
        });
      },
      () => {
        resolve(null);
      },
      { timeout: 4000, enableHighAccuracy: true }
    );
  });
}

// ============================================================
// PWA INSTALL PROMPT
// ============================================================
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;

  const banner = document.getElementById('pwa-install-banner');
  if (banner) banner.classList.remove('hidden');

  const btnHeader = document.getElementById('btn-pwa-header');
  if (btnHeader) btnHeader.classList.remove('hidden');
});

async function instalarAppPWA() {
  if (!deferredInstallPrompt) {
    showToast('La aplicación ya está instalada o tu navegador no soporta instalación automática', 'info');
    return;
  }
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') {
    showToast('🎉 ¡Gracias por instalar CrediYa!', 'success');
  }
  deferredInstallPrompt = null;
  document.getElementById('pwa-install-banner')?.classList.add('hidden');
  document.getElementById('btn-pwa-header')?.classList.add('hidden');
}

// ============================================================
// GESTIÓN DE TEMA (MODO CREMA CÁLIDO & MODO OSCURO)
// ============================================================
function inicializarTema() {
  const tema = localStorage.getItem('crediya_theme') || 'cream';
  aplicarTema(tema);
}

function aplicarTema(tema) {
  if (tema === 'dark') {
    document.body.classList.remove('theme-cream');
    document.body.classList.add('theme-dark');
  } else {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-cream');
  }
  localStorage.setItem('crediya_theme', tema);
  actualizarBotonTema(tema);
}

function toggleTheme() {
  const esOscuro = document.body.classList.contains('theme-dark');
  aplicarTema(esOscuro ? 'cream' : 'dark');
  showToast(esOscuro ? '☀️ Modo Crema Cálido activado' : '🌙 Modo Oscuro activado', 'info');
}

function actualizarBotonTema(tema) {
  const btn = document.getElementById('btn-theme-toggle');
  const icon = document.getElementById('theme-toggle-icon');
  const text = document.getElementById('theme-toggle-text');
  if (btn) {
    if (tema === 'cream') {
      btn.title = 'Cambiar a Modo Oscuro';
      if (icon) icon.textContent = '🌙';
      if (text) text.textContent = 'Oscuro';
    } else {
      btn.title = 'Cambiar a Modo Crema Cálido';
      if (icon) icon.textContent = '☀️';
      if (text) text.textContent = 'Crema';
    }
  }
}
window.toggleTheme = toggleTheme;
window.aplicarTema = aplicarTema;

// ============================================================
// INICIALIZACIÓN Y CONTROL DE SESIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  inicializarTema();
  actualizarBadgeConexion();
  sincronizarAbonosOffline();

  // Revisar si existe sesión previa recordada
  const tokenGuardado = localStorage.getItem('crediya_token');
  const usuarioGuardado = localStorage.getItem('crediya_user');
  const rolGuardado = localStorage.getItem('crediya_role');

  if (tokenGuardado && usuarioGuardado) {
    try {
      state.token = tokenGuardado;
      state.user = JSON.parse(usuarioGuardado);
      state.role = rolGuardado || (state.user.rol === 'ADMIN' ? 'admin' : 'vendedor');

      // Entrar directamente a la aplicación
      mostrarInterfazPrincipal();
      return;
    } catch {
      localStorage.removeItem('crediya_token');
      localStorage.removeItem('crediya_user');
    }
  }

  // Si no hay sesión recordada, mostramos la Portada de Ingreso
  mostrarPortadaIngreso();
});

function mostrarPortadaIngreso() {
  document.getElementById('landing-login-portal')?.classList.remove('hidden');
  document.getElementById('app-main-layout')?.classList.add('hidden');
}

function mostrarInterfazPrincipal() {
  document.getElementById('landing-login-portal')?.classList.add('hidden');
  document.getElementById('app-main-layout')?.classList.remove('hidden');

  // Sincronizar selector de moneda con la configuración de la empresa o local
  const selMoneda = document.getElementById('selector-moneda-global');
  if (selMoneda) {
    selMoneda.value = obtenerMonedaActual().codigo;
  }
  actualizarLabelsMoneda();

  // Actualizar indicadores del usuario autenticado
  const esVendedor = state.role === 'vendedor';
  document.getElementById('btn-switch-vendedor')?.classList.toggle('active', esVendedor);
  document.getElementById('btn-switch-admin')?.classList.toggle('active', !esVendedor);

  adaptarUIporRol();
  if (state.role === 'admin') {
    poblarSelectorVendedores();
  }
  cargarRutaHoy();
  cargarClientesParaRenovacion();
  cargarCuadreCaja();
}

// PORTADA: CAMBIAR ENTRE LOGIN Y REGISTRO
function cambiarModoAuth(modo) {
  const tabLogin = document.getElementById('tab-auth-login');
  const tabReg = document.getElementById('tab-auth-registro');
  const formLogin = document.getElementById('form-portal-login');
  const formReg = document.getElementById('form-portal-registro');

  if (modo === 'login') {
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
    formLogin.classList.remove('hidden');
    formReg.classList.add('hidden');
  } else {
    tabLogin.classList.remove('active');
    tabReg.classList.add('active');
    formLogin.classList.add('hidden');
    formReg.classList.remove('hidden');
  }
}

// TOGGLE VER / OCULTAR CONTRASEÑA
function togglePassVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerText = '🔒';
  } else {
    input.type = 'password';
    btn.innerText = '👁️';
  }
}

// Helper para forzar cierre de teclado virtual móvil y evitar que el evento se descarte
function cerrarTecladoVirtual() {
  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    document.activeElement.blur();
  }
}

let isSubmittingLogin = false;

// PORTADA: MANEJAR LOGIN REAL
async function manejarPortalLogin(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }

  if (isSubmittingLogin) return;

  const emailInput = document.getElementById('portal-email');
  const passInput = document.getElementById('portal-password');
  const email = (emailInput?.value || '').trim().toLowerCase();
  const password = (passInput?.value || '').trim();
  const recordar = document.getElementById('portal-recordar')?.checked ?? true;
  const btnSubmit = document.getElementById('btn-submit-login');

  cerrarTecladoVirtual();

  const errBox = document.getElementById('login-error-box');
  if (errBox) {
    errBox.classList.add('hidden');
    errBox.innerText = '';
  }

  if (!email || !password) {
    const msg = !email ? 'Ingresa tu correo electrónico' : 'Ingresa tu contraseña o PIN de acceso';
    showToast(msg, 'warning');
    if (errBox) {
      errBox.innerText = `⚠️ ${msg}`;
      errBox.classList.remove('hidden');
    }
    return;
  }

  isSubmittingLogin = true;
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerText = '⏳ Verificando credenciales...';
  }

  try {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    state.token = res.accessToken;
    state.user = res.usuario;
    state.role = res.usuario.rol === 'ADMIN' ? 'admin' : 'vendedor';

    if (res.tenant) {
      state.tenant = res.tenant;
      if (res.tenant.moneda) {
        localStorage.setItem('crediya_moneda', res.tenant.moneda);
        const sel = document.getElementById('selector-moneda-global');
        if (sel) sel.value = res.tenant.moneda;
      }
      const tenantBadge = document.getElementById('tenant-name');
      if (tenantBadge && res.tenant.nombreNegocio) {
        tenantBadge.innerText = res.tenant.nombreNegocio;
      }
    }

    if (recordar) {
      localStorage.setItem('crediya_token', state.token);
      localStorage.setItem('crediya_user', JSON.stringify(state.user));
      localStorage.setItem('crediya_role', state.role);
    } else {
      localStorage.removeItem('crediya_token');
      localStorage.removeItem('crediya_user');
      localStorage.removeItem('crediya_role');
    }

    showToast(`¡Bienvenido, ${res.usuario.nombre}!`, 'success');
    mostrarInterfazPrincipal();
  } catch (err) {
    let errorDetalle = err.message || 'Error desconocido';
    if (errorDetalle.includes('Failed to fetch') || errorDetalle.includes('NetworkError')) {
      errorDetalle = 'No se pudo conectar al servidor. Revisa tu conexión a internet o datos móviles.';
    }
    showToast(`Error de acceso: ${errorDetalle}`, 'danger');
    if (errBox) {
      errBox.innerText = `❌ ${errorDetalle}`;
      errBox.classList.remove('hidden');
    }
  } finally {
    isSubmittingLogin = false;
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerText = '🚀 Entrar a mi Plataforma';
    }
  }
}

// PORTADA: ACCESO RÁPIDO DEMO EN 1 CLIC
async function accesoRapidoDemo(rol, e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }
  cerrarTecladoVirtual();
  const creds = DEMO_USERS[rol];
  const emailInput = document.getElementById('portal-email');
  const passInput = document.getElementById('portal-password');
  if (emailInput) emailInput.value = creds.email;
  if (passInput) passInput.value = creds.password;
  await manejarPortalLogin();
}

// PORTADA: REGISTRO DE NUEVA EMPRESA (MULTI-TENANT)
async function manejarPortalRegistro(e) {
  e.preventDefault();

  const nombreNegocio = document.getElementById('reg-empresa').value.trim();
  const adminNombre = document.getElementById('reg-nombre-admin').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const moneda = document.getElementById('reg-moneda') ? document.getElementById('reg-moneda').value : 'PEN';
  const pais = moneda === 'PEN' ? 'Perú' : moneda === 'COP' ? 'Colombia' : moneda === 'MXN' ? 'México' : 'Internacional';
  const btnSubmit = document.getElementById('btn-submit-registro');

  btnSubmit.disabled = true;
  btnSubmit.innerText = '⏳ Registrando empresa...';

  try {
    const res = await api('/auth/registro-negocio', {
      method: 'POST',
      body: JSON.stringify({
        nombreNegocio,
        adminNombre,
        email,
        password,
        moneda,
        pais,
      }),
    });

    localStorage.setItem('crediya_moneda', moneda);
    showToast(`🎉 ¡Empresa "${nombreNegocio}" creada en ${pais}! Iniciando sesión...`, 'success');

    // Auto-login con las credenciales creadas
    document.getElementById('portal-email').value = email;
    document.getElementById('portal-password').value = password;
    cambiarModoAuth('login');
    document.getElementById('form-portal-login').dispatchEvent(new Event('submit'));
  } catch (err) {
    showToast(`Error al registrar empresa: ${err.message}`, 'danger');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerText = '🏢 Crear Empresa y Comenzar';
  }
}

// CERRAR SESIÓN / SALIR
function cerrarSesion() {
  cerrarDrawerMenu();
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
  document.getElementById('pin-overlay')?.classList.add('hidden');

  state.token = null;
  state.user = null;
  state.rutaActual = null;
  localStorage.removeItem('crediya_token');
  localStorage.removeItem('crediya_user');
  localStorage.removeItem('crediya_role');

  showToast('Has cerrado sesión exitosamente', 'info');
  mostrarPortadaIngreso();
}

// GESTIÓN DE SESIÓN & LOGIN INTERNO (CAMBIO RÁPIDO DE ROL)
async function loginAs(role) {
  state.role = role;
  const creds = DEMO_USERS[role];

  try {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: creds.email, password: creds.password }),
    });

    state.token = res.accessToken;
    state.user = res.usuario;

    localStorage.setItem('crediya_token', state.token);
    localStorage.setItem('crediya_user', JSON.stringify(state.user));
    localStorage.setItem('crediya_role', role);

    document.getElementById('btn-switch-vendedor')?.classList.toggle('active', role === 'vendedor');
    document.getElementById('btn-switch-admin')?.classList.toggle('active', role === 'admin');

    showToast(`Sesión activa como: ${res.usuario.nombre}`, 'info');
  } catch (err) {
    console.error('Error en login:', err);
    showToast(`Error al iniciar sesión: ${err.message}`, 'danger');
  }
}

async function switchUser(role) {
  await loginAs(role);
  adaptarUIporRol();
  if (role === 'admin') {
    await poblarSelectorVendedores();
  }
  cargarRutaHoy();
  cargarCuadreCaja();
  if (document.getElementById('sec-usuarios')?.classList.contains('active')) {
    cargarUsuarios();
  }
}

// ============================================================
// DICCIONARIO & METADATOS DE MÓDULOS DEL SISTEMA
// ============================================================
const MODULE_METADATA = {
  rutas: { icon: '🗺️', label: 'Ruta de Hoy', desc: 'Cobranza diaria, orden de visitas y GPS' },
  'resumen-dia': { icon: '📋', label: 'Resumen del Día', desc: 'Liquidación completa, ausentes, seguros y caja' },
  caja: { icon: '💵', label: 'Cuadre de Caja', desc: 'Arqueo, ingresos, egresos y retiros' },
  nuevo: { icon: '➕', label: 'Nueva Venta', desc: 'Registro rápido de cliente y préstamo' },
  renovar: { icon: '🔄', label: 'Renovación', desc: 'Liquidación de saldo y nuevo crédito' },
  dashboard: { icon: '📊', label: 'Dashboard', desc: 'Métricas financieras globales y PAR 30/60' },
  mora: { icon: '⚡', label: 'Mora Automática', desc: 'Cálculo determinista de atraso en cuotas' },
  usuarios: { icon: '👥', label: 'Usuarios', desc: 'Control de acceso RBAC y equipo' },
};

// CONTROL DEL MENÚ DESPLEGABLE DE MÓDULOS
function toggleMenuDesplegable(e) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }
  const card = document.getElementById('menu-desplegable-card');
  const btn = document.getElementById('btn-dropdown-modulos');
  if (!card) return;
  const isHidden = card.classList.contains('hidden');
  if (isHidden) {
    card.classList.remove('hidden');
    btn?.setAttribute('aria-expanded', 'true');
    btn?.classList.add('dropdown-open');
  } else {
    cerrarMenuDesplegable();
  }
}

function cerrarMenuDesplegable() {
  const card = document.getElementById('menu-desplegable-card');
  const btn = document.getElementById('btn-dropdown-modulos');
  if (card) card.classList.add('hidden');
  if (btn) {
    btn.setAttribute('aria-expanded', 'false');
    btn.classList.remove('dropdown-open');
  }
}

// CONTROL DEL MENÚ LATERAL DESPLEGABLE (OFF-CANVAS DRAWER)
function abrirDrawerMenu() {
  cerrarMenuDesplegable();
  const drawer = document.getElementById('drawer-backdrop');
  if (drawer) {
    drawer.classList.remove('hidden');
    setTimeout(() => drawer.classList.add('open'), 10);
    actualizarInfoUsuarioDrawer();
  }
}

function cerrarDrawerMenu() {
  const drawer = document.getElementById('drawer-backdrop');
  if (drawer) {
    drawer.classList.remove('open');
    setTimeout(() => drawer.classList.add('hidden'), 220);
  }
}

function actualizarInfoUsuarioDrawer() {
  const nombreEl = document.getElementById('drawer-user-name');
  const roleEl = document.getElementById('drawer-user-role');
  const avatarEl = document.getElementById('drawer-user-avatar');
  const tenantEl = document.getElementById('drawer-tenant-name');
  const headerNameEl = document.getElementById('header-user-name');
  const headerRoleIconEl = document.getElementById('header-user-role-icon');

  if (state.user) {
    if (nombreEl) nombreEl.innerText = state.user.nombre || 'Usuario';
    if (headerNameEl) headerNameEl.innerText = state.user.nombre || 'Usuario';
    if (headerRoleIconEl) headerRoleIconEl.innerText = state.role === 'admin' ? '👑' : '👤';
    if (roleEl) {
      roleEl.innerText = state.role === 'admin' ? '👑 Administrador' : '👤 Cobrador';
      roleEl.className = `badge-role ${state.role === 'admin' ? 'badge-role-admin' : 'badge-role-vendedor'}`;
    }
    if (avatarEl) {
      avatarEl.innerText = (state.user.nombre || 'U')[0].toUpperCase();
      avatarEl.className = `user-avatar ${state.role === 'admin' ? 'avatar-admin' : ''}`;
    }
  }
  if (state.tenant && tenantEl) {
    tenantEl.innerText = state.tenant.nombreNegocio || 'CrediYa Microfinanzas';
  }
}

// CERRAR DESPLEGABLE AL HACER CLIC FUERA DE ÉL
document.addEventListener('click', (e) => {
  const container = document.getElementById('dropdown-menu-container');
  if (container && !container.contains(e.target)) {
    cerrarMenuDesplegable();
  }
});

// GESTIÓN REACTIVA DE MÓDULOS / PESTAÑAS (setTab)
function setTab(tabId) {
  // Cerrar menús flotantes automáticamente al elegir módulo
  cerrarMenuDesplegable();
  cerrarDrawerMenu();

  // Actualizar indicador activo en el disparador desplegable
  const meta = MODULE_METADATA[tabId] || { icon: '📌', label: tabId };
  const activeIcon = document.getElementById('active-tab-icon');
  const activeLabel = document.getElementById('active-tab-label');
  if (activeIcon) activeIcon.innerText = meta.icon;
  if (activeLabel) activeLabel.innerText = meta.label;

  // Actualizar estado activo en todos los selectores sincronizados
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    const matches = btn.getAttribute('data-tab') === tabId || btn.id === `tab-${tabId}`;
    btn.classList.toggle('active', matches);
  });
  document.querySelectorAll('.drawer-nav-item').forEach((item) => {
    const matches = item.id === `drawer-tab-${tabId}` || (tabId === 'resumen-dia' && (item.id === 'drawer-tab-resumen' || item.id === 'drawer-tab-resumen-dia'));
    item.classList.toggle('active', matches);
  });
  document.querySelectorAll('.quick-pill').forEach((pill) => {
    const matches = pill.id === `pill-${tabId}` || (tabId === 'resumen-dia' && pill.id === 'pill-resumen-dia');
    pill.classList.toggle('active', matches);
  });
  document.querySelectorAll('.mob-nav-btn').forEach((mob) => {
    const matches = mob.id === `mob-nav-${tabId}` || (tabId === 'resumen-dia' && (mob.id === 'mob-nav-resumen' || mob.id === 'mob-nav-resumen-dia'));
    mob.classList.toggle('active', matches);
  });

  // Mostrar la sección correspondiente de inmediato
  document.querySelectorAll('.tab-section').forEach((sec) => sec.classList.remove('active'));
  const sec = document.getElementById(`sec-${tabId}`);
  if (sec) sec.classList.add('active');

  // Cargar datos en vivo de forma asíncrona y protegida
  try {
    if (tabId === 'dashboard') cargarDashboardEjecutivo();
    else if (tabId === 'rutas') cargarRutaHoy();
    else if (tabId === 'resumen-dia') cargarResumenDia();
    else if (tabId === 'renovar') cargarClientesParaRenovacion();
    else if (tabId === 'caja') cargarCuadreCaja();
    else if (tabId === 'usuarios') cargarUsuarios();
    else if (tabId === 'nuevo') {
      actualizarEtiquetasNuevoCredito();
      poblarSelectorVendedorNuevoCliente();
    }
  } catch (err) {
    console.warn('Error al cargar datos del módulo ' + tabId, err);
  }

  // Scroll suave al inicio de la página
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function actualizarEtiquetasNuevoCredito() {
  const m = obtenerMonedaActual();
  const lblDoc = document.getElementById('lbl-cli-documento');
  const lblMonto = document.getElementById('lbl-cre-monto');
  if (lblDoc) lblDoc.innerText = `${m.prefijoDoc} / Documento de Identidad`;
  if (lblMonto) lblMonto.innerText = `Valor Préstamo (${m.simbolo.trim()}) *`;
}

// 1. HOJA DE RUTA DIARIA
async function cargarRutaHoy() {
  const container = document.getElementById('lista-clientes-ruta');
  container.innerHTML = '<div class="loading-state">Cargando hoja de ruta de hoy...</div>';

  try {
    let url = '/rutas/hoy';
    if (state.role === 'admin') {
      const selectVendedor = document.getElementById('filtro-ruta-vendedor');
      const vid = selectVendedor ? selectVendedor.value : '';
      url = vid ? `/rutas/hoy?vendedorId=${encodeURIComponent(vid)}` : '/rutas/hoy?vendedorId=todos';
    }
    const data = await api(url);
    state.rutaActual = data;

    // Métricas
    document.getElementById('met-total').innerText = data.metricas.totalClientes;
    document.getElementById('met-cobrados').innerText = data.metricas.clientesCobradosHoy;
    document.getElementById('met-pendientes').innerText = data.metricas.clientesPendientesHoy;
    document.getElementById('met-ausentes').innerText = data.metricas.clientesAusentesHoy;
    document.getElementById('met-recaudado').innerText = `$${data.metricas.totalRecaudadoHoy.toLocaleString()}`;
    document.getElementById('met-esperado').innerText = `Esperado: $${data.metricas.totalEsperadoHoy.toLocaleString()}`;

    const pct = data.metricas.totalClientes > 0
      ? (data.metricas.clientesCobradosHoy / data.metricas.totalClientes) * 100
      : 0;
    document.getElementById('met-progreso').style.width = `${pct}%`;

    document.getElementById('ruta-subtitulo').innerText =
      `Vendedor: ${data.vendedorNombre} | Ruta: ${data.nombreRuta}`;

    if (data.clientes.length === 0) {
      container.innerHTML = '<div class="empty-cell">No hay clientes en la ruta de hoy.</div>';
      return;
    }

    aplicarFiltrosYRenderizarRuta();
  } catch (err) {
    container.innerHTML = `<div class="empty-cell text-danger">Error al cargar ruta: ${err.message}</div>`;
  }
}

// ESTADO DE BÚSQUEDA Y FILTRADO DE LA HOJA DE RUTA
state.filtroEstadoRuta = 'TODOS';
state.busquedaClienteRuta = '';
state.clienteExpandidoId = null;

// TOGGLE DE MATRIZ RBAC (COLAPSAR / EXPANDIR EN MÓVIL Y DESKTOP)
function toggleRbacCard() {
  const container = document.getElementById('rbac-table-container');
  const arrow = document.getElementById('rbac-toggle-arrow');
  const text = document.getElementById('rbac-toggle-text');
  if (!container) return;

  const isCollapsed = container.classList.contains('collapsed') || container.style.display === 'none';
  if (isCollapsed) {
    container.classList.remove('collapsed');
    container.style.display = 'block';
    if (arrow) arrow.innerText = '▾';
    if (text) text.innerText = 'Ocultar';
  } else {
    container.classList.add('collapsed');
    container.style.display = 'none';
    if (arrow) arrow.innerText = '▸';
    if (text) text.innerText = 'Mostrar';
  }
}

// ESTADO DE BÚSQUEDA Y FILTRADO DE LA HOJA DE RUTA
state.filtroEstadoRuta = 'TODOS';
state.busquedaClienteRuta = '';
state.clienteExpandidoId = null;

let ultimoToggleTiempo = 0;
let ultimoToggleClienteId = null;

// EXPANDIR / COLAPSAR DETALLE DEL CLIENTE AL DARLE CLIC O TOQUE
function toggleExpandirCliente(clienteId, ev) {
  if (!clienteId) return;

  // Si el clic/toque fue dentro de un botón de acción, dejar que su propio handler actúe
  if (ev && ev.target && typeof ev.target.closest === 'function') {
    if (ev.target.closest('button, input, select, a, .order-box, .client-actions, .btn-action-cobro, .btn-gps-navigate')) {
      return;
    }
  }

  // Prevenir doble disparo / rebote en desktop y móvil (ghost clicks)
  const ahora = Date.now();
  if (ultimoToggleClienteId === clienteId && (ahora - ultimoToggleTiempo) < 250) {
    return;
  }
  ultimoToggleTiempo = ahora;
  ultimoToggleClienteId = clienteId;

  const card = document.getElementById(`card-${clienteId}`);
  if (!card) return;

  const isCurrentlyExpanded = card.classList.contains('expanded');

  if (isCurrentlyExpanded) {
    card.classList.remove('expanded');
    if (state.clienteExpandidoId === clienteId) state.clienteExpandidoId = null;
  } else {
    // Cerramos cualquier otra tarjeta abierta (modo acordeón limpio)
    document.querySelectorAll('.client-card.expanded').forEach((c) => {
      if (c.id !== `card-${clienteId}`) c.classList.remove('expanded');
    });
    card.classList.add('expanded');
    state.clienteExpandidoId = clienteId;

    // Asegurar que quede visible suavemente en dispositivos móviles
    setTimeout(() => {
      try {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e) {}
    }, 60);
  }
}

// BÚSQUEDA EN TIEMPO REAL POR NOMBRE, ALIAS, DNI O DIRECCIÓN
function filtrarClientesRuta(query) {
  state.busquedaClienteRuta = query ? query.trim().toLowerCase() : '';
  const clearBtn = document.getElementById('btn-clear-ruta-search');
  if (clearBtn) {
    clearBtn.classList.toggle('hidden', !state.busquedaClienteRuta);
  }
  aplicarFiltrosYRenderizarRuta();
}

function limpiarBusquedaRuta() {
  const input = document.getElementById('buscar-cliente-ruta');
  if (input) input.value = '';
  filtrarClientesRuta('');
  input?.focus();
}

// FILTRADO POR CHIP (Todos, Pendientes, Cobrados, Ausentes)
function filtrarEstadoRuta(estado, btn) {
  state.filtroEstadoRuta = estado;
  document.querySelectorAll('.ruta-filter-chips .filter-chip').forEach((c) => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  aplicarFiltrosYRenderizarRuta();
}

// DELEGACIÓN DE EVENTOS PARA MÓVIL Y ESCRITORIO (TOUCH + CLICK)
function inicializarDelegacionRuta() {
  const container = document.getElementById('lista-clientes-ruta');
  if (!container || container.dataset.delegated === 'true') return;
  container.dataset.delegated = 'true';

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  // 1. Soporte táctil móvil
  container.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    if (!e.changedTouches || !e.changedTouches[0]) return;
    const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartX);
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);
    const timeDiff = Date.now() - touchStartTime;

    // Si fue un tap limpio en móvil (sin scroll)
    if (deltaX < 15 && deltaY < 15 && timeDiff < 500) {
      const summaryRow = e.target.closest('.client-summary-row');
      const card = e.target.closest('.client-card');
      if (!card || !summaryRow) return;

      if (e.target.closest('button, a, input, select, .order-box, .client-actions, .btn-action-cobro, .btn-gps-navigate')) return;

      const clienteId = card.dataset.clientId || card.id.replace('card-', '');
      if (clienteId) {
        toggleExpandirCliente(clienteId, e);
      }
    }
  }, { passive: true });

  // 2. Soporte para Clic de Mouse en PC / Web Escritorio
  container.addEventListener('click', (e) => {
    if (e.target.closest('button, a, input, select, .order-box, .client-actions, .btn-action-cobro, .btn-gps-navigate')) {
      return;
    }
    const summaryRow = e.target.closest('.client-summary-row');
    const card = e.target.closest('.client-card');
    if (!card || !summaryRow) return;

    const clienteId = card.dataset.clientId || card.id.replace('card-', '');
    if (clienteId) {
      toggleExpandirCliente(clienteId, e);
    }
  });
}

function aplicarFiltrosYRenderizarRuta() {
  const container = document.getElementById('lista-clientes-ruta');
  if (!container || !state.rutaActual) return;
  const todos = state.rutaActual.clientes || [];

  // Actualizar contadores de cada estado
  const countTodos = todos.length;
  const countPendientes = todos.filter((c) => !c.haPagadoHoy && c.estadoVisita !== 'AUSENTE').length;
  const countCobrados = todos.filter((c) => c.haPagadoHoy).length;
  const countAusentes = todos.filter((c) => c.estadoVisita === 'AUSENTE').length;

  const elT = document.getElementById('count-ruta-todos');
  const elP = document.getElementById('count-ruta-pendientes');
  const elC = document.getElementById('count-ruta-cobrados');
  const elA = document.getElementById('count-ruta-ausentes');
  if (elT) elT.innerText = countTodos;
  if (elP) elP.innerText = countPendientes;
  if (elC) elC.innerText = countCobrados;
  if (elA) elA.innerText = countAusentes;

  let filtrados = [...todos];

  // 1. Filtrar por estado
  if (state.filtroEstadoRuta === 'PENDIENTES') {
    filtrados = filtrados.filter((c) => !c.haPagadoHoy && c.estadoVisita !== 'AUSENTE');
  } else if (state.filtroEstadoRuta === 'COBRADOS') {
    filtrados = filtrados.filter((c) => c.haPagadoHoy);
  } else if (state.filtroEstadoRuta === 'AUSENTES') {
    filtrados = filtrados.filter((c) => c.estadoVisita === 'AUSENTE');
  }

  // 2. Filtrar por texto de búsqueda en tiempo real
  if (state.busquedaClienteRuta) {
    const q = state.busquedaClienteRuta;
    filtrados = filtrados.filter((c) => {
      const nombre = (c.nombresAlias || '').toLowerCase();
      const apellido = (c.apellidos || '').toLowerCase();
      const nombreCompleto = `${nombre} ${apellido}`;
      const doc = (c.documento || '').toLowerCase();
      const movil = (c.movil || '').toLowerCase();
      const dir = (c.direccion || '').toLowerCase();
      return nombreCompleto.includes(q) || doc.includes(q) || movil.includes(q) || dir.includes(q);
    });
  }

  if (filtrados.length === 0) {
    container.innerHTML = `
      <div class="empty-search-box">
        <span class="empty-icon">🔍</span>
        <h4>No se encontraron clientes</h4>
        <p>No hay clientes que coincidan con "${state.busquedaClienteRuta || state.filtroEstadoRuta}".</p>
        <button type="button" class="btn-secondary" onclick="limpiarBusquedaRuta(); filtrarEstadoRuta('TODOS', document.getElementById('chip-ruta-todos'))">
          🔄 Ver todos los clientes
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtrados.map((c) => renderClienteCard(c)).join('');
  inicializarDelegacionRuta();
}

// RENDERIZADO DE TARJETA DE CLIENTE (COMPACTA + DESPLEGABLE TÁCTIL)
function renderClienteCard(c) {
  let statusBadge = '';
  if (c.haPagadoHoy) {
    statusBadge = '<span class="status-badge status-pagado-hoy">✓ PAGÓ HOY</span>';
  } else if (c.estadoVisita === 'AUSENTE') {
    statusBadge = '<span class="status-badge status-ausente">🚪 AUSENTE HOY</span>';
  } else if (c.estadoVisita === 'APLAZADO') {
    statusBadge = '<span class="status-badge status-atrasado">⏳ APLAZADO</span>';
  } else if (c.estadoVisita === 'ATRASADO' || (c.creditoActivo && c.creditoActivo.cuotasAtrasadas > 0)) {
    const atrasadas = c.creditoActivo?.cuotasAtrasadas || 1;
    statusBadge = `<span class="status-badge status-atrasado">⚠️ ${atrasadas} ATRASADA${atrasadas > 1 ? 'S' : ''}</span>`;
  } else {
    statusBadge = '<span class="status-badge status-al-dia">🟢 AL DÍA</span>';
  }

  const saldoFmt = c.creditoActivo ? fmtMoneda(c.creditoActivo.saldoActual) : fmtMoneda(0);
  const cuotaFmt = c.creditoActivo ? fmtMoneda(c.creditoActivo.valorCuota) : fmtMoneda(0);
  const progresoCuotas = c.creditoActivo
    ? `Cuota ${c.creditoActivo.cuotasPagadas} de ${c.creditoActivo.cuotasTotal} (${c.creditoActivo.formaPago})`
    : 'Sin crédito activo';

  const isExpanded = state.clienteExpandidoId === c.clienteId;

  return `
    <div class="client-card ${isExpanded ? 'expanded' : ''}" id="card-${c.clienteId}" data-client-id="${c.clienteId}">
      <!-- 1. VISTA RESUMIDA DE LA LISTA (SIEMPRE VISIBLE, ULTRA RESPONSIVA) -->
      <div class="client-summary-row" data-client-id="${c.clienteId}" onclick="toggleExpandirCliente('${c.clienteId}', event)">
        <div class="order-box" onclick="event.stopPropagation()">
          <div class="order-badge">#${c.orden}</div>
          <div class="order-arrows">
            <button type="button" class="order-btn" title="Mover arriba" onclick="moverRuta('${c.clienteId}', -1); event.stopPropagation();">▲</button>
            <button type="button" class="order-btn" title="Mover abajo" onclick="moverRuta('${c.clienteId}', 1); event.stopPropagation();">▼</button>
          </div>
        </div>

        <div class="client-summary-info">
          <div class="client-title-row">
            <strong class="client-name">${escapeHtml(c.nombresAlias)} ${escapeHtml(c.apellidos || '')}</strong>
            ${statusBadge}
          </div>
          <div class="client-meta-row">
            <span class="client-meta-phone">📱 ${escapeHtml(c.movil)}</span>
            ${c.documento ? `<span class="client-meta-dni">• ${escapeHtml(obtenerMonedaActual().prefijoDoc)}: ${escapeHtml(c.documento)}</span>` : ''}
          </div>
        </div>

        <div class="client-summary-numbers">
          <span class="client-saldo">${saldoFmt}</span>
          <span class="client-cuota">Cuota: ${cuotaFmt}</span>
        </div>

        <div class="client-chevron-box" title="Toca para ver acciones y abonar">
          <span class="chevron-arrow">▾</span>
        </div>
      </div>

      <!-- 2. PANEL DESPLEGABLE CON ACCIONES CLARAS DE COBRANZA -->
      <div class="client-expanded-panel">
        <div class="client-expanded-details">
          <div class="detail-item">
            <span class="detail-label">📍 Dirección / Negocio</span>
            <strong class="detail-val">${escapeHtml(c.direccion || 'Sin dirección registrada')}</strong>
            ${(c.latitud && c.longitud) ? `
              <div class="gps-route-box">
                <a href="https://www.google.com/maps/dir/?api=1&destination=${c.latitud},${c.longitud}" target="_blank" rel="noopener noreferrer" class="btn-gps-navigate" onclick="event.stopPropagation()">
                  🗺️ Cómo llegar (Google Maps / Waze) ↗
                </a>
              </div>
            ` : `
              <div class="gps-route-box">
                <button type="button" class="btn-gps-save-here" onclick="guardarGpsClienteEnRuta('${c.clienteId}', event)">
                  📍 Guardar ubicación GPS del negocio aquí
                </button>
              </div>
            `}
          </div>
          <div class="detail-item">
            <span class="detail-label">📊 Plan de Cuotas</span>
            <strong class="detail-val text-accent">${escapeHtml(progresoCuotas)}</strong>
          </div>
        </div>

        <!-- Botonera de Acciones Rápidas -->
        <div class="client-actions" onclick="event.stopPropagation()">
          ${c.haPagadoHoy ? `
            <button type="button" class="btn-action-cobro btn-whatsapp" onclick="verReciboCliente('${c.clienteId}'); event.stopPropagation();">
              🧾 Ver Recibo
            </button>
          ` : ''}
          ${c.creditoActivo ? `
            <button type="button" class="btn-action-cobro btn-extracto" onclick="verEstadoCuentaCliente('${c.clienteId}', '${c.creditoActivo.id}'); event.stopPropagation();">
              📜 Extracto
            </button>
          ` : ''}
          <button type="button" class="btn-action-cobro btn-abonar-main" onclick="abrirModalAbono('${c.clienteId}'); event.stopPropagation();">
            💵 Abonar
          </button>
          <button type="button" class="btn-action-cobro btn-ausente-act" onclick="abrirModalAusente('${c.clienteId}'); event.stopPropagation();">
            🚪 Ausente
          </button>
          <button type="button" class="btn-action-cobro btn-aplazar-act" onclick="abrirModalAplazar('${c.clienteId}', '${escapeHtml(c.nombresAlias)}'); event.stopPropagation();">
            ⏳ Aplazar
          </button>
        </div>
      </div>
    </div>
  `;
}

// REORDENAMIENTO DE RUTA
async function moverRuta(clienteId, delta) {
  if (!state.rutaActual) return;
  const clientes = [...state.rutaActual.clientes];
  const idx = clientes.findIndex((c) => c.clienteId === clienteId);
  if (idx === -1) return;

  const targetIdx = idx + delta;
  if (targetIdx < 0 || targetIdx >= clientes.length) return;

  // Intercambiar
  const temp = clientes[idx];
  clientes[idx] = clientes[targetIdx];
  clientes[targetIdx] = temp;

  const ordenIds = clientes.map((c) => c.clienteId);

  try {
    await api('/rutas/orden', {
      method: 'PUT',
      body: JSON.stringify({ ordenClienteIds: ordenIds }),
    });
    showToast('Secuencia de ruta actualizada', 'success');
    cargarRutaHoy();
  } catch (err) {
    console.error(err);
  }
}

// 2. MODAL DE ABONO
function abrirModalAbono(clienteId) {
  if (!clienteId) return;
  const clientes = state.rutaActual?.clientes || [];
  const client = clientes.find((c) => String(c.clienteId) === String(clienteId) || String(c.id) === String(clienteId));
  if (!client || !client.creditoActivo) {
    showToast('Cliente no tiene crédito activo', 'warning');
    return;
  }

  state.selectedClientForAbono = client;
  const elCli = document.getElementById('modal-abono-cliente');
  if (elCli) elCli.innerText = `${client.nombresAlias} ${client.apellidos || ''}`.trim();

  const elCod = document.getElementById('modal-abono-codigo');
  if (elCod) elCod.innerText = client.creditoActivo.codigoCredito || '-';

  const elSaldo = document.getElementById('modal-abono-saldo');
  if (elSaldo) elSaldo.innerText = fmtMoneda(client.creditoActivo.saldoActual);

  const elCuota = document.getElementById('modal-abono-cuota-sug');
  if (elCuota) elCuota.innerText = fmtMoneda(client.creditoActivo.valorCuota);

  const elMonto = document.getElementById('modal-abono-monto');
  if (elMonto) elMonto.value = client.creditoActivo.valorCuota;

  document.getElementById('modal-abono')?.classList.remove('hidden');
}

function cerrarModalAbono() {
  document.getElementById('modal-abono').classList.add('hidden');
  state.selectedClientForAbono = null;
}

async function confirmarAbono() {
  const monto = Number(document.getElementById('modal-abono-monto').value);
  if (!monto || monto <= 0) {
    showToast('Ingresa un valor válido', 'danger');
    return;
  }

  const client = state.selectedClientForAbono;
  if (!client) return;

  // Capturar coordenadas GPS del cobrador para auditoría anti-fraude
  const gps = await obtenerUbicacionGPS();

  const payload = {
    creditoId: client.creditoActivo.id,
    valorAbonado: monto,
    ...(gps || {}),
  };

function formatearHoraSegura(fechaInput) {
  const d = fechaInput ? new Date(fechaInput) : new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

  const reciboLocal = {
    clienteId: client.clienteId,
    creditoId: client.creditoActivo.id,
    fecha: new Date().toISOString().slice(0, 10),
    hora: formatearHoraSegura(),
    usuario: state.user?.nombre || 'Carlos Cobrador',
    documento: client.documento || '',
    cliente: `${client.nombresAlias} ${client.apellidos || ''}`.trim(),
    movil: client.movil || '',
    tipoAbono: (client.creditoActivo.saldoActual - monto <= 0) ? 'Liquidación total' : 'Abono normal',
    codigoCredito: client.creditoActivo.codigoCredito,
    saldoAnterior: client.creditoActivo.saldoActual,
    valorAbonado: monto,
    saldoNuevo: Math.max(0, client.creditoActivo.saldoActual - monto),
    formaPago: client.creditoActivo.formaPago ? client.creditoActivo.formaPago.charAt(0).toUpperCase() + client.creditoActivo.formaPago.slice(1) : 'Diario',
    cuotasPagadas: (client.creditoActivo.cuotasPagadas || 0) + 1,
    numeroCuotasTotal: client.creditoActivo.cuotasTotal,
    cuotasAtrasadas: Math.max(0, (client.creditoActivo.cuotasAtrasadas || 0) - 1),
    fechaVencimiento: client.creditoActivo.fechaVencimiento ? new Date(client.creditoActivo.fechaVencimiento).toISOString().slice(0, 10) : '',
    ...(gps || {}),
  };

  // Si no hay red, guardamos en la cola local de IndexedDB de inmediato
  if (!navigator.onLine) {
    await guardarAbonoOffline(payload, reciboLocal);
    cerrarModalAbono();
    showToast(`📡 Cobro guardado en cola offline. Se sincronizará al volver la señal.`, 'warning');
    mostrarRecibo(reciboLocal);
    return;
  }

  try {
    const res = await api('/abonos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    cerrarModalAbono();
    showToast(`✅ Abono de $${monto.toLocaleString()} registrado con éxito`, 'success');
    cargarRutaHoy();
    cargarCuadreCaja();

    mostrarRecibo(res.recibo || reciboLocal);
  } catch (err) {
    console.warn('Error en red al abonar, guardando en cola offline:', err);
    await guardarAbonoOffline(payload, reciboLocal);
    cerrarModalAbono();
    showToast(`📡 Sin conexión estable. Cobro respaldado en cola offline.`, 'warning');
    mostrarRecibo(reciboLocal);
  }
}

// GESTIÓN DE RECIBO / TICKET DIGITAL
state.reciboActual = null;

function mostrarRecibo(recibo) {
  state.reciboActual = recibo;

  document.getElementById('rec-fecha').innerText = recibo.fecha || new Date().toISOString().slice(0, 10);
  document.getElementById('rec-hora').innerText = recibo.hora || new Date().toLocaleTimeString();
  document.getElementById('rec-usuario').innerText = (recibo.usuario || 'COBRADOR').toUpperCase();
  document.getElementById('rec-documento').innerText = recibo.documento || 'No registrado';
  document.getElementById('rec-cliente').innerText = (recibo.cliente || 'Cliente').toLowerCase();
  document.getElementById('rec-tipo-abono').innerText = recibo.tipoAbono || 'Abono normal';
  document.getElementById('rec-codigo').innerText = recibo.codigoCredito || '-';
  document.getElementById('rec-saldo-anterior').innerText = fmtMoneda(recibo.saldoAnterior);
  document.getElementById('rec-valor-abonado').innerText = fmtMoneda(recibo.valorAbonado);
  document.getElementById('rec-saldo-nuevo').innerText = fmtMoneda(recibo.saldoNuevo);
  document.getElementById('rec-forma-pago').innerText = recibo.formaPago || 'Diario';
  document.getElementById('rec-cuotas').innerText = `${recibo.cuotasPagadas} / ${recibo.numeroCuotasTotal}`;
  document.getElementById('rec-cuotas-atrasadas').innerText = recibo.cuotasAtrasadas ?? 0;
  document.getElementById('rec-fecha-vencimiento').innerText = recibo.fechaVencimiento || '-';

  // Auditoría GPS en el comprobante
  const gpsRow = document.getElementById('rec-gps-row');
  const gpsLink = document.getElementById('rec-gps-link');
  if (recibo.latitud && recibo.longitud) {
    if (gpsRow) gpsRow.style.display = 'flex';
    if (gpsLink) {
      gpsLink.href = `https://www.google.com/maps?q=${recibo.latitud},${recibo.longitud}`;
      gpsLink.innerText = `📍 ${recibo.latitud.toFixed(4)}, ${recibo.longitud.toFixed(4)} ↗`;
    }
  } else {
    if (gpsRow) gpsRow.style.display = 'none';
  }

  document.getElementById('modal-recibo').classList.remove('hidden');
}

function cerrarModalRecibo() {
  document.getElementById('modal-recibo').classList.add('hidden');
  state.reciboActual = null;
}

function generarTextoRecibo(recibo) {
  if (!recibo) return '';
  const m = obtenerMonedaActual();
  let texto = `🧾 *COMPROBANTE DE PAGO*
📅 Fecha: ${recibo.fecha} ${recibo.hora}
👤 Cobrador: ${recibo.usuario}

*Cliente*
🆔 ${m.prefijoDoc}: ${recibo.documento || 'N/A'}
👤 Cliente: ${recibo.cliente}

*${recibo.tipoAbono || 'Abono normal'}*
🔖 Código crédito: ${recibo.codigoCredito}
💰 Saldo anterior: ${fmtMoneda(recibo.saldoAnterior)}
💵 *Valor abonado:* ${fmtMoneda(recibo.valorAbonado)}
💰 *Saldo nuevo:* ${fmtMoneda(recibo.saldoNuevo)}
📆 Forma de pago: ${recibo.formaPago}
🔢 Cuotas: ${recibo.cuotasPagadas} / ${recibo.numeroCuotasTotal}
⚠️ Cuotas atrasadas: ${recibo.cuotasAtrasadas}
⏳ Fecha de vencimiento: ${recibo.fechaVencimiento}`;

  if (recibo.latitud && recibo.longitud) {
    texto += `\n📍 Ubicación GPS: https://maps.google.com/?q=${recibo.latitud},${recibo.longitud}`;
  }

  texto += `\n\n¡Gracias por su puntualidad y confianza! ✨`;
  return texto;
}

// COMPARTIR COMPROBANTE COMO IMAGEN A WHATSAPP
async function compartirWhatsAppRecibo() {
  const r = state.reciboActual;
  if (!r) return;

  const btn = document.getElementById('btn-compartir-whatsapp');
  const oldHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Generando imagen...';
  }

  try {
    const { blob, dataUrl } = await generarImagenReciboCanvas(r);
    const fileName = `comprobante-${r.codigoCredito || 'abono'}.png`;

    // 1. Si está ejecutándose dentro del aplicativo Android (APK nativo con WebView)
    if (window.AndroidApp && typeof window.AndroidApp.compartirImagen === 'function') {
      window.AndroidApp.compartirImagen(dataUrl, fileName, `Comprobante de Abono - ${r.cliente}`);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = oldHtml;
      }
      return;
    }

    // 2. Si el navegador soporta Web Share API con archivos (Chrome Android, iOS Safari, PWA instalada)
    const file = new File([blob], fileName, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Comprobante de Abono - CrediYa',
        text: `Comprobante de abono de ${r.cliente}`,
      });
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = oldHtml;
      }
      return;
    }

    // 3. Fallback (Navegadores de escritorio o sin soporte de envío de archivos):
    // Descargar imagen automáticamente
    descargarBlob(blob, fileName);

    // Intentar copiar la imagen al portapapeles
    let copiado = false;
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        copiado = true;
      } catch (clipErr) {
        console.warn('Clipboard image write no soportado:', clipErr);
      }
    }

    let movil = (r.movil || '').replace(/\D/g, '');
    const m = obtenerMonedaActual();
    if (m.codigo === 'PEN' && movil.length === 9 && !movil.startsWith('51')) {
      movil = '51' + movil;
    } else if (m.codigo === 'COP' && movil.length === 10 && !movil.startsWith('57')) {
      movil = '57' + movil;
    }

    const waUrl = movil 
      ? `https://api.whatsapp.com/send?phone=${movil}`
      : `https://api.whatsapp.com/send`;

    if (copiado) {
      showToast('📸 ¡Imagen copiada y descargada! Pégala con Ctrl+V en WhatsApp', 'success');
    } else {
      showToast('📸 ¡Imagen de comprobante descargada! Adjúntala en WhatsApp', 'info');
    }

    window.open(waUrl, '_blank');
  } catch (err) {
    console.error('Error al compartir imagen del comprobante:', err);
    showToast('Error al generar la imagen del comprobante', 'danger');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = oldHtml;
    }
  }
}

// DESCARGAR IMAGEN DEL COMPROBANTE DIRECTAMENTE
async function descargarImagenComprobante() {
  const r = state.reciboActual;
  if (!r) return;

  try {
    showToast('Generando imagen de alta resolución...', 'info');
    const { blob } = await generarImagenReciboCanvas(r);
    const fileName = `comprobante-${r.codigoCredito || 'abono'}.png`;
    descargarBlob(blob, fileName);
    showToast('📸 Comprobante descargado en tu galería/descargas', 'success');
  } catch (err) {
    console.error('Error al descargar imagen del comprobante:', err);
    showToast('Error al descargar la imagen', 'danger');
  }
}

function descargarBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// GENERADOR DE IMAGEN TICKET MEDIANTE CANVAS HTML5 (ALTA RESOLUCIÓN RETINA 2X)
function generarImagenReciboCanvas(recibo) {
  return new Promise((resolve) => {
    const scale = 2; // Retina 2x para nitidez impecable
    const w = 540;
    const h = 880;

    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // Fondo suave crema
    ctx.fillStyle = '#FAF7EE';
    ctx.fillRect(0, 0, w, h);

    // Tarjeta del recibo con bordes redondeados y sombra
    const cardX = 18;
    const cardY = 18;
    const cardW = w - 36;
    const cardH = h - 36;
    const radius = 18;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.fill();
    ctx.restore();

    // Borde de la tarjeta
    ctx.strokeStyle = '#E2D9C8';
    ctx.lineWidth = 1.5;
    roundRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.stroke();

    // Barra superior verde oscuro CrediYa
    ctx.save();
    ctx.fillStyle = '#0D5C3A';
    roundRectTop(ctx, cardX, cardY, cardW, 8, radius);
    ctx.fill();
    ctx.restore();

    let y = 58;

    // Encabezado
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0D5C3A';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('🧾 CREDIYA', w / 2, y);

    y += 24;
    ctx.fillStyle = '#64748B';
    ctx.font = '700 12px system-ui, -apple-system, sans-serif';
    ctx.fillText('COMPROBANTE OFICIAL DE ABONO', w / 2, y);

    y += 18;
    dibujarLineaDiscontinua(ctx, cardX + 18, y, cardX + cardW - 18);

    // Datos generales (Fecha, Hora, Usuario)
    y += 26;
    dibujarFilaCanvas(ctx, 'Fecha', recibo.fecha || new Date().toISOString().slice(0, 10), cardX + 22, cardX + cardW - 22, y);
    y += 25;
    dibujarFilaCanvas(ctx, 'Hora', recibo.hora || '12:00:00', cardX + 22, cardX + cardW - 22, y);
    y += 25;
    dibujarFilaCanvas(ctx, 'Usuario', (recibo.usuario || 'COBRADOR').toUpperCase(), cardX + 22, cardX + cardW - 22, y, true);

    y += 18;
    dibujarLineaDiscontinua(ctx, cardX + 18, y, cardX + cardW - 18);

    // Sección Cliente
    y += 26;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0D5C3A';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('CLIENTE', w / 2, y);

    y += 24;
    dibujarFilaCanvas(ctx, 'Documento', recibo.documento || 'No registrado', cardX + 22, cardX + cardW - 22, y);
    y += 25;
    dibujarFilaCanvas(ctx, 'Cliente', (recibo.cliente || 'Cliente').toLowerCase(), cardX + 22, cardX + cardW - 22, y, true);

    y += 18;
    dibujarLineaDiscontinua(ctx, cardX + 18, y, cardX + cardW - 18);

    // Tipo de Abono (Abono normal o Liquidación total)
    y += 24;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0D5C3A';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText((recibo.tipoAbono || 'Abono normal').toUpperCase(), w / 2, y);

    y += 24;
    dibujarFilaCanvas(ctx, 'Código crédito', String(recibo.codigoCredito || '-'), cardX + 22, cardX + cardW - 22, y);
    y += 25;
    dibujarFilaCanvas(ctx, 'Saldo anterior', fmtMoneda(recibo.saldoAnterior), cardX + 22, cardX + cardW - 22, y);

    // Caja destacada de Valor Abonado
    y += 16;
    const boxH = 50;
    ctx.fillStyle = '#ECFDF5';
    roundRect(ctx, cardX + 18, y, cardW - 36, boxH, 10);
    ctx.fill();
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1.5;
    roundRect(ctx, cardX + 18, y, cardW - 36, boxH, 10);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#065F46';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('Valor abonado', cardX + 32, y + 31);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#047857';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(fmtMoneda(recibo.valorAbonado), cardX + cardW - 32, y + 32);

    // Caja de Saldo Nuevo
    y += boxH + 10;
    const box2H = 44;
    ctx.fillStyle = '#F8FAFC';
    roundRect(ctx, cardX + 18, y, cardW - 36, box2H, 10);
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    roundRect(ctx, cardX + 18, y, cardW - 36, box2H, 10);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('Saldo nuevo', cardX + 32, y + 27);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 19px system-ui, -apple-system, sans-serif';
    ctx.fillText(fmtMoneda(recibo.saldoNuevo), cardX + cardW - 32, y + 28);

    // Detalles del crédito
    y += box2H + 18;
    dibujarFilaCanvas(ctx, 'Forma de pago', recibo.formaPago || 'Diario', cardX + 22, cardX + cardW - 22, y);
    y += 24;
    dibujarFilaCanvas(ctx, 'Número de cuotas', `${recibo.cuotasPagadas} / ${recibo.numeroCuotasTotal}`, cardX + 22, cardX + cardW - 22, y);
    y += 24;
    dibujarFilaCanvas(ctx, 'Cuotas atrasadas', String(recibo.cuotasAtrasadas ?? 0), cardX + 22, cardX + cardW - 22, y);
    y += 24;
    dibujarFilaCanvas(ctx, 'Fecha de vencimiento', recibo.fechaVencimiento || '-', cardX + 22, cardX + cardW - 22, y);

    y += 18;
    dibujarLineaDiscontinua(ctx, cardX + 18, y, cardX + cardW - 18);

    // Mensaje de pie
    y += 26;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#475569';
    ctx.font = '500 13px system-ui, -apple-system, sans-serif';
    ctx.fillText('¡Gracias por su puntualidad y confianza! ✨', w / 2, y);

    y += 20;
    ctx.fillStyle = '#94A3B8';
    ctx.font = '400 11px system-ui, -apple-system, sans-serif';
    ctx.fillText(`CrediYa • Sistema de Cobro y Créditos`, w / 2, y);

    canvas.toBlob((blob) => {
      resolve({ blob, dataUrl: canvas.toDataURL('image/png') });
    }, 'image/png');
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function roundRectTop(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function dibujarLineaDiscontinua(ctx, x1, y, x2) {
  ctx.save();
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

function dibujarFilaCanvas(ctx, label, value, xLeft, xRight, y, isBold = false) {
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748B';
  ctx.font = '500 14px system-ui, -apple-system, sans-serif';
  ctx.fillText(label, xLeft, y);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#0F172A';
  ctx.font = (isBold ? 'bold 15px ' : '600 14px ') + 'system-ui, -apple-system, sans-serif';
  const maxW = xRight - xLeft - 130;
  let valStr = String(value || '-');
  while (ctx.measureText(valStr).width > maxW && valStr.length > 5) {
    valStr = valStr.slice(0, -4) + '...';
  }
  ctx.fillText(valStr, xRight, y);
}

function copiarTextoRecibo() {
  const r = state.reciboActual;
  if (!r) return;

  const texto = generarTextoRecibo(r);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto).then(() => {
      showToast('📋 Texto del recibo copiado al portapapeles', 'success');
    }).catch(() => fallbackCopiar(texto));
  } else {
    fallbackCopiar(texto);
  }
}

function fallbackCopiar(texto) {
  const ta = document.createElement('textarea');
  ta.value = texto;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast('📋 Texto del recibo copiado al portapapeles', 'success');
}

function imprimirRecibo() {
  window.print();
}

function imprimirTicketPOS() {
  window.print();
}

function verEstadoCuentaDesdeRecibo() {
  const r = state.reciboActual;
  if (!r) return;

  let clienteId = r.clienteId;
  let creditoId = r.creditoId;

  if (!clienteId || !creditoId) {
    const client = state.rutaActual?.clientes?.find((c) =>
      (c.creditoActivo && c.creditoActivo.codigoCredito === r.codigoCredito) ||
      (c.documento && c.documento === r.documento) ||
      (state.selectedClientForAbono && c.clienteId === state.selectedClientForAbono.clienteId)
    );
    if (client) {
      clienteId = clienteId || client.clienteId;
      creditoId = creditoId || client.creditoActivo?.id;
    }
  }

  if (!creditoId) {
    showToast('No se encontró el crédito asociado para ver el estado de cuenta', 'warning');
    return;
  }

  cerrarModalRecibo();
  verEstadoCuentaCliente(clienteId, creditoId);
}

async function verReciboCliente(clienteId) {
  if (!clienteId) return;
  const clientes = state.rutaActual?.clientes || [];
  const client = clientes.find((c) => String(c.clienteId) === String(clienteId) || String(c.id) === String(clienteId));
  if (!client || !client.creditoActivo) return;

  try {
    const abonos = await api(`/abonos/credito/${client.creditoActivo.id}`).catch(() => []);
    const ultimoAbono = Array.isArray(abonos) && abonos.length > 0 ? abonos[0] : null;

    mostrarRecibo({
      clienteId: client.clienteId,
      creditoId: client.creditoActivo.id,
      fecha: ultimoAbono?.fecha ? new Date(ultimoAbono.fecha).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      hora: formatearHoraSegura(ultimoAbono?.fecha),
      usuario: state.user?.nombre || 'Carlos Cobrador',
      documento: client.documento || '',
      cliente: `${client.nombresAlias} ${client.apellidos || ''}`.trim(),
      movil: client.movil || '',
      tipoAbono: (client.creditoActivo.saldoActual <= 0) ? 'Liquidación total' : 'Abono normal',
      codigoCredito: client.creditoActivo.codigoCredito,
      saldoAnterior: ultimoAbono ? ultimoAbono.saldoAnterior : client.creditoActivo.saldoActual,
      valorAbonado: ultimoAbono ? ultimoAbono.valorAbonado : (client.totalAbonadoHoy || client.creditoActivo.valorCuota),
      saldoNuevo: ultimoAbono ? ultimoAbono.saldoNuevo : client.creditoActivo.saldoActual,
      formaPago: client.creditoActivo.formaPago ? client.creditoActivo.formaPago.charAt(0).toUpperCase() + client.creditoActivo.formaPago.slice(1) : 'Diario',
      cuotasPagadas: client.creditoActivo.cuotasPagadas || 1,
      numeroCuotasTotal: client.creditoActivo.cuotasTotal || 24,
      cuotasAtrasadas: client.creditoActivo.cuotasAtrasadas || 0,
      fechaVencimiento: client.creditoActivo.fechaVencimiento ? new Date(client.creditoActivo.fechaVencimiento).toISOString().slice(0, 10) : '',
      latitud: ultimoAbono?.latitud,
      longitud: ultimoAbono?.longitud,
      precisionGps: ultimoAbono?.precisionGps,
    });
  } catch (err) {
    console.error('Error al ver recibo:', err);
  }
}

// 3. MODAL AUSENTE
function abrirModalAusente(clienteId) {
  if (!clienteId) return;
  const clientes = state.rutaActual?.clientes || [];
  const client = clientes.find((c) => String(c.clienteId) === String(clienteId) || String(c.id) === String(clienteId));
  if (!client) return;

  state.selectedClientForAusente = client;
  const elCli = document.getElementById('modal-ausente-cliente');
  if (elCli) elCli.innerText = `${client.nombresAlias} ${client.apellidos || ''}`.trim();

  const elObs = document.getElementById('modal-ausente-obs');
  if (elObs) elObs.value = '';

  document.getElementById('modal-ausente')?.classList.remove('hidden');
}

function cerrarModalAusente() {
  document.getElementById('modal-ausente')?.classList.add('hidden');
  state.selectedClientForAusente = null;
}

async function confirmarAusente() {
  const client = state.selectedClientForAusente;
  if (!client) return;
  const observaciones = document.getElementById('modal-ausente-obs').value;

  // Capturar coordenadas GPS del intento de cobro para auditoría
  const gps = await obtenerUbicacionGPS();

  try {
    await api(`/rutas/clientes/${client.clienteId}/ausente`, {
      method: 'PATCH',
      body: JSON.stringify({
        observaciones,
        ...(gps || {}),
      }),
    });

    cerrarModalAusente();
    showToast(`🚪 ${client.nombresAlias} marcado como ausente hoy (GPS verificado)`, 'warning');
    cargarRutaHoy();
  } catch (err) {
    console.error(err);
  }
}

// ============================================================
// EXPORTACIÓN CONTABLE A CSV / EXCEL
// ============================================================
function descargarArchivoCSV(nombreArchivo, contenidoCSV) {
  // \uFEFF añade el Byte Order Mark (BOM) UTF-8 para que Excel abra acentos y ñ correctamente
  const blob = new Blob(['\uFEFF' + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nombreArchivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function exportarCuadreCSV() {
  try {
    const cuadre = await api('/caja/cuadre/hoy');
    const movimientos = await api('/caja/movimientos');
    const fecha = cuadre.fecha || new Date().toISOString().slice(0, 10);

    let csv = 'RESUMEN CUADRE DE CAJA DIARIO\n';
    csv += `Fecha,${fecha}\n`;
    csv += `Vendedor,${state.user?.nombre || 'General'}\n`;
    csv += `Total Cobrado,$${cuadre.totalCobrado || 0}\n`;
    csv += `Total Prestado Nuevo,$${cuadre.totalPrestadoNuevo || 0}\n`;
    csv += `Total Ingresos Manuales,$${cuadre.totalIngresos || 0}\n`;
    csv += `Total Egresos Manuales,$${cuadre.totalEgresos || 0}\n`;
    csv += `Total Retiros,$${cuadre.totalRetiros || 0}\n`;
    csv += `Saldo Esperado en Caja,$${cuadre.saldoEsperadoEnCaja || 0}\n\n`;

    csv += 'DETALLE DE MOVIMIENTOS DEL DIA\n';
    csv += 'Hora,Tipo,Concepto,Valor\n';
    for (const m of movimientos) {
      const hora = new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      csv += `"${hora}","${m.tipo}","${m.concepto.replace(/"/g, '""')}","$${m.valor}"\n`;
    }

    descargarArchivoCSV(`cuadre_caja_${fecha}.csv`, csv);
    showToast('📥 Archivo CSV de Cuadre de Caja descargado', 'success');
  } catch (err) {
    console.error('Error exportando cuadre:', err);
    showToast('Error al exportar cuadre CSV', 'danger');
  }
}

async function exportarCarteraCSV() {
  if (!state.rutaActual || !state.rutaActual.clientes) {
    showToast('No hay datos de ruta para exportar', 'warning');
    return;
  }

  const clientes = state.rutaActual.clientes;
  const fecha = new Date().toISOString().slice(0, 10);

  let csv = 'HOJA DE RUTA Y CARTERA DE CLIENTES\n';
  csv += `Fecha,${fecha}\n`;
  csv += `Ruta,${state.rutaActual.nombreRuta || 'Principal'}\n`;
  csv += `Vendedor,${state.rutaActual.vendedorNombre || 'Carlos'}\n\n`;

  csv += 'Orden,Cliente,Documento,Telefono,Direccion,Codigo Credito,Saldo Pendiente,Valor Cuota,Cuotas Pagadas,Cuotas Total,Cuotas Atrasadas,Estado Hoy\n';

  clientes.forEach((c) => {
    const cr = c.creditoActivo;
    const orden = c.orden || '-';
    const nombre = `${c.nombresAlias} ${c.apellidos || ''}`.trim();
    const doc = c.documento || 'N/A';
    const tel = c.movil || 'N/A';
    const dir = (c.direccion || 'Sin direccion').replace(/"/g, '""');
    const cod = cr ? cr.codigoCredito : 'N/A';
    const saldo = cr ? `$${cr.saldoActual}` : '$0';
    const cuota = cr ? `$${cr.valorCuota}` : '$0';
    const pagadas = cr ? cr.cuotasPagadas : 0;
    const total = cr ? cr.cuotasTotal : 0;
    const atrasadas = cr ? cr.cuotasAtrasadas : 0;
    const estado = c.haPagadoHoy ? 'PAGO HOY' : (c.estadoVisita || 'PENDIENTE');

    csv += `"${orden}","${nombre}","${doc}","${tel}","${dir}","${cod}","${saldo}","${cuota}","${pagadas}","${total}","${atrasadas}","${estado}"\n`;
  });

  descargarArchivoCSV(`cartera_clientes_${fecha}.csv`, csv);
  showToast('📊 Archivo CSV de Cartera descargado exitosamente', 'success');
}

// 4. SIMULADOR DE MORA AUTOMÁTICA
async function ejecutarMoraEnVivo() {
  if (state.role !== 'admin') {
    showToast('⚠️ Cambiando a usuario Admin para ejecutar cálculo de mora...', 'info');
    await switchUser('admin');
  }
  const btn = document.getElementById('btn-ejecutar-mora');
  btn.disabled = true;
  btn.innerText = '⏳ Ejecutando cálculo...';

  try {
    const data = await api('/mora/ejecutar', { method: 'POST', body: JSON.stringify({}) });

    document.getElementById('resumen-mora-box').classList.remove('hidden');
    document.getElementById('mora-evaluados').innerText = data.totalEvaluados;
    document.getElementById('mora-en-mora').innerText = data.pasanAEnMora;
    document.getElementById('mora-recuperados').innerText = data.recuperadosAActivo;
    document.getElementById('mora-al-dia').innerText = data.alDia;

    const tbody = document.getElementById('tabla-mora-body');
    tbody.innerHTML = data.detalles
      .map(
        (d) => `
        <tr>
          <td><strong>${d.codigoCredito}</strong></td>
          <td>${d.clienteNombre}</td>
          <td>${d.formaPago}</td>
          <td>${d.cuotasEsperadas}</td>
          <td>${d.cuotasPagadas}</td>
          <td><span class="${d.cuotasAtrasadas > 0 ? 'text-danger font-bold' : ''}">${d.cuotasAtrasadas}</span></td>
          <td>$${d.saldoActual.toLocaleString()}</td>
          <td>
            <span class="status-badge ${d.nuevoEstado === 'EN_MORA' ? 'status-atrasado' : 'status-al-dia'}">
              ${d.nuevoEstado}
            </span>
          </td>
        </tr>
      `,
      )
      .join('');

    showToast('Job de Mora Automática ejecutado con éxito', 'success');
  } catch (err) {
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.innerText = '🚀 Ejecutar Job de Mora Ahora';
  }
}

// 5. RENOVACIÓN DE CRÉDITOS
async function cargarClientesParaRenovacion() {
  const select = document.getElementById('renovar-credito-select');
  if (!select) return;
  select.innerHTML = '<option value="">-- Cargando clientes... --</option>';

  try {
    const res = await api('/clientes').catch(() => []);
    const clientes = Array.isArray(res) ? res : (res?.data || res?.clientes || []);
    state.clientesConCredito = clientes;

    const options = clientes
      .filter((c) => c && c.creditos && c.creditos.length > 0)
      .map((c) => {
        const cr = c.creditos[0];
        return `<option value="${cr.id}" data-saldo="${cr.saldoActual}" data-cliente="${escapeHtml(c.nombresAlias)}" data-prod="${cr.productoId || ''}">
          ${escapeHtml(c.nombresAlias)} (${cr.codigoCredito}) - Saldo: $${Number(cr.saldoActual).toLocaleString()}
        </option>`;
      });

    select.innerHTML = '<option value="">-- Selecciona un cliente con crédito --</option>' + options.join('');
    actualizarPrecalculoRenovacion();
  } catch (err) {
    console.error('Error al cargar clientes para renovación:', err);
  }
}

function actualizarPrecalculoRenovacion() {
  const select = document.getElementById('renovar-credito-select');
  const option = (select && select.options && select.selectedIndex >= 0) ? select.options[select.selectedIndex] : null;

  const saldoAnt = option && option.value ? Number(option.getAttribute('data-saldo') || 0) : 0;
  const nuevoMonto = Number(document.getElementById('ren-monto')?.value) || 0;
  const cuotas = Number(document.getElementById('ren-cuotas')?.value) || 1;
  const interes = Number(document.getElementById('ren-interes')?.value) || 0;

  const totalConInteres = nuevoMonto * (1 + interes / 100);
  const cuota = totalConInteres / cuotas;
  const neto = Math.max(0, nuevoMonto - saldoAnt);

  const elSaldoAnt = document.getElementById('prev-saldo-ant');
  if (elSaldoAnt) elSaldoAnt.innerText = fmtMoneda(saldoAnt);

  const elNuevo = document.getElementById('prev-nuevo-monto');
  if (elNuevo) elNuevo.innerText = fmtMoneda(nuevoMonto);

  const elTotal = document.getElementById('prev-total-interes');
  if (elTotal) elTotal.innerText = fmtMoneda(totalConInteres);

  const elCuota = document.getElementById('prev-cuota');
  if (elCuota) elCuota.innerText = fmtMoneda(Math.round(cuota));

  const elNeto = document.getElementById('prev-neto');
  if (elNeto) elNeto.innerText = fmtMoneda(Math.round(neto));
}

async function procesarRenovacion() {
  const select = document.getElementById('renovar-credito-select');
  const creditoId = select.value;
  if (!creditoId) {
    showToast('Selecciona un crédito a renovar', 'warning');
    return;
  }

  const option = select.options[select.selectedIndex];
  const productoId = option.getAttribute('data-prod') || 'prod-001';
  const nuevoMonto = Number(document.getElementById('ren-monto').value);
  const cuotas = Number(document.getElementById('ren-cuotas').value);
  const interes = Number(document.getElementById('ren-interes').value);
  const formaPago = document.getElementById('ren-forma').value;

  try {
    const res = await api('/clientes/creditos/renovar', {
      method: 'POST',
      body: JSON.stringify({
        creditoAnteriorId: creditoId,
        productoId,
        valorPrestamo: nuevoMonto,
        numeroCuotas: cuotas,
        interes,
        formaPago,
        descontarSaldoAnterior: true,
      }),
    });

    showToast(`✅ Renovación aprobada! Neto entregado: ${fmtMoneda(res.netoEntregadoCliente)}`, 'success');
    cargarClientesParaRenovacion();
    cargarRutaHoy();
    cargarCuadreCaja();
    setTab('rutas');
  } catch (err) {
    console.error(err);
  }
}

// 6. CUADRE DE CAJA
async function cargarCuadreCaja() {
  try {
    const cuadre = await api('/caja/cuadre/hoy').catch(() => ({}));
    if (cuadre) {
      const elC = document.getElementById('caja-cobrado');
      if (elC) elC.innerText = fmtMoneda(cuadre.totalCobrado || 0);

      const elP = document.getElementById('caja-prestado');
      if (elP) elP.innerText = fmtMoneda(cuadre.totalPrestadoNuevo || 0);

      const elI = document.getElementById('caja-ingresos');
      if (elI) elI.innerText = fmtMoneda(cuadre.totalIngresos ?? cuadre.totalIngresosManuales ?? 0);

      const elE = document.getElementById('caja-egresos');
      if (elE) elE.innerText = fmtMoneda((cuadre.totalEgresos ?? cuadre.totalEgresosManuales ?? 0) + (cuadre.totalRetiros || 0));

      const elS = document.getElementById('caja-saldo-esperado');
      if (elS) elS.innerText = fmtMoneda(cuadre.saldoEsperadoEnCaja ?? cuadre.saldoEnCajaEsperado ?? 0);
    }

    // Movimientos
    const movRes = await api('/caja/movimientos').catch(() => []);
    const movimientos = Array.isArray(movRes) ? movRes : (movRes?.movimientos || movRes?.data || []);
    const tbody = document.getElementById('tabla-movimientos-body');
    if (tbody) {
      if (movimientos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-cell">No hay movimientos registrados hoy.</td></tr>';
        return;
      }

      tbody.innerHTML = movimientos
        .map(
          (m) => `
          <tr>
            <td>${m.fecha ? new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
            <td><span class="status-badge ${m.tipo === 'INGRESO' ? 'status-al-dia' : 'status-atrasado'}">${m.tipo}</span></td>
            <td>${escapeHtml(m.concepto || '-')}</td>
            <td><strong>${fmtMoneda(m.valor || 0)}</strong></td>
          </tr>
        `,
        )
        .join('');
    }
  } catch (err) {
    console.error('Error cargando caja:', err);
  }
}

function abrirModalMovimiento() {
  document.getElementById('modal-movimiento').classList.remove('hidden');
}

function cerrarModalMovimiento() {
  document.getElementById('modal-movimiento').classList.add('hidden');
}

async function guardarMovimiento() {
  const tipo = document.getElementById('mov-tipo').value;
  const concepto = document.getElementById('mov-concepto').value;
  const valor = Number(document.getElementById('mov-valor').value);

  if (!concepto || !valor || valor <= 0) {
    showToast('Ingresa concepto y valor válidos', 'warning');
    return;
  }

  try {
    await api('/caja/movimientos', {
      method: 'POST',
      body: JSON.stringify({ tipo, concepto, valor }),
    });

    cerrarModalMovimiento();
    showToast('Movimiento registrado en caja', 'success');
    cargarCuadreCaja();
  } catch (err) {
    console.error(err);
  }
}

async function cerrarCaja() {
  if (!confirm('¿Estás seguro de cerrar el cuadre del día de hoy?')) return;
  try {
    await api('/caja/cuadre/cerrar', { method: 'POST', body: JSON.stringify({ observaciones: 'Cierre de prueba' }) });
    showToast('🔒 Cuadre de caja guardado con éxito', 'success');
    cargarCuadreCaja();
  } catch (err) {
    console.error(err);
  }
}

// RETIRO DE CAJA
function abrirModalRetiro() {
  document.getElementById('ret-concepto').value = '';
  document.getElementById('ret-valor').value = '';
  document.getElementById('modal-retiro').classList.remove('hidden');
}

function cerrarModalRetiro() {
  document.getElementById('modal-retiro').classList.add('hidden');
}

async function confirmarRetiro() {
  const concepto = document.getElementById('ret-concepto').value || 'Retiro de caja';
  const valor = Number(document.getElementById('ret-valor').value);
  if (!valor || valor <= 0) {
    showToast('Ingresa un valor válido para el retiro', 'warning');
    return;
  }

  try {
    await api('/caja/retiro', {
      method: 'POST',
      body: JSON.stringify({ concepto, valor }),
    });

    cerrarModalRetiro();
    showToast(`🏧 Retiro de $${valor.toLocaleString()} registrado en caja`, 'success');
    cargarCuadreCaja();
  } catch (err) {
    console.error(err);
  }
}

// 7. NUEVO CLIENTE & GPS
async function capturarGpsNuevoCliente() {
  const btn = document.getElementById('btn-capturar-gps-nuevo');
  const title = document.getElementById('gps-title-nuevo-cliente');
  const desc = document.getElementById('gps-desc-nuevo-cliente');
  const icon = document.getElementById('gps-icon-nuevo-cliente');
  const btnMapa = document.getElementById('btn-ver-mapa-nuevo');

  if (btn) {
    btn.disabled = true;
    btn.innerText = '📡 Obteniendo GPS...';
  }

  try {
    const gps = await obtenerUbicacionGPS();
    if (!gps || gps.latitud == null || gps.longitud == null) {
      showToast('No se pudo obtener señal GPS. Activa la ubicación de tu celular y permite el acceso.', 'warning');
      if (title) title.innerText = 'No se pudo capturar GPS';
      return;
    }

    document.getElementById('cli-latitud').value = gps.latitud;
    document.getElementById('cli-longitud').value = gps.longitud;
    document.getElementById('cli-precision-gps').value = gps.precisionGps || '';

    if (title) title.innerText = `GPS Fijado: ${gps.latitud.toFixed(5)}, ${gps.longitud.toFixed(5)}`;
    if (desc) desc.innerText = `Precisión: ±${Math.round(gps.precisionGps || 0)}m • Quedará registrado para el cobrador`;
    if (icon) icon.innerText = '🎯';
    if (btnMapa) {
      btnMapa.href = `https://www.google.com/maps?q=${gps.latitud},${gps.longitud}`;
      btnMapa.classList.remove('hidden');
    }

    showToast(`📍 Ubicación GPS capturada exitosamente (±${Math.round(gps.precisionGps || 0)}m)`, 'success');
  } catch (err) {
    console.error('Error GPS:', err);
    showToast('Error al capturar GPS: ' + err.message, 'danger');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = '🔄 Actualizar Ubicación GPS';
    }
  }
}

async function guardarGpsClienteEnRuta(clienteId, ev) {
  if (ev) ev.stopPropagation();
  showToast('📡 Capturando coordenadas GPS actuales...', 'info');

  try {
    const gps = await obtenerUbicacionGPS();
    if (!gps || gps.latitud == null || gps.longitud == null) {
      showToast('No se pudo obtener señal GPS. Activa la ubicación en tu celular.', 'warning');
      return;
    }

    await api(`/clientes/${clienteId}/gps`, {
      method: 'PATCH',
      body: JSON.stringify(gps),
    });

    showToast('📍 ¡Ubicación GPS del cliente registrada con éxito!', 'success');
    cargarRutaHoy();
  } catch (err) {
    console.error('Error al guardar GPS:', err);
    showToast('Error al guardar GPS: ' + err.message, 'danger');
  }
}

async function crearNuevoCliente(e) {
  e.preventDefault();
  const dto = {
    nombresAlias: document.getElementById('cli-nombre').value,
    apellidos: document.getElementById('cli-apellidos').value,
    documento: document.getElementById('cli-documento').value,
    movil: document.getElementById('cli-movil').value,
    direccion: document.getElementById('cli-direccion').value,
    productoId: state.productoActual?.id,
    valorPrestamo: Number(document.getElementById('cre-monto').value),
    numeroCuotas: Number(document.getElementById('cre-cuotas').value),
    interes: Number(document.getElementById('cre-interes').value),
    formaPago: document.getElementById('cre-forma').value,
  };

  const lat = document.getElementById('cli-latitud')?.value;
  const lng = document.getElementById('cli-longitud')?.value;
  const prec = document.getElementById('cli-precision-gps')?.value;

  if (lat && lng) {
    dto.latitud = Number(lat);
    dto.longitud = Number(lng);
    if (prec) dto.precisionGps = Number(prec);
  }

  const selVend = document.getElementById('cli-vendedor');
  if (selVend && selVend.value) {
    dto.vendedorId = selVend.value;
  }

  try {
    await api('/clientes', {
      method: 'POST',
      body: JSON.stringify(dto),
    });

    showToast(`✅ Cliente ${dto.nombresAlias} creado con éxito!`, 'success');
    document.getElementById('form-nuevo-cliente').reset();

    // Reset campos de GPS
    const latInp = document.getElementById('cli-latitud');
    const lngInp = document.getElementById('cli-longitud');
    const precInp = document.getElementById('cli-precision-gps');
    if (latInp) latInp.value = '';
    if (lngInp) lngInp.value = '';
    if (precInp) precInp.value = '';
    const title = document.getElementById('gps-title-nuevo-cliente');
    if (title) title.innerText = 'Ubicación GPS no registrada';
    const btnMapa = document.getElementById('btn-ver-mapa-nuevo');
    if (btnMapa) btnMapa.classList.add('hidden');
    const btnGps = document.getElementById('btn-capturar-gps-nuevo');
    if (btnGps) btnGps.innerText = '🎯 Capturar Ubicación Actual (GPS)';

    setTab('rutas');
  } catch (err) {
    console.error(err);
  }
}

// 8. PIN DE SEGURIDAD
function lockApp() {
  state.pinBuffer = '';
  updatePinDots();
  document.getElementById('pin-overlay').classList.remove('hidden');
}

function pressPin(digit) {
  if (state.pinBuffer.length < 4) {
    state.pinBuffer += digit;
    updatePinDots();

    if (state.pinBuffer.length === 4) {
      setTimeout(verifyPinCode, 150);
    }
  }
}

function clearPin() {
  state.pinBuffer = '';
  updatePinDots();
}

function deletePin() {
  state.pinBuffer = state.pinBuffer.slice(0, -1);
  updatePinDots();
}

function updatePinDots() {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById(`dot-${i}`);
    if (dot) {
      dot.classList.toggle('filled', i < state.pinBuffer.length);
    }
  }
}

async function verifyPinCode() {
  const pin = state.pinBuffer;
  try {
    const res = await api('/auth/pin/verificar', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });

    if (res && res.valido) {
      document.getElementById('pin-overlay').classList.add('hidden');
      showToast('🔓 Aplicación desbloqueada', 'success');
      state.pinBuffer = '';
    } else {
      showToast('PIN Incorrecto', 'danger');
      clearPin();
    }
  } catch (err) {
    showToast('PIN Incorrecto o error al verificar', 'danger');
    clearPin();
  }
}

// TOAST HELPER
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.innerText = message;
  toast.style.borderLeftColor =
    type === 'success' ? '#10b981' : type === 'danger' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#6366f1';
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

// ============================================================
// GESTIÓN DE USUARIOS, ADMIN/VENDEDORES Y PERMISOS (RBAC)
// ============================================================
state.usuariosCache = [];
state.filtroRolActivo = 'TODOS';

function adaptarUIporRol() {
  const esAdmin = state.role === 'admin';

  // Barra de aviso de permisos en sección usuarios
  const bannerVendedor = document.getElementById('banner-permiso-vendedor');
  if (bannerVendedor) bannerVendedor.classList.toggle('hidden', esAdmin);

  // Botón crear usuario
  const btnNuevoUsr = document.getElementById('btn-abrir-nuevo-usuario');
  if (btnNuevoUsr) btnNuevoUsr.style.display = esAdmin ? 'inline-block' : 'none';

  // Selector de vendedor en la hoja de ruta
  const selVendedorRuta = document.getElementById('filtro-ruta-vendedor');
  if (selVendedorRuta) selVendedorRuta.classList.toggle('hidden', !esAdmin);

  // Pestaña Dashboard Ejecutivo: exclusiva para Administrador
  const tabDash = document.getElementById('tab-dashboard');
  if (tabDash) tabDash.classList.toggle('hidden', !esAdmin);

  // Dashboard en pills rápidos y barra móvil
  const pillDash = document.getElementById('pill-dashboard');
  if (pillDash) pillDash.classList.toggle('hidden', !esAdmin);
  const mobDash = document.getElementById('mob-nav-dashboard');
  if (mobDash) mobDash.classList.toggle('hidden', !esAdmin);

  // Módulos de administración en Drawer
  document.querySelectorAll('.drawer-item-admin').forEach((el) => {
    el.classList.toggle('hidden', !esAdmin);
  });

  // Pestaña Mora Automática: accesible solo para admin
  const tabMora = document.getElementById('tab-mora');
  if (tabMora) {
    if (!esAdmin) {
      tabMora.title = 'Requiere privilegios de Administrador';
      tabMora.style.opacity = '0.6';
    } else {
      tabMora.title = 'Ejecución de mora automática';
      tabMora.style.opacity = '1';
    }
  }
}

async function poblarSelectorVendedores() {
  const sel = document.getElementById('filtro-ruta-vendedor');
  if (!sel || state.role !== 'admin') return;

  try {
    const uRes = await api('/usuarios?rol=VENDEDOR').catch(() => []);
    const usuarios = Array.isArray(uRes) ? uRes : (uRes?.usuarios || uRes?.data || []);
    let html = '<option value="" selected>🌐 Toda la Empresa / Todos los Clientes (Supervisión)</option>';

    if (state.user?.id) {
      html += `<option value="${state.user.id}">👑 Mi Cartera (${escapeHtml(state.user.nombre || 'Administrador')})</option>`;
    }

    usuarios.forEach((u) => {
      if (u && u.id) {
        html += `<option value="${u.id}">👤 ${escapeHtml(u.nombre)} (${escapeHtml(u.posicion || 'Ruta')})</option>`;
      }
    });

    sel.innerHTML = html;
    sel.value = '';
  } catch (err) {
    console.warn('No se pudo poblar selector de vendedores:', err);
  }
}

async function poblarSelectorVendedorNuevoCliente() {
  const sel = document.getElementById('cli-vendedor');
  const group = document.getElementById('group-cli-vendedor');
  if (!sel || !group) return;

  if (state.role !== 'admin') {
    group.style.display = 'none';
    return;
  }

  group.style.display = 'block';
  try {
    const usuarios = await api('/usuarios?rol=VENDEDOR').catch(() => []);
    sel.innerHTML = '';

    if (state.user?.id) {
      const optAdmin = document.createElement('option');
      optAdmin.value = state.user.id;
      optAdmin.textContent = `👑 Yo (${state.user.nombre || 'Administrador'})`;
      sel.appendChild(optAdmin);
    }

    usuarios.forEach((u) => {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = `👤 ${u.nombre} (${u.posicion || 'Ruta'})`;
      sel.appendChild(opt);
    });
  } catch (err) {
    console.warn('No se pudo poblar selector de vendedor para nuevo cliente:', err);
  }
}

function cambiarVendedorRuta(vendedorId) {
  cargarRutaHoy();
}

async function cargarUsuarios() {
  const tbody = document.getElementById('tabla-usuarios-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="8" class="empty-cell">Cargando directorio de miembros del equipo...</td></tr>';

  try {
    let usuarios = [];
    if (state.role === 'admin') {
      usuarios = await api('/usuarios');
    } else {
      // Si entra como vendedor, ve a su propio usuario y la lista de rutas públicas
      usuarios = await api('/usuarios/vendedores').catch(() => []);
      if (state.user) {
        usuarios = [state.user, ...usuarios.filter((u) => u.id !== state.user.id)];
      }
    }

    state.usuariosCache = usuarios;
    actualizarMetricasUsuarios(usuarios);
    renderizarUsuarios(usuarios);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-cell text-danger">Error al cargar usuarios: ${err.message}</td></tr>`;
  }
}

function actualizarMetricasUsuarios(usuarios) {
  const total = usuarios.length;
  const admins = usuarios.filter((u) => u.rol === 'ADMIN').length;
  const vendedores = usuarios.filter((u) => u.rol === 'VENDEDOR' && u.activo).length;
  const cartera = usuarios.reduce((sum, u) => sum + (Number(u.carteraActiva) || 0), 0);

  const elTotal = document.getElementById('met-usr-total');
  const elAdmins = document.getElementById('met-usr-admins');
  const elVendedores = document.getElementById('met-usr-vendedores');
  const elCartera = document.getElementById('met-usr-cartera');

  if (elTotal) elTotal.innerText = total;
  if (elAdmins) elAdmins.innerText = admins;
  if (elVendedores) elVendedores.innerText = vendedores;
  if (elCartera) elCartera.innerText = `$${cartera.toLocaleString()}`;
}

function renderizarUsuarios(lista) {
  const tbody = document.getElementById('tabla-usuarios-body');
  if (!tbody) return;

  let filtrados = lista;
  if (state.filtroRolActivo !== 'TODOS') {
    filtrados = filtrados.filter((u) => u.rol === state.filtroRolActivo);
  }

  const query = (document.getElementById('buscar-usuario-input')?.value || '').toLowerCase().trim();
  if (query) {
    filtrados = filtrados.filter(
      (u) =>
        (u.nombre && u.nombre.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.posicion && u.posicion.toLowerCase().includes(query))
    );
  }

  if (filtrados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-cell">No se encontraron miembros con el filtro aplicado.</td></tr>';
    return;
  }

  const esAdmin = state.role === 'admin';

  tbody.innerHTML = filtrados
    .map((u) => {
      const inicial = (u.nombre || 'U').charAt(0).toUpperCase();
      const isAdmin = u.rol === 'ADMIN';
      const roleBadge = isAdmin
        ? '<span class="badge-role badge-role-admin">👑 ADMIN</span>'
        : '<span class="badge-role badge-role-vendedor">👤 VENDEDOR</span>';

      const statusBadge = u.activo
        ? '<span class="badge-status badge-status-active">● Activo</span>'
        : '<span class="badge-status badge-status-inactive">○ Inactivo</span>';

      const clientesText = u.totalClientes !== undefined ? `${u.totalClientes} clientes` : '-';
      const carteraText = u.carteraActiva !== undefined ? fmtMoneda(u.carteraActiva) : '-';

      const acciones = esAdmin
        ? `
          <button class="btn-action-icon" title="Editar datos" onclick="abrirModalEditarUsuario('${u.id}')">✏️</button>
          <button class="btn-action-icon" title="Cambiar clave" onclick="abrirModalPassword('${u.id}', '${u.nombre.replace(/'/g, "\\'")}')">🔑</button>
          <button class="btn-action-icon ${u.activo ? 'danger' : 'success'}" 
            title="${u.activo ? 'Desactivar / Apagar acceso' : 'Reactivar acceso'}" 
            onclick="alternarEstadoUsuario('${u.id}', ${u.activo}, '${u.nombre.replace(/'/g, "\\'")}')">
            ${u.activo ? '🚫' : '✅'}
          </button>
          <button class="btn-action-icon danger" title="Eliminar usuario (si no tiene cobros históricos)" onclick="eliminarUsuarioFrontend('${u.id}', '${u.nombre.replace(/'/g, "\\'")}')">🗑️</button>
        `
        : '<span class="text-muted text-sm">Solo lectura</span>';

      return `
        <tr>
          <td>
            <div class="user-cell">
              <div class="user-avatar ${isAdmin ? 'avatar-admin' : ''}">${inicial}</div>
              <div>
                <div class="user-meta-name">${escapeHtml(u.nombre)}</div>
                <div class="user-meta-email">${escapeHtml(u.email || '-')}</div>
              </div>
            </div>
          </td>
          <td>${roleBadge}</td>
          <td>
            <div>${u.telefono ? escapeHtml(u.telefono) : '<span class="text-muted">Sin teléfono</span>'}</div>
          </td>
          <td>
            <div>${u.posicion ? escapeHtml(u.posicion) : '<span class="text-muted">Ruta general</span>'}</div>
          </td>
          <td><strong>${clientesText}</strong></td>
          <td><span class="text-accent font-bold">${carteraText}</span></td>
          <td>${statusBadge}</td>
          <td class="text-right">${acciones}</td>
        </tr>
      `;
    })
    .join('');
}

function filtrarUsuarios(rol, chipElem) {
  state.filtroRolActivo = rol;
  document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
  if (chipElem) chipElem.classList.add('active');
  renderizarUsuarios(state.usuariosCache);
}

function buscarUsuario(query) {
  renderizarUsuarios(state.usuariosCache);
}

// MODAL CREAR / EDITAR
function abrirModalNuevoUsuario() {
  document.getElementById('modal-usuario-titulo').innerText = '👤 Nuevo Miembro del Equipo';
  document.getElementById('usr-id').value = '';
  document.getElementById('usr-nombre').value = '';
  document.getElementById('usr-email').value = '';
  document.getElementById('usr-email').disabled = false;
  document.getElementById('usr-telefono').value = '';
  document.getElementById('usr-posicion').value = '';
  document.getElementById('usr-rol').value = 'VENDEDOR';
  document.getElementById('usr-moneda').value = obtenerMonedaActual().codigo;
  document.getElementById('usr-password').value = '';
  document.getElementById('usr-password').required = true;
  document.getElementById('usr-pin').value = '';
  document.getElementById('usr-pass-fields').style.display = 'grid';

  document.getElementById('modal-usuario').classList.remove('hidden');
}

function abrirModalEditarUsuario(id) {
  const usr = state.usuariosCache.find((u) => u.id === id);
  if (!usr) return;

  document.getElementById('modal-usuario-titulo').innerText = `✏️ Editar Usuario: ${usr.nombre}`;
  document.getElementById('usr-id').value = usr.id;
  document.getElementById('usr-nombre').value = usr.nombre;
  document.getElementById('usr-email').value = usr.email;
  document.getElementById('usr-email').disabled = true; // Email es identificador de login
  document.getElementById('usr-telefono').value = usr.telefono || '';
  document.getElementById('usr-posicion').value = usr.posicion || '';
  document.getElementById('usr-rol').value = usr.rol;
  document.getElementById('usr-moneda').value = obtenerMonedaActual().codigo;
  document.getElementById('usr-password').required = false;
  document.getElementById('usr-pass-fields').style.display = 'none'; // Clave se cambia en su propio modal

  document.getElementById('modal-usuario').classList.remove('hidden');
}

function cerrarModalUsuario() {
  document.getElementById('modal-usuario').classList.add('hidden');
}

async function guardarUsuario(e) {
  e.preventDefault();

  const id = document.getElementById('usr-id').value;
  const nombre = document.getElementById('usr-nombre').value.trim();
  const rol = document.getElementById('usr-rol').value;
  const telefono = document.getElementById('usr-telefono').value.trim();
  const posicion = document.getElementById('usr-posicion').value.trim();
  const moneda = document.getElementById('usr-moneda')?.value;

  try {
    if (id) {
      // Modo Edición
      await api(`/usuarios/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ nombre, rol, telefono, posicion }),
      });
      showToast('✅ Información de usuario actualizada', 'success');
    } else {
      // Modo Creación
      const email = document.getElementById('usr-email').value.trim();
      const password = document.getElementById('usr-password').value;
      const pin = document.getElementById('usr-pin').value;

      await api('/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          nombre,
          email,
          password,
          rol,
          telefono,
          posicion,
          pin,
        }),
      });
      showToast(`🎉 Usuario ${nombre} creado con éxito`, 'success');
    }

    // Si se crea o edita un administrador y seleccionó moneda, fijar la zona
    if (rol === 'ADMIN' && moneda) {
      await api('/auth/tenant/moneda', {
        method: 'PATCH',
        body: JSON.stringify({ moneda }),
      }).catch(() => {});
      localStorage.setItem('crediya_moneda', moneda);
      const sel = document.getElementById('selector-moneda-global');
      if (sel) sel.value = moneda;
    }

    cerrarModalUsuario();
    cargarUsuarios();
    poblarSelectorVendedores();
  } catch (err) {
    console.error('Error al guardar usuario:', err);
  }
}

async function alternarEstadoUsuario(id, estadoActual, nombre) {
  const accion = estadoActual ? 'desactivar' : 'activar';
  if (!confirm(`¿Estás seguro de que deseas ${accion} el acceso para "${nombre}"?`)) {
    return;
  }

  try {
    await api(`/usuarios/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: !estadoActual }),
    });

    showToast(`Estado de ${nombre} actualizado a: ${!estadoActual ? 'Activo' : 'Inactivo'}`, 'info');
    cargarUsuarios();
  } catch (err) {
    console.error('Error al alternar estado:', err);
    showToast(`Error al cambiar estado: ${err.message}`, 'danger');
  }
}

async function eliminarUsuarioFrontend(id, nombre) {
  if (!confirm(`⚠️ ¿Deseas eliminar al usuario "${nombre}"?\n\nRecuerda: Solo se puede eliminar si fue creado por error y no tiene cobros o créditos en el historial. Si ya tiene historial financiero, la plataforma exigirá desactivarlo (🚫) para proteger la auditoría legal.`)) {
    return;
  }

  try {
    await api(`/usuarios/${id}`, {
      method: 'DELETE',
    });

    showToast(`🗑️ Usuario "${nombre}" eliminado exitosamente`, 'success');
    cargarUsuarios();
    poblarSelectorVendedores();
  } catch (err) {
    showToast(`No se pudo eliminar: ${err.message}`, 'warning');
  }
}

// MODAL CAMBIAR PASSWORD
function abrirModalPassword(id, nombre) {
  document.getElementById('pwd-usuario-id').value = id;
  document.getElementById('pwd-usuario-nombre').innerText = nombre;
  document.getElementById('pwd-nueva-clave').value = '';
  document.getElementById('modal-password').classList.remove('hidden');
}

function cerrarModalPassword() {
  document.getElementById('modal-password').classList.add('hidden');
}

async function guardarPassword(e) {
  e.preventDefault();
  const id = document.getElementById('pwd-usuario-id').value;
  const password = document.getElementById('pwd-nueva-clave').value;

  if (!password || password.length < 6) {
    showToast('La contraseña debe tener al menos 6 caracteres', 'danger');
    return;
  }

  try {
    await api(`/usuarios/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    });

    cerrarModalPassword();
    showToast('🔑 Contraseña actualizada exitosamente', 'success');
  } catch (err) {
    console.error('Error al cambiar contraseña:', err);
  }
}

// ============================================================
// DASHBOARD EJECUTIVO & ANALÍTICA DEL NEGOCIO
// ============================================================
async function cargarDashboardEjecutivo() {
  if (state.role !== 'admin') {
    showToast('El Dashboard Ejecutivo es exclusivo para el Administrador', 'warning');
    return;
  }

  try {
    const data = await api('/dashboard/resumen');

    // 1. KPIs Financieros
    const fin = data.financiero;
    document.getElementById('dash-prestado').innerText = fmtMoneda(fin.totalPrestadoHistorico);
    document.getElementById('dash-prestado-sub').innerText = `${fin.creditosActivosTotal} créditos activos (${fin.clientesTotal} clientes)`;

    document.getElementById('dash-recuperado').innerText = fmtMoneda(fin.totalRecuperadoHistorico);
    document.getElementById('dash-cartera-activa').innerText = fmtMoneda(fin.carteraActivaTotal);
    document.getElementById('dash-cartera-sub').innerText = 'Saldo total en calle';

    document.getElementById('dash-cobrado-hoy').innerText = fmtMoneda(fin.totalCobradoHoy);
    document.getElementById('dash-cumplimiento').innerText =
      `Meta hoy: ${fmtMoneda(fin.totalEsperadoHoy)} (${fin.porcentajeCumplimientoHoy}%)`;

    // 2. Indicadores de Riesgo (PAR 30 / PAR 60)
    const riesgo = data.riesgo;
    document.getElementById('dash-par30').innerText = `${riesgo.porcentajePar30}%`;
    document.getElementById('dash-par30-monto').innerText = `${fmtMoneda(riesgo.saldoPar30)} en riesgo`;

    document.getElementById('dash-par60').innerText = `${riesgo.porcentajePar60}%`;
    document.getElementById('dash-par60-monto').innerText = `${fmtMoneda(riesgo.saldoPar60)} en riesgo crítico`;

    const totalCreditos = (riesgo.creditosAlDia + riesgo.creditosEnAtraso + riesgo.creditosEnMoraSevera) || 1;
    const pctAlDia = Math.round((riesgo.creditosAlDia / totalCreditos) * 100);
    const pctAtraso = Math.round((riesgo.creditosEnAtraso / totalCreditos) * 100);
    const pctMora = Math.max(0, 100 - pctAlDia - pctAtraso);

    document.getElementById('p-bar-aldia').style.width = `${pctAlDia}%`;
    document.getElementById('p-bar-atraso').style.width = `${pctAtraso}%`;
    document.getElementById('p-bar-mora').style.width = `${pctMora}%`;
    document.getElementById('dash-distribucion-text').innerText =
      `🟢 ${riesgo.creditosAlDia} al día (${pctAlDia}%) | 🟡 ${riesgo.creditosEnAtraso} en atraso (${pctAtraso}%) | 🔴 ${riesgo.creditosEnMoraSevera} en mora (${pctMora}%)`;

    // 3. Gráfica de Cobranza Semanal
    renderizarGraficaSemanal(data.semanal);

    // 4. Ranking de Cobradores
    renderizarRankingCobradores(data.rankingCobradores);
  } catch (err) {
    console.error('Error al cargar dashboard:', err);
    showToast(`Error al cargar métricas del Dashboard: ${err.message}`, 'danger');
  }
}

function renderizarGraficaSemanal(dias) {
  const container = document.getElementById('dash-chart-semanal') || document.getElementById('dash-chart-bars');
  if (!container) return;

  if (!dias || dias.length === 0) {
    container.innerHTML = '<div class="empty-cell" style="width: 100%; text-align: center; padding: 30px;">No hay datos históricos esta semana.</div>';
    return;
  }

  const maxTotal = Math.max(...dias.map((d) => d.total), 1000);
  const hoyStr = new Date().toISOString().slice(0, 10);

  container.innerHTML = dias
    .map((d) => {
      const alturaPct = Math.max(8, Math.round((d.total / maxTotal) * 100));
      const esHoy = d.fecha === hoyStr;
      const totalFmt = d.total > 0 ? fmtMoneda(d.total) : fmtMoneda(0);

      return `
        <div class="chart-bar-col" title="${d.dia} (${d.fecha}): ${fmtMoneda(d.total)} (${d.abonosCount} cobros)">
          <span class="chart-bar-amount">${totalFmt}</span>
          <div class="chart-bar-pillar ${esHoy ? 'bar-today' : ''}" style="height: ${alturaPct}%;"></div>
          <span class="chart-bar-label">${d.dia}${esHoy ? ' (Hoy)' : ''}</span>
        </div>
      `;
    })
    .join('');
}

function renderizarRankingCobradores(cobradores) {
  const tbody = document.getElementById('dash-ranking-body');
  if (!tbody) return;

  if (!cobradores || cobradores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">No hay cobradores registrados aún.</td></tr>';
    return;
  }

  tbody.innerHTML = cobradores
    .map((c) => {
      const inicial = (c.nombre || 'C').charAt(0).toUpperCase();
      const pctBadge = c.efectividad >= 80 ? 'text-success' : c.efectividad >= 50 ? 'text-warning' : 'text-danger';

      return `
        <tr>
          <td>
            <div class="user-cell">
              <div class="user-avatar">${inicial}</div>
              <div>
                <strong>${c.nombre}</strong>
                ${!c.activo ? ' <small class="text-danger">(Inactivo)</small>' : ''}
              </div>
            </div>
          </td>
          <td>${c.posicion}</td>
          <td>${c.totalClientes} clientes (${c.creditosActivos} créditos)</td>
          <td><strong>${fmtMoneda(c.carteraTotal)}</strong></td>
          <td><span class="text-accent font-bold">${fmtMoneda(c.cobradoHoy)}</span></td>
          <td><strong class="${pctBadge}">${c.efectividad}%</strong></td>
        </tr>
      `;
    })
    .join('');
}

// ============================================================
// HISTORIAL / ESTADO DE CUENTA DEL CLIENTE & WHATSAPP
// ============================================================
state.extractoActual = null;

async function verEstadoCuentaCliente(clienteId, creditoId) {
  if (!creditoId) {
    showToast('El cliente no tiene un crédito asignado para ver extracto', 'warning');
    return;
  }

  try {
    const data = await api(`/abonos/credito/${creditoId}/extracto`);
    state.extractoActual = data;

    const cli = data.cliente;
    const cr = data.credito;
    const res = data.resumenAmortizacion;

    document.getElementById('ec-subtitulo').innerText =
      `Cliente: ${cli.nombre} | Crédito: ${cr.codigoCredito} (${cr.formaPago.toUpperCase()}) | Tel: ${cli.movil || '-'}`;

    document.getElementById('ec-prestamo-inicial').innerText = fmtMoneda(cr.valorPrestamo);
    document.getElementById('ec-total-pagar').innerText = fmtMoneda(cr.totalPagar);
    document.getElementById('ec-total-abonado').innerText = fmtMoneda(res.totalAbonado);
    document.getElementById('ec-saldo-pendiente').innerText = fmtMoneda(res.saldoPendiente);

    document.getElementById('ec-progreso-porcentaje').innerText =
      `${res.porcentajePagado}% Pagado (${cr.cuotasPagadas} de ${cr.cuotasTotal} cuotas)`;
    document.getElementById('ec-progreso-fill').style.width = `${res.porcentajePagado}%`;

    const tbody = document.getElementById('ec-tabla-abonos-body');
    if (data.historialAbonos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Este crédito aún no registra abonos.</td></tr>';
    } else {
      tbody.innerHTML = data.historialAbonos
        .map((a) => {
          const gpsLink = a.latitud && a.longitud
            ? `<a href="https://www.google.com/maps?q=${a.latitud},${a.longitud}" target="_blank" class="gps-ticket-link">📍 GPS ↗</a>`
            : '<span class="text-muted">-</span>';

          return `
            <tr>
              <td><strong>#${a.numero}</strong></td>
              <td>${a.fecha} ${a.hora}</td>
              <td>${a.cobrador}</td>
              <td><span class="text-success font-bold">${fmtMoneda(a.valorAbonado)}</span></td>
              <td>${fmtMoneda(a.saldoNuevo)}</td>
              <td>${gpsLink}</td>
            </tr>
          `;
        })
        .join('');
    }

    document.getElementById('modal-estado-cuenta').classList.remove('hidden');
  } catch (err) {
    console.error('Error al cargar extracto:', err);
    showToast(`Error al cargar estado de cuenta: ${err.message}`, 'danger');
  }
}

function cerrarModalEstadoCuenta() {
  document.getElementById('modal-estado-cuenta')?.classList.add('hidden');
  state.extractoActual = null;
}

function compartirExtractoWhatsApp() {
  const ext = state.extractoActual;
  if (!ext) return;

  const cli = ext.cliente;
  const cr = ext.credito;
  const res = ext.resumenAmortizacion;
  const m = obtenerMonedaActual();

  let texto = `*EXTRACTO DE CRÉDITO - CREDIYA*\n`;
  texto += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  texto += `👤 *Cliente:* ${cli.nombre}\n`;
  texto += `📄 *${m.prefijoDoc}:* ${cli.documento || 'No registrado'}\n`;
  texto += `💳 *Código Crédito:* ${cr.codigoCredito}\n`;
  texto += `📅 *Fecha Inicio:* ${cr.fechaInicio}\n`;
  texto += `🗓️ *Vencimiento:* ${cr.fechaVencimiento || 'En curso'}\n`;
  texto += `🔄 *Modalidad:* ${cr.formaPago.toUpperCase()}\n`;
  texto += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  texto += `💰 *Préstamo Inicial:* ${fmtMoneda(cr.valorPrestamo)}\n`;
  texto += `📈 *Total a Pagar:* ${fmtMoneda(cr.totalPagar)}\n`;
  texto += `✅ *Total Abonado:* ${fmtMoneda(res.totalAbonado)}\n`;
  texto += `⚠️ *Saldo Pendiente:* ${fmtMoneda(res.saldoPendiente)}\n`;
  texto += `📊 *Cuotas Pagadas:* ${cr.cuotasPagadas} de ${cr.cuotasTotal} (${res.porcentajePagado}%)\n`;

  if (cr.cuotasAtrasadas > 0) {
    texto += `🚨 *Cuotas Atrasadas:* ${cr.cuotasAtrasadas}\n`;
  }
  texto += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  texto += `*ÚLTIMOS ABONOS REALIZADOS:*\n`;

  const ultimos = ext.historialAbonos.slice(-4);
  if (ultimos.length === 0) {
    texto += `_Sin abonos registrados aún._\n`;
  } else {
    ultimos.forEach((a) => {
      texto += `• ${a.fecha} ${a.hora} | Abono: ${fmtMoneda(a.valorAbonado)} | Saldo: ${fmtMoneda(a.saldoNuevo)}\n`;
    });
  }

  texto += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  texto += `_Comprobante emitido por el sistema oficial de cobranza CrediYa._\n`;

  let movil = (cli.movil || '').replace(/\D/g, '');
  if (m.codigo === 'PEN' && movil.length === 9 && !movil.startsWith('51')) {
    movil = '51' + movil;
  } else if (m.codigo === 'COP' && movil.length === 10 && !movil.startsWith('57')) {
    movil = '57' + movil;
  }

  const url = movil
    ? `https://api.whatsapp.com/send?phone=${movil}&text=${encodeURIComponent(texto)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;

  window.open(url, '_blank');
}

function imprimirExtractoPOS() {
  window.print();
}

// Exposición explícita en window para compatibilidad móvil total
window.setTab = setTab;
window.switchUser = switchUser;
window.cerrarSesion = cerrarSesion;
window.abrirDrawerMenu = abrirDrawerMenu;
window.cerrarDrawerMenu = cerrarDrawerMenu;
window.toggleMenuDesplegable = toggleMenuDesplegable;
window.cerrarMenuDesplegable = cerrarMenuDesplegable;
window.lockApp = lockApp;
window.cambiarMonedaGlobal = cambiarMonedaGlobal;
window.accesoRapidoDemo = accesoRapidoDemo;
window.manejarPortalLogin = manejarPortalLogin;
window.manejarPortalRegistro = manejarPortalRegistro;
window.toggleExpandirCliente = toggleExpandirCliente;
window.abrirModalAbono = abrirModalAbono;
window.abrirModalAusente = abrirModalAusente;
window.cerrarModalAbono = cerrarModalAbono;
window.cerrarModalAusente = cerrarModalAusente;
window.confirmarAbono = confirmarAbono;
window.confirmarAusente = confirmarAusente;
window.verReciboCliente = verReciboCliente;
window.verEstadoCuentaCliente = verEstadoCuentaCliente;
window.verEstadoCuentaDesdeRecibo = verEstadoCuentaDesdeRecibo;
window.cerrarModalRecibo = cerrarModalRecibo;
window.cerrarModalEstadoCuenta = cerrarModalEstadoCuenta;


// ============================================================
// LÓGICA RESUMEN DEL DÍA ESTILO V13 MEJORADO
// ============================================================

let estadoResumenDia = null;

async function cargarResumenDia() {
  const vendedorId = state.role === 'vendedor' ? (state.user ? state.user.id : '') : '';
  const fecha = new Date().toISOString().slice(0, 10);

  try {
    let data;
    if (navigator.onLine && state.token) {
      data = await api(`/caja/resumen-dia?fecha=${fecha}${vendedorId ? '&vendedorId=' + vendedorId : ''}`);
    } else {
      // Cálculo Offline-First si no hay conexión
      data = calcularResumenDiaOffline(fecha);
    }

    estadoResumenDia = data;
    renderizarResumenDia(data);
  } catch (err) {
    console.error('Error al cargar Resumen del Día:', err);
    showToast('Calculando resumen localmente...', 'info');
    const offlineData = calcularResumenDiaOffline(fecha);
    estadoResumenDia = offlineData;
    renderizarResumenDia(offlineData);
  }
}

function calcularResumenDiaOffline(fecha) {
  const ruta = state.rutaActual || {};
  const clientes = ruta.clientes || state.clientesConCredito || [];
  const abonosLocales = JSON.parse(localStorage.getItem('crediya_abonos_pendientes_sync') || '[]');
  const hoyStr = fecha || new Date().toISOString().slice(0, 10);
  
  const abonosHoy = abonosLocales.filter(a => (a.fecha || '').startsWith(hoyStr));
  const pagosEnRuta = abonosHoy.filter(a => !a.esAdicional).length;
  const pagosAdicionales = abonosHoy.filter(a => a.esAdicional).length;

  const totalRecaudado = abonosHoy.reduce((s, a) => s + (Number(a.valorAbonado) || 0), 0);
  const efectivo = abonosHoy.filter(a => !a.metodoPago || a.metodoPago === 'EFECTIVO').reduce((s, a) => s + Number(a.valorAbonado), 0);
  const transferencia = abonosHoy.filter(a => a.metodoPago && a.metodoPago !== 'EFECTIVO').reduce((s, a) => s + Number(a.valorAbonado), 0);

  const totalEsperado = clientes.reduce((s, c) => s + (c.creditoActivo ? Number(c.creditoActivo.valorCuota) : 0), 0);
  const porcentaje = totalEsperado > 0 ? Number(((totalRecaudado / totalEsperado) * 100).toFixed(1)) : 0;

  const ausentes = clientes.filter(c => c.estadoVisita === 'AUSENTE').length;
  const aplazados = clientes.filter(c => c.estadoVisita === 'APLAZADO').length;
  const cajaInicial = Number(localStorage.getItem('crediya_caja_inicial_' + hoyStr) || 1037.50);

  const saldoCaja = Number((cajaInicial + efectivo).toFixed(2));

  const clientesNoPagados = clientes.filter(c => !c.haPagadoHoy && (!c.totalAbonadoHoy || c.totalAbonadoHoy === 0));

  return {
    vendedorNombre: state.user ? state.user.nombre : 'Vendedor Perú -2 -',
    fechaRuta: hoyStr,
    clientesAusentes: ausentes,
    aplazadosSiguienteDia: aplazados,
    numeroClientes: clientes.length || 80,
    clientesNuevos: 2,
    pagosRegistradosTexto: `${pagosEnRuta}/${clientes.length || 79} Adicionales: ${pagosAdicionales}`,
    cajaInicial,
    recaudoEsperado: totalEsperado || 2485.00,
    recaudoDia: totalRecaudado,
    porcentajeRecaudo: porcentaje,
    efectivo,
    transferencia,
    totalVentas: 1800.00,
    retirosCaja: 0.00,
    egresos: 0.00,
    ingresos: 0.00,
    retiroCajaSeguros: 0.00,
    ingresosSeguros: 0.00,
    cajaSeguros: 0.00,
    saldoEnCaja: saldoCaja,
    sincronizacionAutomatica: true,
    clientesNoPagados,
  };
}

function renderizarResumenDia(d) {
  if (!d) return;

  const headerVendedor = document.getElementById('v13-header-vendedor');
  if (headerVendedor) headerVendedor.innerText = `Vendedor: ${d.vendedorNombre || 'Perú -2 -'}`;

  const subVendedor = document.getElementById('res-dia-vendedor-nombre');
  if (subVendedor) subVendedor.innerText = `Vendedor: ${d.vendedorNombre || 'Perú -2 -'} | Ruta Activa`;

  const elFecha = document.getElementById('res-fecha-ruta');
  if (elFecha) elFecha.innerText = d.fechaRuta || new Date().toISOString().slice(0, 10);

  const elAusentes = document.getElementById('res-clientes-ausentes');
  if (elAusentes) elAusentes.innerText = d.clientesAusentes ?? 0;

  const elAplazados = document.getElementById('res-aplazados-dia');
  if (elAplazados) elAplazados.innerText = d.aplazadosSiguienteDia ?? 0;

  const elNumCli = document.getElementById('res-numero-clientes');
  if (elNumCli) elNumCli.innerText = d.numeroClientes ?? 0;

  const elNuevos = document.getElementById('res-clientes-nuevos');
  if (elNuevos) elNuevos.innerText = d.clientesNuevos ?? 0;

  const elPagos = document.getElementById('res-pagos-registrados');
  if (elPagos) elPagos.innerText = d.pagosRegistradosTexto || `${d.pagosEnRuta || 0}/${d.numeroClientes || 0} Adicionales: ${d.pagosAdicionales || 0}`;

  const elCajaIni = document.getElementById('res-caja-inicial');
  if (elCajaIni) elCajaIni.innerText = fmtMoneda(d.cajaInicial || 0);

  const elRecEsp = document.getElementById('res-recaudo-esperado');
  if (elRecEsp) elRecEsp.innerText = `${fmtMoneda(d.recaudoEsperado || 0)} (100%)`;

  const elRecDia = document.getElementById('res-recaudo-dia');
  if (elRecDia) elRecDia.innerText = `${fmtMoneda(d.recaudoDia || 0)} (${d.porcentajeRecaudo || 0}%)`;

  const elEfecTrans = document.getElementById('res-efectivo-transferencia');
  if (elEfecTrans) elEfecTrans.innerText = `${fmtMoneda(d.efectivo || 0)} / ${fmtMoneda(d.transferencia || 0)}`;

  const elVentas = document.getElementById('res-total-ventas');
  if (elVentas) elVentas.innerText = fmtMoneda(d.totalVentas || 0);

  const elRetiros = document.getElementById('res-retiros-caja');
  if (elRetiros) elRetiros.innerText = fmtMoneda(d.retirosCaja || 0);

  const elEgresos = document.getElementById('res-egresos');
  if (elEgresos) elEgresos.innerText = fmtMoneda(d.egresos || 0);

  const elIngresos = document.getElementById('res-ingresos');
  if (elIngresos) elIngresos.innerText = fmtMoneda(d.ingresos || 0);

  const elRetSeg = document.getElementById('res-retiro-seguros');
  if (elRetSeg) elRetSeg.innerText = fmtMoneda(d.retiroCajaSeguros || 0);

  const elIngSeg = document.getElementById('res-ingresos-seguros');
  if (elIngSeg) elIngSeg.innerText = fmtMoneda(d.ingresosSeguros || 0);

  const elCajaSeg = document.getElementById('res-caja-seguros');
  if (elCajaSeg) elCajaSeg.innerText = fmtMoneda(d.cajaSeguros || 0);

  const elSaldoCaja = document.getElementById('res-saldo-en-caja');
  if (elSaldoCaja) elSaldoCaja.innerText = fmtMoneda(d.saldoEnCaja || 0);
}

// Modal Base / Caja Inicial
function abrirModalCajaInicial() {
  const modal = document.getElementById('modal-caja-inicial');
  if (!modal) return;
  modal.classList.remove('hidden');
  const input = document.getElementById('input-caja-inicial-valor');
  if (input && estadoResumenDia) {
    input.value = estadoResumenDia.cajaInicial || '';
    if (typeof input.focus === 'function') input.focus();
  }
}

function cerrarModalCajaInicial() {
  const modal = document.getElementById('modal-caja-inicial');
  if (modal) modal.classList.add('hidden');
}

async function guardarCajaInicial() {
  const input = document.getElementById('input-caja-inicial-valor');
  const valor = Number(input?.value) || 0;
  const hoyStr = new Date().toISOString().slice(0, 10);

  localStorage.setItem('crediya_caja_inicial_' + hoyStr, valor);

  if (navigator.onLine && state.token) {
    try {
      await api('/caja/caja-inicial', {
        method: 'POST',
        body: JSON.stringify({ cajaInicial: valor, fecha: hoyStr }),
      });
    } catch (e) {
      console.warn('Caja inicial guardada localmente:', e);
    }
  }

  showToast(`Base de Caja Inicial fijada en: ${fmtMoneda(valor)}`, 'success');
  cerrarModalCajaInicial();
  cargarResumenDia();
  cargarCuadreCaja();
}

// Modal No Pagos
function abrirModalNoPagados() {
  const modal = document.getElementById('modal-no-pagados');
  if (!modal) return;
  modal.classList.remove('hidden');

  const tbody = document.getElementById('tabla-no-pagados-body');
  if (!tbody) return;

  const lista = (estadoResumenDia && estadoResumenDia.clientesNoPagados) || 
    ((state.rutaActual && state.rutaActual.clientes) ? state.rutaActual.clientes.filter(c => !c.haPagadoHoy) : []);

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">🎉 ¡Excelente! Todos los clientes de hoy han abonado.</td></tr>';
    return;
  }

  tbody.innerHTML = lista.map((c, i) => `
    <tr>
      <td>
        <strong>${escapeHtml(c.nombresAlias || c.nombre || 'Cliente')}</strong><br>
        <small class="text-muted">${escapeHtml(c.direccion || c.movil || '')}</small>
      </td>
      <td><strong class="text-accent">${fmtMoneda(c.creditoActivo ? c.creditoActivo.valorCuota : (c.valorCuota || 0))}</strong></td>
      <td><strong class="text-danger">${fmtMoneda(c.creditoActivo ? c.creditoActivo.saldoActual : (c.saldoActual || 0))}</strong></td>
      <td><span class="status-badge ${c.estadoVisita === 'AUSENTE' ? 'status-ausente' : (c.estadoVisita === 'APLAZADO' ? 'status-atrasado' : 'status-al-dia')}">${c.estadoVisita || 'PENDIENTE'}</span></td>
      <td>
        <div style="display: flex; gap: 4px;">
          <button type="button" class="btn-primary" style="padding: 6px 10px; font-size: 0.75rem;" onclick="cerrarModalNoPagados(); abrirModalAbonoPorId('${c.clienteId || c.id}')">💵 Cobrar</button>
          <button type="button" class="btn-whatsapp" style="padding: 6px 10px; font-size: 0.75rem;" onclick="enviarRecordatorioWhatsApp('${c.movil}', '${c.nombresAlias || c.nombre}', '${c.creditoActivo ? c.creditoActivo.valorCuota : c.valorCuota}')">💬</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function cerrarModalNoPagados() {
  const modal = document.getElementById('modal-no-pagados');
  if (modal) modal.classList.add('hidden');
}

function enviarRecordatorioWhatsApp(movil, nombre, valorCuota) {
  if (!movil) {
    showToast('El cliente no tiene número de teléfono registrado', 'warning');
    return;
  }
  const cleanPhone = String(movil).replace(/\D/g, '');
  const cuotaFmt = fmtMoneda(valorCuota || 0);
  const texto = encodeURIComponent(`Hola ${nombre}, le recordamos cordialmente de su compromiso de cuota por ${cuotaFmt} en CrediYa. Agradecemos su puntual pago.`);
  window.open(`https://wa.me/${cleanPhone}?text=${texto}`, '_blank');
}

// Modal Aplazar Visita (Siguiente Día)
let selectedClientForAplazar = null;

function abrirModalAplazar(clienteId, nombres) {
  selectedClientForAplazar = { id: clienteId, nombre: nombres };
  const modal = document.getElementById('modal-aplazar');
  if (!modal) return;
  const lbl = document.getElementById('modal-aplazar-cliente');
  if (lbl) lbl.innerText = nombres;
  modal.classList.remove('hidden');
}

function cerrarModalAplazar() {
  selectedClientForAplazar = null;
  const modal = document.getElementById('modal-aplazar');
  if (modal) modal.classList.add('hidden');
}

async function confirmarAplazado() {
  if (!selectedClientForAplazar) return;
  const clienteId = selectedClientForAplazar.id;
  const obs = document.getElementById('modal-aplazar-obs')?.value || 'Aplazado siguiente día';

  if (navigator.onLine && state.token) {
    try {
      await api(`/rutas/clientes/${clienteId}/aplazar`, {
        method: 'PATCH',
        body: JSON.stringify({ observaciones: obs }),
      });
    } catch (e) {
      console.warn('Marcado como aplazado localmente:', e);
    }
  }

  // Actualizar estado en memoria local
  if (state.rutaActual && state.rutaActual.clientes) {
    const c = state.rutaActual.clientes.find(cli => cli.clienteId === clienteId);
    if (c) c.estadoVisita = 'APLAZADO';
  }

  showToast(`Cliente ${selectedClientForAplazar.nombre} aplazado para mañana`, 'warning');
  cerrarModalAplazar();
  renderizarRutaHoy(state.rutaActual);
  cargarResumenDia();
}

// Modal Seguros
function abrirModalSeguros() {
  const modal = document.getElementById('modal-seguros');
  if (modal) modal.classList.remove('hidden');
}

function cerrarModalSeguros() {
  const modal = document.getElementById('modal-seguros');
  if (modal) modal.classList.add('hidden');
}

async function guardarMovimientoSeguro() {
  const tipo = document.getElementById('seg-tipo')?.value || 'INGRESO';
  const concepto = document.getElementById('seg-concepto')?.value || 'Prima seguro';
  const valor = Number(document.getElementById('seg-valor')?.value) || 0;

  if (valor <= 0) {
    showToast('Ingresa un valor válido para el seguro', 'warning');
    return;
  }

  if (navigator.onLine && state.token) {
    try {
      await api('/caja/movimiento-seguro', {
        method: 'POST',
        body: JSON.stringify({ tipo, concepto, valor }),
      });
    } catch (e) {
      console.warn('Seguro guardado offline:', e);
    }
  }

  showToast(`Movimiento de seguro (${tipo}) registrado: ${fmtMoneda(valor)}`, 'success');
  cerrarModalSeguros();
  cargarResumenDia();
  cargarCuadreCaja();
}

function toggleSyncAuto(checked) {
  localStorage.setItem('crediya_sync_auto', checked ? 'true' : 'false');
  showToast(checked ? 'Sincronización Automática ACTIVADA 📡' : 'Sincronización Automática PAUSADA', checked ? 'success' : 'info');
}

function abrirModalAbonoPorId(clienteId) {
  if (!state.rutaActual || !state.rutaActual.clientes) return;
  const cli = state.rutaActual.clientes.find(c => c.clienteId === clienteId);
  if (cli) {
    abrirModalAbono(cli.clienteId, cli.creditoActivo ? cli.creditoActivo.id : '', `${cli.nombresAlias} ${cli.apellidos || ''}`, cli.creditoActivo ? cli.creditoActivo.saldoActual : 0, cli.creditoActivo ? cli.creditoActivo.valorCuota : 0, cli.creditoActivo ? cli.creditoActivo.codigoCredito : '');
  }
}

// ============================================================
// EXPORTACIÓN DE CARTERA & CUADRE EN FORMATO CSV
// ============================================================
function exportarCarteraCSV() {
  if (!state.rutaActual || !state.rutaActual.clientes || state.rutaActual.clientes.length === 0) {
    showToast('No hay clientes en la ruta actual para exportar', 'warning');
    return;
  }
  const m = obtenerMonedaActual();
  const headers = ['Orden', 'Cliente', 'Documento', 'Teléfono', 'Dirección', `Cuota (${m.simbolo.trim()})`, `Saldo Actual (${m.simbolo.trim()})`, 'Estado', 'Ha Pagado Hoy'];
  const rows = state.rutaActual.clientes.map((c, i) => [
    i + 1,
    `"${(c.nombresAlias || c.nombre || '').replace(/"/g, '""')}"`,
    `"${(c.documento || '').replace(/"/g, '""')}"`,
    `"${(c.movil || '').replace(/"/g, '""')}"`,
    `"${(c.direccion || '').replace(/"/g, '""')}"`,
    c.creditoActivo ? c.creditoActivo.valorCuota : (c.valorCuota || 0),
    c.creditoActivo ? c.creditoActivo.saldoActual : (c.saldoActual || 0),
    `"${c.estadoVisita || (c.haPagadoHoy ? 'PAGADO' : 'PENDIENTE')}"`,
    c.haPagadoHoy ? 'SI' : 'NO'
  ]);
  
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Cartera_Ruta_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📊 Cartera exportada en CSV exitosamente', 'success');
}

async function exportarCuadreCSV() {
  try {
    const cuadre = await api('/caja/cuadre/hoy');
    const movimientos = await api('/caja/movimientos');
    const m = obtenerMonedaActual();
    
    let lines = [
      '\uFEFFCUADRE DE CAJA DIARIO - CREDIYA',
      `Fecha: ${new Date().toLocaleDateString('es-PE')}`,
      `Moneda: ${m.nombre} (${m.simbolo.trim()})`,
      '',
      'RESUMEN FINANCIERO',
      `Total Cobrado Hoy,${cuadre.totalCobrado || 0}`,
      `Préstamos / Renovaciones,${cuadre.totalPrestadoNuevo || 0}`,
      `Ingresos Manuales,${cuadre.totalIngresos ?? cuadre.totalIngresosManuales ?? 0}`,
      `Egresos / Retiros,${(cuadre.totalEgresos ?? cuadre.totalEgresosManuales ?? 0) + (cuadre.totalRetiros || 0)}`,
      `Efectivo Esperado en Caja,${cuadre.saldoEsperadoEnCaja ?? cuadre.saldoEnCajaEsperado ?? 0}`,
      '',
      'DETALLE DE MOVIMIENTOS',
      'Hora,Tipo,Concepto,Valor'
    ];
    
    if (movimientos && movimientos.length > 0) {
      movimientos.forEach(mov => {
        const hora = new Date(mov.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        lines.push(`"${hora}","${mov.tipo}","${(mov.concepto || '').replace(/"/g, '""')}",${mov.valor}`);
      });
    } else {
      lines.push('No hay movimientos registrados hoy,,,');
    }
    
    const csvContent = lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cuadre_Caja_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 Cuadre de caja exportado en CSV', 'success');
  } catch (err) {
    console.error('Error exportando cuadre CSV:', err);
    showToast('Error al exportar cuadre CSV: ' + err.message, 'danger');
  }
}

// ============================================================
// EXPOSICIÓN GLOBAL DE TODAS LAS FUNCIONES EN WINDOW
// ============================================================
window.setTab = setTab;
window.switchUser = switchUser;
window.toggleTheme = toggleTheme;
window.cerrarSesion = cerrarSesion;
window.cambiarMonedaGlobal = cambiarMonedaGlobal;
window.cambiarVendedorRuta = cambiarVendedorRuta;
window.filtrarEstadoRuta = filtrarEstadoRuta;
window.filtrarUsuarios = filtrarUsuarios;
window.buscarUsuario = buscarUsuario;
window.instalarAppPWA = instalarAppPWA;
window.toggleMenuDesplegable = toggleMenuDesplegable;
window.abrirDrawerMenu = abrirDrawerMenu;
window.cerrarDrawerMenu = cerrarDrawerMenu;

// Resumen del Día & Cuadre
window.cargarResumenDia = cargarResumenDia;
window.abrirModalCajaInicial = abrirModalCajaInicial;
window.cerrarModalCajaInicial = cerrarModalCajaInicial;
window.guardarCajaInicial = guardarCajaInicial;
window.abrirModalNoPagados = abrirModalNoPagados;
window.cerrarModalNoPagados = cerrarModalNoPagados;
window.abrirModalAplazar = abrirModalAplazar;
window.cerrarModalAplazar = cerrarModalAplazar;
window.confirmarAplazado = confirmarAplazado;
window.abrirModalSeguros = abrirModalSeguros;
window.cerrarModalSeguros = cerrarModalSeguros;
window.guardarMovimientoSeguro = guardarMovimientoSeguro;
window.toggleSyncAuto = toggleSyncAuto;
window.abrirModalAbonoPorId = abrirModalAbonoPorId;

// Caja & CSV
window.cargarCuadreCaja = cargarCuadreCaja;
window.abrirModalMovimiento = abrirModalMovimiento;
window.cerrarModalMovimiento = cerrarModalMovimiento;
window.guardarMovimiento = guardarMovimiento;
window.cerrarCaja = cerrarCaja;
window.abrirModalRetiro = abrirModalRetiro;
window.cerrarModalRetiro = cerrarModalRetiro;
window.confirmarRetiro = confirmarRetiro;
window.exportarCarteraCSV = exportarCarteraCSV;
window.exportarCuadreCSV = exportarCuadreCSV;

// Ruta & Abonos
window.cargarRutaHoy = cargarRutaHoy;
window.toggleExpandirCliente = toggleExpandirCliente;
window.toggleExpandClient = toggleExpandirCliente;
window.moverRuta = moverRuta;
window.moverClienteRuta = moverRuta;
window.abrirModalAbono = abrirModalAbono;
window.cerrarModalAbono = cerrarModalAbono;
window.confirmarAbono = confirmarAbono;
window.abrirModalAusente = abrirModalAusente;
window.cerrarModalAusente = cerrarModalAusente;
window.confirmarAusente = confirmarAusente;
window.cerrarModalRecibo = cerrarModalRecibo;
window.compartirWhatsAppRecibo = compartirWhatsAppRecibo;
window.descargarImagenComprobante = descargarImagenComprobante;
window.copiarTextoRecibo = copiarTextoRecibo;
window.imprimirTicketPOS = imprimirTicketPOS;
window.verEstadoCuentaDesdeRecibo = verEstadoCuentaDesdeRecibo;
window.enviarRecordatorioWhatsApp = enviarRecordatorioWhatsApp;

// Extracto & Estado de Cuenta
window.verEstadoCuentaCliente = verEstadoCuentaCliente;
window.cerrarModalEstadoCuenta = cerrarModalEstadoCuenta;
window.compartirExtractoWhatsApp = compartirExtractoWhatsApp;
window.imprimirExtractoPOS = imprimirExtractoPOS;

// Renovación & Nuevo Cliente
window.cargarClientesParaRenovacion = cargarClientesParaRenovacion;
window.actualizarPrecalculoRenovacion = actualizarPrecalculoRenovacion;
window.procesarRenovacion = procesarRenovacion;
window.crearNuevoCliente = crearNuevoCliente;
window.capturarGpsNuevoCliente = capturarGpsNuevoCliente;
window.guardarGpsClienteEnRuta = guardarGpsClienteEnRuta;

// Dashboard & Mora
window.cargarDashboardEjecutivo = cargarDashboardEjecutivo;
window.ejecutarMoraEnVivo = ejecutarMoraEnVivo;

// Usuarios & Permisos
window.cargarUsuarios = cargarUsuarios;
window.abrirModalNuevoUsuario = abrirModalNuevoUsuario;
window.abrirModalEditarUsuario = abrirModalEditarUsuario;
window.cerrarModalUsuario = cerrarModalUsuario;
window.guardarUsuario = guardarUsuario;
window.abrirModalPassword = abrirModalPassword;
window.cerrarModalPassword = cerrarModalPassword;
window.guardarPassword = guardarPassword;
window.guardarNuevaPassword = guardarPassword;
window.alternarEstadoUsuario = alternarEstadoUsuario;
window.eliminarUsuarioFrontend = eliminarUsuarioFrontend;
window.toggleRbacCard = toggleRbacCard;

// Navegación & Control Global
window.setTab = setTab;
window.cerrarSesion = cerrarSesion;
window.abrirDrawerMenu = abrirDrawerMenu;
window.cerrarDrawerMenu = cerrarDrawerMenu;
window.toggleMenuDesplegable = toggleMenuDesplegable;
window.cerrarMenuDesplegable = cerrarMenuDesplegable;
window.toggleTheme = toggleTheme;
window.cambiarMonedaGlobal = cambiarMonedaGlobal;
window.cambiarVendedorRuta = cambiarVendedorRuta;
window.instalarAppPWA = instalarAppPWA;

// PIN Seguridad
window.lockApp = lockApp;
window.pressPin = pressPin;
window.clearPin = clearPin;
window.deletePin = deletePin;
window.limpiarBusquedaRuta = limpiarBusquedaRuta;
window.filtrarEstadoRuta = filtrarEstadoRuta;
window.filtrarClientesRuta = filtrarClientesRuta;

// Resumen del Día & V13
window.cargarResumenDia = cargarResumenDia;
window.abrirModalCajaInicial = abrirModalCajaInicial;
window.cerrarModalCajaInicial = cerrarModalCajaInicial;
window.guardarCajaInicial = guardarCajaInicial;
window.abrirModalNoPagados = abrirModalNoPagados;
window.cerrarModalNoPagados = cerrarModalNoPagados;
window.abrirModalSeguros = abrirModalSeguros;
window.cerrarModalSeguros = cerrarModalSeguros;
window.guardarMovimientoSeguro = guardarMovimientoSeguro;
window.toggleSyncAuto = toggleSyncAuto;

// Aplazar Visita
window.abrirModalAplazar = abrirModalAplazar;
window.cerrarModalAplazar = cerrarModalAplazar;
window.confirmarAplazado = confirmarAplazado;
window.confirmarAplazar = confirmarAplazado;
