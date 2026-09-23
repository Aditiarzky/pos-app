/// <reference lib="webworker" />

import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<{ url: string; revision: string }>;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
  },
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // 1. Explicitly bypass caching for all non-GET / mutation requests
    {
      matcher: ({ request }) => request.method !== "GET",
      handler: new NetworkOnly(),
    },
    // 2. Offline Product Catalog API (GET only, 3s network timeout, 24h cache)
    {
      matcher: ({ url, request }) =>
        request.method === "GET" &&
        url.pathname.startsWith("/api/products/offline-catalog"),
      handler: new NetworkFirst({
        cacheName: "pos-product-catalog",
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxAgeSeconds: 60 * 60 * 24,
            maxEntries: 20,
          }),
        ],
      }),
    },
    // 3. Navigation / App Shell (HTML pages)
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "pos-app-shell",
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxAgeSeconds: 60 * 60 * 24 * 7,
            maxEntries: 50,
          }),
        ],
      }),
    },
    // 4. Google Fonts Stylesheets & Web Fonts
    {
      matcher: ({ url }) =>
        url.origin === "https://fonts.googleapis.com" ||
        url.origin === "https://fonts.gstatic.com",
      handler: new CacheFirst({
        cacheName: "google-fonts",
        plugins: [
          new ExpirationPlugin({
            maxAgeSeconds: 60 * 60 * 24 * 365,
            maxEntries: 30,
          }),
        ],
      }),
    },
    // 5. Static Images & Icons
    {
      matcher: ({ request, url }) =>
        request.destination === "image" ||
        url.pathname.startsWith("/icons/") ||
        /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i.test(url.pathname),
      handler: new StaleWhileRevalidate({
        cacheName: "pos-static-images",
        plugins: [
          new ExpirationPlugin({
            maxAgeSeconds: 60 * 60 * 24 * 30,
            maxEntries: 100,
          }),
        ],
      }),
    },
    // 6. Static CSS & JS Assets
    {
      matcher: ({ request, url }) =>
        request.destination === "script" ||
        request.destination === "style" ||
        /\.(?:js|css)$/i.test(url.pathname),
      handler: new StaleWhileRevalidate({
        cacheName: "pos-static-assets",
        plugins: [
          new ExpirationPlugin({
            maxAgeSeconds: 60 * 60 * 24 * 7,
            maxEntries: 100,
          }),
        ],
      }),
    },
  ],
});

// Offline Fallback for document navigation
serwist.setCatchHandler(async ({ request }) => {
  if (request.destination === "document" || request.mode === "navigate") {
    const cachedOffline = await caches.match("/offline");
    if (cachedOffline) {
      return cachedOffline;
    }
    return new Response(
      `<!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Offline - POS App</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
          body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #f8fafc; color: #1e293b; padding: 1.5rem; text-align: center; }
          .card { background: #ffffff; padding: 2rem; border-radius: 1rem; border: 1px solid #e2e8f0; max-width: 420px; width: 100%; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
          .icon-wrap { width: 4rem; height: 4rem; background: #f0fdfa; color: #0d9488; border-radius: 9999px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; }
          h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: #0f172a; }
          p { font-size: 0.875rem; color: #64748b; line-height: 1.5; margin-bottom: 1.5rem; }
          .btn-group { display: flex; gap: 0.75rem; }
          .btn { flex: 1; padding: 0.625rem 1rem; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 600; text-decoration: none; border: none; cursor: pointer; transition: all 0.15s ease; }
          .btn-secondary { background: #f1f5f9; color: #334155; }
          .btn-primary { background: #0f766e; color: #ffffff; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
              <path d="M10.71 5.05A16 16 0 0 1 22.56 9"></path>
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
              <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
          </div>
          <h1>Koneksi Terputus</h1>
          <p>Anda sedang berada dalam mode offline. Buka kembali halaman kasir untuk melanjutkan transaksi secara lokal.</p>
          <div class="btn-group">
            <button onclick="window.location.reload()" class="btn btn-secondary">Coba Lagi</button>
            <a href="/dashboard/sales" class="btn btn-primary">Buka Kasir</a>
          </div>
        </div>
      </body>
      </html>`,
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }
  return Response.error();
});

// Listen for SKIP_WAITING from update prompt
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Push Notifications
self.addEventListener("push", (event: PushEvent) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "POS App", {
      body: data.body ?? "Ada notifikasi baru",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      data: data.url ?? "/dashboard/notifications",
    }),
  );
});

serwist.addEventListeners();
