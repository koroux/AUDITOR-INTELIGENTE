const CACHE_NAME = 'cefa-auditoria-v1';

// Archivos mínimos para que la app "instale" correctamente.
// El HTML principal se cachea también para poder abrir la app
// aunque la señal falle un instante (no es modo offline completo,
// ya que Tailwind/Chart.js/html2pdf.js se siguen cargando desde CDN).
const urlsToCache = [
  '/',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Estrategia: intenta la red primero (para tener siempre la última
// versión de la auditoría); si falla, usa la copia en caché.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
