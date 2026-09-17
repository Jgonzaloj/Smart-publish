// Service Worker para CrediYa - Estrategia Network-First estricta y soporte offline
const CACHE_NAME = 'crediya-cache-v33';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purgando caché obsoleta:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // No interceptar peticiones a la API del backend
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/auth') || url.pathname.startsWith('/rutas') || url.pathname.startsWith('/abonos') || url.pathname.startsWith('/caja') || url.pathname.startsWith('/clientes') || url.pathname.startsWith('/usuarios')) {
    return;
  }

  const esAppShell =
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.json');

  if (esAppShell) {
    // Network-First: Siempre consulta al servidor primero para tener la última versión
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
            const copia = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
});

