# Rencana Analisis & Improvement Sistem Notifikasi POS

Dokumen ini adalah plan kerja untuk melakukan evaluasi dan peningkatan menyeluruh pada sistem notifikasi agar benar-benar berguna, actionable, jelas untuk user operasional POS, serta mudah di-maintain dan scalable.

## Objective
- Memastikan notifikasi benar-benar berfungsi (bukan sekadar tampil).
- Memastikan konten notifikasi relevan terhadap keputusan operasional harian.
- Memastikan UX notifikasi mudah dipahami dan tidak membingungkan.
- Menjaga arsitektur tetap rapi (`API -> Service -> Hook -> UI`) dan siap dikembangkan.

## Prinsip Implementasi
- Wajib analisis sistem existing terlebih dahulu sebelum perubahan.
- Hindari rewrite besar yang berisiko merusak fitur existing.
- Fokus pada kejelasan informasi dan anti-spam.
- Hindari over-engineering; pilih solusi sederhana namun robust.

## 1) Analisis Sistem Existing (Wajib Dulu)
### A. Identifikasi Teknis
- Telusuri bagaimana notifikasi saat ini dibuat:
  - apakah dari backend, frontend, atau campuran.
  - apakah real-time (websocket/pusher) atau fetch berkala/manual.
  - dari mana sumber data notifikasi (products, sales, trash, dll).
  - apakah notifikasi disimpan (persisted) atau hanya computed saat render/fetch.
- Inventarisasi alur saat ini:
  - trigger -> generator -> storage -> endpoint -> client state -> UI render.

### B. Evaluasi Singkat Existing
- Catat apa yang sudah benar (misal source data akurat, komponen sudah reusable, dsb).
- Catat apa yang belum berjalan (missing endpoint, race condition, stale data, dsb).
- Catat gap utama dari sisi:
  - **Logic**: aturan trigger belum lengkap, tidak ada dedup, tidak ada status read.
  - **Performa**: query berat, fetch terlalu sering, payload tidak terstruktur.
  - **UX**: pesan ambigu, tidak actionable, notif menumpuk/tidak pernah hilang.

### C. Deliverable Tahap Analisis
- Ringkasan kondisi sistem lama.
- Daftar masalah prioritas berdasarkan impact.
- Rekomendasi perubahan bertahap (low risk -> medium risk).

## 2) Improvement Logic Notifikasi
### A. Jenis Notifikasi Minimum (Actionable)
1. **Low Stock Alert**
   - Trigger: `stock <= minStock * 1.2`
   - Message harus menyebut produk dan angka stock saat ini.
2. **Restock Recommendation**
   - Berdasarkan tren penjualan 7 hari dan 30 hari.
   - Rekomendasi kuantitas restock harus jelas (minimal estimasi).
3. **Trash Cleanup Info**
   - Data dengan `deleted_at > 30 hari`.
   - Memberi info bahwa data siap dibersihkan / sudah dibersihkan.

### B. Aturan Anti Duplicate & Anti Spam
- Setiap notifikasi punya identity unik (`id` + `key` deterministik).
- Terapkan dedup key, contoh:
  - `LOW_STOCK:{productId}:{dateBucket}`
  - `RESTOCK_RECO:{productId}:{period}`
  - `TRASH_CLEANUP:{entity}:{dateBucket}`
- Terapkan cooldown agar refresh halaman tidak memunculkan notif identik berulang.
- Pisahkan status `isRead` vs `isArchived/cleaned` agar lifecycle jelas.

## 3) Improvement Arsitektur (API -> Service -> Hook -> UI)
### A. Backend
- Pastikan endpoint utama tersedia: `GET /api/notifications`
- Bentuk response wajib terstruktur:

```json
{
  "items": [
    {
      "id": "string",
      "type": "LOW_STOCK | RESTOCK_RECOMMENDATION | TRASH_CLEANUP",
      "message": "string",
      "createdAt": "ISO_DATETIME",
      "isRead": false
    }
  ]
}
```

- Tambahkan endpoint jika belum ada:
  - `PATCH /api/notifications/:id/read` (mark as read)
  - `POST /api/notifications/read/clear` (clear read notifications)
- Pastikan service layer menjadi satu pintu business logic notifikasi.

### B. Frontend
- Buat hook terpisah untuk notifikasi, contoh:
  - `useNotifications()` untuk fetch/list state.
  - `useMarkNotificationRead()` untuk aksi mark read.
  - `useClearReadNotifications()` untuk clear read.
- UI tidak boleh berisi business logic berat; hanya rendering + event handling.

## 4) Improvement UX Notifikasi
### A. Notification Bell (Top Navbar)
- Tampilkan badge jumlah unread.
- Klik bell membuka popover notifikasi.

### B. Popover Behaviour
- Tampilkan maksimal 5-8 item terbaru.
- Setiap item menampilkan:
  - icon sesuai type/severity
  - pesan singkat namun jelas
  - waktu relatif/absolut
- Tambahkan tombol **"Lihat semua notifikasi"** menuju `/dashboard/notifications`.

### C. Behaviour Read/Cleanup
- Saat user membuka detail/notifikasi, tandai sebagai `read`.
- Notifikasi `read` dapat:
  - dihapus manual (clear read), atau
  - auto clean berdasarkan policy yang disepakati.

### D. UX Problem yang Harus Dihindari
- Notif muncul tapi tidak jelas tindakan lanjutnya.
- Notif terlalu sering dan terasa spam.
- Notif tidak pernah hilang sehingga mengganggu fokus.

## 5) Refactor UI Component
### Target Komponen
- `src/components/notification-panel.tsx`

### Tujuan Refactor
- Reusable lintas halaman/layout.
- Struktur lebih clean dan tidak terlalu kompleks.
- Gunakan `lucide-react` untuk icon.
- Gunakan badge untuk severity/type agar lebih cepat dipahami.

## 6) Skenario Manual Testing (Wajib)
### A. Low Stock
- Setup: `stock = 5`, `minStock = 10`
- Expected:
  - Notifikasi low stock muncul.
  - Pesan jelas menyebut produk dan kebutuhan restock.
  - Tidak muncul duplikat saat refresh berulang.

### B. Restock Recommendation
- Setup: buat transaksi penjualan tinggi (simulasi 7 hari dan 30 hari).
- Expected:
  - Notifikasi restock recommendation muncul.
  - Ada indikasi alasan rekomendasi (tren penjualan).

### C. Trash Cleanup
- Setup: data dengan `deleted_at > 30 hari`.
- Action: buka halaman trash / jalankan cleanup flow.
- Expected:
  - Data eligible dibersihkan sesuai policy.
  - Notifikasi cleanup info muncul dengan konteks jelas.

### D. Read State
- Action: buka popover, buka salah satu notifikasi.
- Expected:
  - Status `isRead` berubah.
  - Badge unread berkurang akurat.

## 7) Unit Testing Plan (Wajib)
### A. Backend Unit Test
- `should return low stock notification when stock below threshold`
- `should return restock recommendation based on 7-day and 30-day sales`
- `should return trash cleanup notification for items older than 30 days`
- `should not duplicate notification for same key`
- `should mark notification as read`
- `should clear read notifications only`

### B. Frontend Unit Test
- `should show unread badge count correctly`
- `should render max items in popover correctly`
- `should render icon, message, and time for each notification`
- `should mark notification as read when opened`
- `should navigate to /dashboard/notifications on "Lihat semua notifikasi"`

## 8) Output yang Diharapkan Setelah Implementasi
- Penjelasan hasil analisis sistem lama (yang benar vs yang bermasalah).
- Daftar perubahan yang dilakukan.
- Alasan kenapa perubahan tersebut diperlukan (logic, performa, UX, maintainability).
- Hasil uji skenario manual.
- Unit testing plan lengkap dan siap dieksekusi.

## Tahapan Eksekusi Ringkas
1. Audit sistem existing dan tulis temuan.
2. Rapikan contract API notifikasi.
3. Implement improvement logic + dedup + anti spam.
4. Refactor service/hook/UI sesuai arsitektur.
5. Refactor `notification-panel.tsx` agar reusable dan clean.
6. Jalankan validasi manual berdasarkan skenario.
7. Siapkan unit test plan final dan dokumentasi hasil.

## Definition of Done
- Analisis existing selesai dan terdokumentasi.
- Ketiga jenis notifikasi minimum berjalan dengan benar.
- Tidak ada duplicate/spam notification saat refresh normal.
- Endpoint read dan clear read tersedia dan bekerja.
- UX bell + popover + lihat semua notifikasi berfungsi baik.
- Komponen notifikasi reusable dan lebih mudah di-maintain.
- Manual testing scenario tervalidasi.
- Unit testing plan backend + frontend tersedia jelas.
