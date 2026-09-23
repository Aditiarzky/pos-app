 
# PWA Implementation Plan for POS App

Dokumen ini adalah rencana high-level untuk mengubah POS web app menjadi PWA. Target pembaca: agent/engineer berikutnya yang akan mengimplementasikan fitur ini secara bertahap.

## Context

Stack saat ini:

- Next.js + TypeScript
- Deploy ke Cloudflare Workers melalui vinext
- Drizzle + PostgreSQL Neon
- TanStack Query
- shadcn/ui
- Barcode scanner berbasis kamera
- App Router di `src/app`
- API route utama di `src/app/api`

Tujuan PWA:

- App bisa di-install di Android, desktop, dan iOS melalui Add to Home Screen.
- Kasir tetap bisa membuka halaman transaksi saat koneksi buruk.
- Katalog produk kasir tersedia offline.
- Transaksi cash bisa dicatat offline dan disinkronkan saat online.
- Kamera tetap bisa dipakai untuk barcode scanner.
- Push notification tersedia untuk notifikasi operasional penting.

## Main Technical Decision

Gunakan Serwist, bukan `next-pwa`.

Karena project ini memakai vinext, build production berjalan melalui Vite. Maka jalur utama yang direkomendasikan adalah:

- `@serwist/vite`
- `serwist`
- `@serwist/window` jika perlu update prompt atau kontrol registrasi service worker dari client

Jangan mulai dari `next-pwa` karena sudah bukan pilihan utama untuk project baru. Jangan asumsikan `@serwist/next` langsung cocok, karena integrasi itu lebih cocok untuk pipeline Next/Webpack atau Next build biasa. Untuk vinext, perlakukan PWA sebagai integrasi Vite.

Catatan penting:

- Cloudflare Worker dan browser Service Worker adalah dua hal berbeda.
- Browser service worker harus tersedia sebagai `/sw.js`.
- Scope service worker harus root `/` agar bisa mengontrol `/dashboard/*`.
- Kamera, service worker, dan push notification membutuhkan secure context: HTTPS atau localhost.

## Target Architecture

### Browser Service Worker

Service worker bertugas untuk:

- Precache app shell dan static assets.
- Cache halaman utama dashboard/sales agar app tetap terbuka saat offline.
- Runtime cache untuk endpoint katalog produk offline.
- Menangani push event dan notification click.

Service worker tidak bertugas untuk:

- Menyimpan transaksi offline secara langsung.
- Meng-cache mutation API seperti `POST /api/sales`.
- Menjadi sumber kebenaran stok atau transaksi.

### IndexedDB

IndexedDB menjadi local storage utama untuk fitur offline POS.

Object store yang dibutuhkan:

- `products`: katalog produk dan varian untuk kasir.
- `salesQueue`: transaksi offline yang belum tersinkron.
- `syncLog`: log hasil sinkronisasi, konflik, dan error.

Library yang disarankan:

- `idb` untuk implementasi ringan.
- Gunakan `dexie` hanya jika query lokal makin kompleks.

### TanStack Query

TanStack Query tetap digunakan untuk UI state dan server cache, bukan sebagai sumber utama offline POS.

Aturan:

- Query produk kasir boleh memakai `networkMode: "offlineFirst"`.
- Query transaksi, report, dashboard analytics tetap online/fresh.
- Jangan mengandalkan persisted TanStack cache untuk queue transaksi.
- Setelah sync berhasil, invalidate query terkait: products, sales, dashboard, notifications.

## Offline Strategy

### Offline Catalog

Buat endpoint khusus katalog kasir:

```txt
GET /api/products/offline-catalog
```

Endpoint ini harus mengembalikan data minimal untuk transaksi:

```ts
type OfflineProduct = {
  productId: number;
  variantId: number;
  barcode: string | null;
  name: string;
  variantName: string;
  sellPrice: number;
  stock: number;
  unit: string;
  updatedAt: string;
};
```

Jangan memakai endpoint list produk admin yang paginated untuk offline POS. Katalog kasir harus compact, cepat, dan mudah disimpan ke IndexedDB.

Flow:

1. Saat online, fetch `/api/products/offline-catalog`.
2. Simpan hasil ke IndexedDB `products`.
3. Barcode scanner mencari produk dari IndexedDB dulu.
4. Jika online, boleh background refresh katalog.
5. Tampilkan status "Katalog terakhir diperbarui ..." di UI kasir.

### Offline Sales Queue

Tahap awal hanya dukung transaksi offline untuk:

- `paymentMethod: "cash"`
- status final `completed`
- produk yang ada di katalog offline

Jangan dukung offline untuk tahap awal:

- QRIS, karena butuh Pakasir online.
- Pembayaran hutang lama otomatis.
- Customer balance.
- Return/refund.
- Purchase/restock.

Setiap transaksi offline harus punya:

```ts
clientRequestId: string;
createdOfflineAt: string;
```

Gunakan `crypto.randomUUID()` untuk `clientRequestId`.

Saat transaksi dibuat offline:

1. Validasi stok lokal berdasarkan katalog terakhir.
2. Simpan transaksi ke `salesQueue`.
3. Kurangi stok lokal secara optimistic untuk UX kasir.
4. Buat receipt lokal dengan status "Belum tersinkron".
5. Tampilkan badge jumlah transaksi pending.

### Offline-to-Online Sync

Buat endpoint:

```txt
POST /api/sales/sync-batch
```

Payload:

```ts
type SyncSalesPayload = {
  sales: Array<{
    clientRequestId: string;
    createdOfflineAt: string;
    userId: number;
    customerId?: number;
    paymentMethod: "cash";
    totalPaid: number;
    items: Array<{
      productId: number;
      variantId: number;
      qty: number;
    }>;
  }>;
};
```

Response:

```ts
type SyncSalesResult = {
  synced: Array<{
    clientRequestId: string;
    saleId: number;
    invoiceNumber: string;
  }>;
  conflicts: Array<{
    clientRequestId: string;
    reason: "INSUFFICIENT_STOCK" | "PRODUCT_CHANGED" | "VALIDATION_ERROR";
    message: string;
  }>;
  failed: Array<{
    clientRequestId: string;
    message: string;
  }>;
};
```

Server sync harus idempotent.

Tambahkan kolom unik di tabel `sales`:

```txt
client_request_id unique nullable
```

Jika request sync terkirim dua kali dengan `clientRequestId` yang sama, server harus mengembalikan transaksi yang sudah pernah dibuat, bukan membuat transaksi baru.

Konflik stok:

- Server tetap menjadi sumber kebenaran.
- Jika stok server tidak cukup, jangan paksa transaksi masuk.
- Tandai item queue sebagai conflict.
- UI harus memberi pilihan manual: edit qty, batal, atau tunggu restock.

## Manifest and Installability

Buat manifest:

```txt
public/manifest.webmanifest
```

Isi minimum:

```json
{
  "id": "/",
  "name": "POS App",
  "short_name": "POS",
  "description": "Aplikasi kasir dan manajemen toko",
  "start_url": "/dashboard/sales?source=pwa",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#0f766e",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

Tambahkan icon:

- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/badge-72.png` untuk notification badge jika diperlukan
- Apple touch icon jika ingin iOS lebih rapi

Tambahkan metadata di root layout:

- manifest link
- theme color
- apple web app capable
- apple title

## Camera Requirements

Barcode scanner sudah client-only dan memakai dynamic import. Pertahankan pola itu.

Hal yang harus dijaga:

- Scanner hanya berjalan di client component.
- Jangan render scanner dari server component secara langsung tanpa dynamic import.
- Kamera hanya akan jalan di HTTPS atau localhost.
- Install PWA tidak otomatis memberi izin kamera.
- User tetap harus memberi camera permission.

Jika menambahkan security headers, pastikan kamera tidak terblokir:

```txt
Permissions-Policy: camera=(self)
```

Testing kamera:

- Android Chrome browser
- Android installed PWA
- iOS Safari browser
- iOS Home Screen PWA
- Desktop browser dengan webcam jika tersedia

## Push Notification Plan

Use case push yang disarankan:

- QRIS berhasil dibayar.
- Stok menipis.
- Sync offline gagal atau conflict.
- Notifikasi admin penting.
- Password reset request jika relevan dengan flow aplikasi.

Jangan jadikan push sebagai syarat utama transaksi kasir. Push adalah enhancement.

Backend storage:

```txt
push_subscriptions
```

Field minimum:

- `id`
- `user_id`
- `endpoint`
- `p256dh`
- `auth`
- `user_agent`
- `created_at`
- `revoked_at`

Library push untuk Cloudflare Workers:

- Prefer library berbasis Web Crypto seperti `@mmmike/web-push` atau `@block65/webcrypto-web-push`.
- Hindari `web-push` klasik jika tidak benar-benar perlu Node compatibility.

Client flow:

1. Pastikan service worker ready.
2. Minta permission notification dari gesture user, misalnya tombol "Aktifkan Notifikasi".
3. Subscribe dengan VAPID public key.
4. Kirim subscription ke `/api/push/subscribe`.
5. Simpan subscription di database.

iOS notes:

- iOS/iPadOS hanya reliable untuk Web Push setelah user menambahkan app ke Home Screen.
- Tampilkan instruksi manual Add to Home Screen untuk iOS.
- Jangan tampilkan prompt push terlalu awal.

## Sprint Plan

### Sprint 1: Installable PWA

Kompleksitas: S

Goal:

- App memenuhi syarat installable dasar.

Deliverables:

- `manifest.webmanifest`
- Icon 192 dan 512 maskable
- Metadata root layout
- Basic install test di Chrome DevTools
- Dokumentasi singkat cara install Android dan iOS

Acceptance criteria:

- Chrome DevTools Application tab membaca manifest dengan benar.
- App bisa diinstall di Android Chrome atau desktop Chrome.
- Installed app membuka `/dashboard/sales`.

### Sprint 2: Service Worker App Shell

Kompleksitas: M

Goal:

- App shell dan static assets bisa diload saat offline.

Deliverables:

- Integrasi `@serwist/vite`
- `src/sw.ts`
- Precache static assets
- Runtime cache aman untuk navigation/app shell
- Offline fallback sederhana
- Update prompt jika service worker baru tersedia

Acceptance criteria:

- Setelah online sekali, app masih membuka shell saat offline.
- Mutation API tidak dicache.
- Build vinext tetap berhasil.

### Sprint 3: Offline Product Catalog

Kompleksitas: M/L

Goal:

- Kasir bisa mencari/scan produk dari katalog lokal.

Deliverables:

- Endpoint `/api/products/offline-catalog`
- IndexedDB store `products`
- Sync catalog saat online
- Barcode lookup dari IndexedDB
- UI status katalog terakhir diperbarui

Acceptance criteria:

- Produk bisa dicari offline setelah katalog pernah disync.
- Barcode scanner menemukan produk offline.
- Tidak bergantung pada TanStack Query cache untuk data offline.

### Sprint 4: Offline Sales Queue

Kompleksitas: L

Goal:

- Kasir bisa mencatat transaksi cash saat offline.

Deliverables:

- IndexedDB store `salesQueue`
- `clientRequestId` untuk setiap transaksi offline
- Local receipt dengan status belum tersinkron
- Pending sync badge
- Optimistic local stock decrement

Acceptance criteria:

- Transaksi cash bisa dibuat saat offline.
- Transaksi tersimpan walau browser/PWA ditutup.
- QRIS dan fitur non-supported diblokir saat offline dengan pesan jelas.

### Sprint 5: Sync and Conflict Handling

Kompleksitas: XL

Goal:

- Transaksi offline tersinkron ke server secara aman dan idempotent.

Deliverables:

- Migration `client_request_id` unik pada `sales`
- Endpoint `/api/sales/sync-batch`
- Sync worker/client job saat online
- Conflict handling stok
- Invalidate TanStack Query setelah sync
- Sync log

Acceptance criteria:

- Transaksi yang sama tidak bisa masuk dua kali.
- Conflict stok terlihat jelas di UI.
- Setelah sync sukses, sales list dan produk online refresh.

### Sprint 6: Push Notification and Permissions

Kompleksitas: M

Goal:

- Push notification dasar berjalan untuk event operasional.

Deliverables:

- VAPID key setup
- `push_subscriptions` table
- `/api/push/subscribe`
- `/api/push/unsubscribe`
- Server utility untuk send push
- Push handler di service worker
- UI toggle notification
- iOS install guidance

Acceptance criteria:

- User bisa subscribe/unsubscribe.
- Test notification muncul.
- Notification click membuka halaman relevan.

### Sprint 7: Testing, Hardening, and Thesis Documentation

Kompleksitas: M

Goal:

- Fitur siap didemokan dan dijelaskan dalam skripsi.

Deliverables:

- Test matrix offline/online
- Lighthouse PWA report
- Manual test kamera
- Manual test duplicate sync
- Manual test conflict stock
- Dokumentasi batasan fitur offline
- Diagram arsitektur PWA
- Skenario demo skripsi

Acceptance criteria:

- Demo installable berjalan.
- Demo scan produk offline berjalan.
- Demo transaksi offline lalu sync berjalan.
- Demo conflict handling tersedia.
- Batasan QRIS offline dijelaskan.

## Recommended Implementation Order

Urutan kerja yang paling aman:

1. Manifest dan icons.
2. Service worker minimal tanpa offline data.
3. IndexedDB utility.
4. Offline catalog endpoint.
5. UI kasir membaca catalog dari IndexedDB.
6. Offline queue untuk transaksi cash.
7. Server sync batch idempotent.
8. Conflict UI.
9. Push notification.
10. Final testing dan dokumentasi.

## Risks and Guardrails

Risiko utama:

- Service worker terlalu agresif meng-cache API dan menyebabkan data admin/report stale.
- Transaksi offline masuk dobel saat retry.
- Stok lokal tidak sama dengan stok server.
- QRIS dicoba offline padahal provider butuh koneksi.
- iOS push dianggap sama seperti Android, padahal perlu installed PWA.
- Kamera gagal karena bukan HTTPS atau permission policy.

Guardrails:

- Cache hanya GET yang aman.
- Jangan cache `POST`, `PATCH`, `PUT`, `DELETE`.
- Semua transaksi offline wajib punya `clientRequestId`.
- Server sync harus idempotent.
- Offline tahap awal hanya cash sale.
- TanStack Query cache bukan sumber transaksi offline.
- Selalu invalidate query setelah sync sukses.

## Files Likely to Change

Config and PWA:

- `vite.config.ts`
- `src/sw.ts`
- `public/manifest.webmanifest`
- `public/icons/*`
- `src/app/layout.tsx`

Offline storage:

- `src/lib/offline-db.ts`
- `src/lib/offline-sales-queue.ts`
- `src/lib/offline-catalog.ts`

API:

- `src/app/api/products/offline-catalog/route.ts`
- `src/app/api/sales/sync-batch/route.ts`
- `src/app/api/push/subscribe/route.ts`
- `src/app/api/push/unsubscribe/route.ts`

Database:

- `src/drizzle/schema.ts`
- new Drizzle migration for `client_request_id`
- new Drizzle migration for `push_subscriptions`

Frontend:

- `src/components/providers/QueryProvider.tsx`
- `src/lib/react-query.ts`
- sales page and sales form components
- barcode scanner integration points
- notification UI components

## Final Definition of Done

PWA conversion is considered done when:

- App is installable.
- App shell loads offline after first visit.
- Product catalog for cashier works offline.
- Barcode scanner works in installed PWA.
- Cash sale can be queued offline.
- Queued sale syncs when online.
- Duplicate sync does not create duplicate sale.
- Stock conflicts are visible and recoverable.
- Push notification can be enabled and tested.
- The implementation limitations are documented for the thesis.
