// Service worker mínimo: habilita la instalación como PWA.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Sin caché por ahora: siempre red. Se puede extender para offline.
  event.respondWith(fetch(event.request));
});
