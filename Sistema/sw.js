const CACHE_NAME = 'catastro-vawi-v5';

// Instalación inmediata del Service Worker
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

// Limpieza de cachés antiguas
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Interceptor de peticiones seguro
self.addEventListener('fetch', (e) => {
    // 1. Ignorar peticiones que no sean GET (como solicitudes POST de AJAX)
    if (e.request.method !== 'GET') {
        return;
    }

    // 2. Ignorar extensiones de Chrome u otros esquemas fuera de http/https
    if (!e.request.url.startsWith('http://') && !e.request.url.startsWith('https://')) {
        return;
    }

    // 3. Estrategia Network First (red primero, respaldo en caché)
    e.respondWith(
        fetch(e.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(e.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Si el recurso no existe en la caché y no hay red, responder de forma segura
                    return new Response('Sin conexión a Internet', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: new Headers({ 'Content-Type': 'text/plain' })
                    });
                });
            })
    );
});