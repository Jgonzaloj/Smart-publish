// Service Worker para CrediYa - Cache estático y soporte offline-first (Network-First)
const CACHE_NAME = 'crediya-cache-v18'; // Subir versión para forzar invalidación de caché viejo
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const esAppShell =
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.json');

  const esRecursoExterno = url.hostname.includes('googleapis') || url.hostname.includes('gstatic');

  if (esAppShell) {
    // Red primero: si hay internet, siempre trae la versión más reciente del servidor.
    // Si no hay señal (offline), usa la copia guardada.
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copia = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (esRecursoExterno) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copia = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          }
          return networkResponse;
        });
      })
    );
  }
});
