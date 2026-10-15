self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("institutos-pwa-v1").then((cache) => cache.add("/offline.html"))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("institutos-pwa-") && key !== "institutos-pwa-v1"
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const offlinePage = await caches.match("/offline.html");
        if (offlinePage) return offlinePage;
        throw new Error("No hay una página offline disponible");
      })
    );
    return;
  }

  const publicImages = new Set([
    "/icon-192.png",
    "/icon-512.png",
    "/apple-touch-icon.png",
  ]);
  if (request.destination !== "image" || !publicImages.has(url.pathname)) return;

  event.respondWith(
    caches.open("institutos-pwa-v1").then(async (cache) => {
      const cachedImage = await cache.match(request);
      if (cachedImage) return cachedImage;

      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })
  );
});
