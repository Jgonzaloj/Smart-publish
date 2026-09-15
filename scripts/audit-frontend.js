const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- INICIANDO AUDITORÍA INTEGRAL DE FRONTEND JS & HTML ---');

// 1. Extraer todos los onclick de index.html
const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

const onclickRegex = /onclick="([^"]+)"/g;
const calledFunctions = new Set();
let match;
while ((match = onclickRegex.exec(htmlContent)) !== null) {
  const expr = match[1];
  if (expr.includes('event.stopPropagation()')) continue;
  // Extraer nombre de la función
  const fnMatch = expr.match(/([a-zA-Z0-9_$]+)\s*\(/);
  if (fnMatch) {
    calledFunctions.add(fnMatch[1]);
  }
}
console.log(`Funciones invocadas en HTML onclick (${calledFunctions.size}):`, Array.from(calledFunctions));

// 2. Mockear entorno de navegador para ejecutar app.js
const mockWindow = {
  addEventListener: (event, cb) => { if (event === 'DOMContentLoaded' || event === 'load') cb(); },
  removeEventListener: () => {},
  location: { reload: () => {}, href: '' }
};
const mockDocument = {
  getElementById: (id) => ({
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    style: {},
    setAttribute: () => {},
    removeAttribute: () => {},
    addEventListener: () => {},
    value: '',
    innerText: '',
    innerHTML: '',
    appendChild: () => {},
    removeChild: () => {},
    focus: () => {},
    reset: () => {},
    options: [],
    selectedIndex: 0
  }),
  querySelectorAll: () => [],
  querySelector: () => null,
  addEventListener: () => {},
  createElement: () => ({
    classList: { add: () => {}, remove: () => {} },
    style: {},
    setAttribute: () => {},
    appendChild: () => {},
    removeChild: () => {},
    click: () => {}
  }),
  body: { appendChild: () => {}, removeChild: () => {} }
};

const mockLocalStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};

const sandbox = {
  window: mockWindow,
  document: mockDocument,
  localStorage: mockLocalStorage,
  navigator: { onLine: true, serviceWorker: { register: () => Promise.resolve() } },
  console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
  Blob: class {},
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
  alert: console.log,
  confirm: () => true,
  prompt: () => '1234',
  Date,
  Math,
  Number,
  String,
  Boolean,
  Array,
  Object,
  JSON,
  RegExp,
  Error,
  Promise
};
sandbox.window.window = sandbox.window;
sandbox.window.document = mockDocument;

const appJsPath = path.join(__dirname, '..', 'public', 'app.js');
const appJsCode = fs.readFileSync(appJsPath, 'utf8');

try {
  vm.createContext(sandbox);
  vm.runInContext(appJsCode, sandbox);
  console.log('✅ app.js ejecutó sin ningún ReferenceError ni error de sintaxis!');
} catch (err) {
  console.error('❌ ERROR CRÍTICO al ejecutar app.js:', err);
  process.exit(1);
}

// 3. Verificar que todas las funciones llamadas en HTML estén definidas en sandbox o window
console.log('\n--- VERIFICANDO QUE TODAS LAS FUNCIONES DE HTML ESTÉN DEFINIDAS ---');
let missingCount = 0;
for (const fnName of calledFunctions) {
  const isGlobal = typeof sandbox[fnName] === 'function';
  const isWindow = typeof sandbox.window[fnName] === 'function';
  if (isGlobal || isWindow) {
    console.log(`  ✓ ${fnName}: DISPONIBLE`);
  } else {
    console.error(`  ❌ ${fnName}: NO DEFINIDA`);
    missingCount++;
  }
}

if (missingCount > 0) {
  console.error(`\n❌ Se encontraron ${missingCount} funciones no definidas.`);
  process.exit(1);
} else {
  console.log('\n🎉 ¡TODAS LAS FUNCIONES DEL FRONTEND ESTÁN DEFINIDAS Y AUDITADAS CON ÉXITO!');
}
