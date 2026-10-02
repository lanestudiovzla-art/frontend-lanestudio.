// LAN Estudio - Service Worker
const CACHE_NAME = 'lan-estudio-v1.0.0';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-512.png'
];

// Instalar: cachea archivos básicos
self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE).catch(err => {
        console.warn('[SW] No se pudieron cachear algunos archivos:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activar: limpia cachés viejos
self.addEventListener('activate', event => {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys().then(names => {
      return Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: network-first con fallback a cache
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // No interceptar Firebase, Chart.js, SheetJS ni CDNs externos
  if (url.origin !== self.location.origin) {
    return;
  }

  // Ignorar peticiones que no sean GET
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then(response => {
        // Guardar copia en caché solo si es OK
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, devolver cache
        return caches.match(req).then(cached => cached || caches.match('/index.html'));
      })
  );
});

// Mensajes desde la app
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
