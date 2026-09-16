const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('public/index.html', 'utf8');
const js = fs.readFileSync('public/app.js', 'utf8');

// Build a minimalist mock DOM environment to run app.js and trigger button clicks
const elementStore = new Map();

class MockClassList {
  constructor() { this.classes = new Set(); }
  add(...c) { c.forEach(x => this.classes.add(x)); }
  remove(...c) { c.forEach(x => this.classes.remove ? this.classes.remove(x) : this.classes.delete(x)); }
  contains(c) { return this.classes.has(c); }
  toggle(c, force) {
    if (force !== undefined) {
      if (force) this.classes.add(c); else this.classes.delete(c);
      return force;
    }
    if (this.classes.has(c)) { this.classes.delete(c); return false; }
    this.classes.add(c); return true;
  }
}

class MockElement {
  constructor(id, tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.classList = new MockClassList();
    this.attributes = new Map();
    this.style = {};
    this.innerText = '';
    this.innerHTML = '';
    this.value = '';
    this.dataset = {};
  }
  getAttribute(name) { return this.attributes.get(name) || null; }
  setAttribute(name, val) { this.attributes.set(name, val); }
  addEventListener() {}
  scrollIntoView() {}
}

// Parse IDs from HTML
const idRegex = /id="([^"]+)"/g;
let match;
while ((match = idRegex.exec(html)) !== null) {
  elementStore.set(match[1], new MockElement(match[1]));
}

const mockDocument = {
  getElementById: (id) => {
    if (!elementStore.has(id)) {
      elementStore.set(id, new MockElement(id));
    }
    return elementStore.get(id);
  },
  querySelectorAll: (selector) => {
    const res = [];
    for (const [id, el] of elementStore.entries()) {
      if (selector.startsWith('#') && selector === `#${id}`) res.push(el);
      if (selector.startsWith('.') && el.classList.contains(selector.slice(1))) res.push(el);
      if (selector.includes('.tab-section') && id.startsWith('sec-')) res.push(el);
      if (selector.includes('.quick-pill') && id.startsWith('pill-')) res.push(el);
      if (selector.includes('.mob-nav-btn') && id.startsWith('mob-nav-')) res.push(el);
      if (selector.includes('.tab-btn') && id.startsWith('tab-')) res.push(el);
      if (selector.includes('.drawer-nav-item') && id.startsWith('drawer-tab-')) res.push(el);
    }
    return res;
  },
  addEventListener: () => {},
  createElement: (tag) => new MockElement('dyn_' + Math.random(), tag),
};

const mockLocalStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
};

const mockWindow = {
  document: mockDocument,
  localStorage: mockLocalStorage,
  location: { reload: () => {} },
  navigator: { onLine: true, serviceWorker: { register: async () => ({ update: () => {} }) } },
  addEventListener: () => {},
  scrollTo: () => {},
  showToast: (msg) => console.log('Toast:', msg),
  api: async () => ({ metricas: { totalClientes: 2, clientesCobradosHoy: 2, clientesPendientesHoy: 0, clientesAusentesHoy: 1, totalRecaudadoHoy: 90, totalEsperadoHoy: 30 }, clientes: [] }),
};

// Test running app.js
console.log('--- Simulating execution of app.js ---');
try {
  const sandbox = {
    window: mockWindow,
    document: mockDocument,
    localStorage: mockLocalStorage,
    navigator: mockWindow.navigator,
    location: mockWindow.location,
    console,
    setTimeout: (fn) => fn(),
    setInterval: () => {},
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
    decodeURIComponent,
  };
  const vm = require('vm');
  vm.createContext(sandbox);
  vm.runInContext(js, sandbox);
  console.log('✅ app.js executed without errors in global scope');

  console.log('\n--- Testing Navigation Functions in sandbox ---');
  const tabs = ['rutas', 'resumen-dia', 'caja', 'dashboard', 'nuevo', 'renovar', 'mora', 'usuarios'];
  for (const t of tabs) {
    sandbox.setTab(t);
    console.log(`✅ setTab('${t}') executed successfully`);
  }

  console.log('\n--- Testing Dropdown & Drawer ---');
  sandbox.toggleMenuDesplegable();
  sandbox.cerrarMenuDesplegable();
  sandbox.abrirDrawerMenu();
  sandbox.cerrarDrawerMenu();
  console.log('✅ Dropdown & Drawer executed successfully');

  console.log('\n--- Testing Logout & Lock ---');
  sandbox.cerrarSesion();
  sandbox.lockApp();
  console.log('✅ Logout & Lock executed successfully');

  console.log('\n--- Testing Modals ---');
  sandbox.abrirModalMovimiento();
  sandbox.cerrarModalMovimiento();
  sandbox.abrirModalRetiro();
  sandbox.cerrarModalRetiro();
  sandbox.abrirModalCajaInicial();
  sandbox.cerrarModalCajaInicial();
  sandbox.abrirModalSeguros();
  sandbox.cerrarModalSeguros();
  sandbox.abrirModalNoPagados();
  sandbox.cerrarModalNoPagados();
  console.log('✅ All modal triggers executed successfully');

} catch (err) {
  console.error('❌ SIMULATION ERROR:', err);
}
