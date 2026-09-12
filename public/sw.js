// Service Worker para CrediYa - Cache estático y soporte offline-first
const CACHE_NAME = 'crediya-cache-v3';
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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Las peticiones GET a recursos estáticos se sirven de caché con fallback de red
  if (event.request.method === 'GET') {
    const url = new URL(event.request.url);
    if (
      url.pathname === '/' ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.json') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic')
    ) {
      event.respondWith(
        caches.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
            }
            return networkResponse;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      );
    }
  }
});
