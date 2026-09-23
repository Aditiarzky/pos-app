/// <reference lib="webworker" />

import { defaultCache } from "@serwist/vite/worker";
import { ExpirationPlugin, NetworkFirst, Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<{ url: string; revision: string }>;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
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
    ...defaultCache,
  ],
});

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

