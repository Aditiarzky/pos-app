// Base Service Worker for POS App (Sprint 1)
// Sprint 2 will upgrade this with Serwist app shell precaching and offline caching.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Let the browser handle standard requests normally in Sprint 1
  event.respondWith(
    fetch(event.request).catch((err) => {
      // In case network fails
      return caches.match(event.request).then((res) => {
        if (res) return res;
        throw err;
      });
    })
  );
});
