const fs = require('fs');

const js = fs.readFileSync('public/app.js', 'utf8');

// Let's create an exact browser DOM environment using jsdom or custom deep mock
const mockStorage = {
  store: {
    'crediya_token': 'test_token',
    'crediya_user': JSON.stringify({ id: 'u1', nombre: 'Admin Master', rol: 'ADMIN' }),
    'crediya_role': 'admin',
    'crediya_moneda': 'PEN'
  },
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

const html = fs.readFileSync('public/index.html', 'utf8');

// Parse all IDs from index.html
const allIds = new Set();
const idRegex = /id="([^"]+)"/g;
let m;
while ((m = idRegex.exec(html)) !== null) {
  allIds.add(m[1]);
}

class DOMNode {
  constructor(id) {
    this.id = id;
    this.classList = {
      add: () => {},
      remove: () => {},
      toggle: () => true,
      contains: () => false
    };
    this.style = {};
    this.dataset = {};
    this.value = '';
    this.innerText = '';
    this.innerHTML = '';
    this.children = [];
  }
  setAttribute() {}
  getAttribute() { return ''; }
  addEventListener() {}
  removeEventListener() {}
  focus() {}
  blur() {}
  scrollIntoView() {}
}

const domElements = new Map();
allIds.forEach(id => domElements.set(id, new DOMNode(id)));

const doc = {
  getElementById: (id) => {
    if (!domElements.has(id)) {
      domElements.set(id, new DOMNode(id));
    }
    return domElements.get(id);
  },
  querySelectorAll: () => [],
  querySelector: () => new DOMNode('query'),
  addEventListener: (evt, handler) => {
    if (evt === 'DOMContentLoaded') {
      setTimeout(handler, 10);
    }
  },
  createElement: (tag) => new DOMNode(tag),
  body: new DOMNode('body'),
  activeElement: new DOMNode('active')
};

const win = {
  document: doc,
  localStorage: mockStorage,
  location: { reload: () => {}, href: '' },
  navigator: { onLine: true, serviceWorker: { register: async () => ({ update: () => {} }) } },
  addEventListener: () => {},
  scrollTo: () => {},
  fetch: async (url) => {
    console.log('Fetch called:', url);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        accessToken: 'new_token',
        usuario: { id: 'u1', nombre: 'Admin', rol: 'ADMIN' },
        metricas: { totalClientes: 2, clientesCobradosHoy: 2, clientesPendientesHoy: 0, clientesAusentesHoy: 1, totalRecaudadoHoy: 90, totalEsperadoHoy: 30 },
        clientes: [
          {
            clienteId: 'c1',
            nombresAlias: 'Javier Gonzalo',
            apellidos: '',
            movil: '987827976',
            documento: '46703446',
            orden: 1,
            haPagadoHoy: true,
            estadoVisita: 'AL_DIA',
            creditoActivo: { id: 'cr1', codigoCredito: 'CR-001', saldoActual: 170, valorCuota: 10, cuotasPagadas: 5, cuotasTotal: 24, formaPago: 'diario' }
          }
        ],
        totalCobrado: 90,
        totalPrestadoNuevo: 0,
        totalIngresos: 0,
        totalEgresos: 0,
        saldoEsperadoEnCaja: 90,
        usuarios: []
      })
    };
  }
};

const vm = require('vm');
const context = vm.createContext({
  window: win,
  document: doc,
  localStorage: mockStorage,
  navigator: win.navigator,
  location: win.location,
  fetch: win.fetch,
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Date,
  Math,
  Number,
  String,
  Boolean,
  JSON,
  Array,
  Object,
  Event: class {},
  encodeURIComponent,
  decodeURIComponent
});

try {
  console.log('Running app.js in simulated DOM...');
  vm.runInContext(js, context);
  console.log('✅ Initial parse of app.js succeeded without uncaught exceptions.');
} catch (e) {
  console.error('❌ UNCAUGHT EXCEPTION IN APP.JS:', e);
}
