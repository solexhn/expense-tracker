/* eslint-disable no-restricted-globals */
/* global importScripts, workbox */

// Este service worker es compatible con Workbox de Create React App
// El placeholder __WB_MANIFEST será reemplazado durante el build

// Importar Workbox (inyectado por CRA)
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

// Versión de la cache
const CACHE_NAME = 'expense-tracker-v1';

if (workbox) {
  console.log('Workbox cargado correctamente');

  // Precache de archivos estáticos (Workbox inject manifest)
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

  // Estrategia de cacheo para la navegación (HTML)
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: CACHE_NAME + '-pages',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        }),
      ],
    })
  );

  // Estrategia para imágenes
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: CACHE_NAME + '-images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        }),
      ],
    })
  );

  // Estrategia para API calls (si las hubiera)
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new workbox.strategies.NetworkFirst({
      cacheName: CACHE_NAME + '-api',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutos
        }),
      ],
    })
  );

  // Catch-all: NetworkFirst para todo lo demás
  workbox.routing.setDefaultHandler(
    new workbox.strategies.NetworkFirst({
      cacheName: CACHE_NAME + '-default',
    })
  );

  // Manejo de offline
  workbox.routing.setCatchHandler(({ event }) => {
    if (event.request.destination === 'document') {
      return caches.match('/index.html');
    }
    return Response.error();
  });

} else {
  console.log('Workbox no pudo cargar');
}

// Listener para mensaje SKIP_WAITING desde el cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
