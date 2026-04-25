# Notification Scenarios Guide

Dokumen ini menjelaskan kondisi data minimum agar notifikasi operasional muncul di sistem, serta logika teknis yang menjamin stabilitas notifikasi.

## Ringkasan Trigger

### Global/System
- `trash_cleanup` (expired): Muncul saat ada data di tempat sampah yang berusia lebih dari 30 hari.
- `trash_cleanup` (event): Muncul setelah proses cleanup (manual/otomatis) berhasil menghapus data.

### Stock Management (Admin Toko)
- `low_stock`: Muncul saat `stock <= minStock * 1.2`.
- `restock`: Muncul berdasarkan tren penjualan 7/30 hari.

### Finance & Payment (Admin Toko)
- `debt_overdue`: Muncul jika piutang pelanggan tidak ada aktivitas angsuran selama > 7 hari.
- `qris_pending`: Muncul jika ada transaksi QRIS yang masih menunggu pembayaran (belum expired).

---

## 1) Low Stock Alert
- **Syarat Data**: Produk aktif, tidak dihapus, `minStock > 0`, dan `stock <= minStock * 1.2`.
- **Href**: `/dashboard/products?q={SKU}`.
- **Severity**: `critical` (stok < min) atau `warning` (stok mendekati min).

## 2) Restock Recommendation
- **Syarat Data**: Ada penjualan valid dalam 7 atau 30 hari terakhir.
- **Href**: `/dashboard/products?q={SKU}`.
- **Logic**: Menggunakan *Urgency Score* untuk menentukan sinyal mana yang paling mendesak.

## 3) Trash Cleanup (Expired & Event)
- **Expired**: Data di trash > 30 hari. Href: `/dashboard/trash`. ID Dinamis.
- **Event**: Notifikasi sukses setelah penghapusan. Muncul di background.
- **Throttling**: Interval menit dikonfigurasi di database.

## 4) Debt Overdue (Piutang Macet)
- **Syarat Data**: 
  - Status piutang `unpaid` atau `partial`.
  - `remainingAmount > 0`.
  - `updatedAt` (aktivitas terakhir) lebih dari 7 hari yang lalu.
- **ID Notifikasi**: `debt_overdue:{debtId}`.
- **Category**: `finance`.
- **Severity**: `warning`.
- **Href**: `/dashboard/customers?search={CustomerName}`.

## 5) QRIS Pending Payment
- **Syarat Data**:
  - Metode pembayaran `qris`.
  - Status transaksi `pending_payment`.
  - Waktu expired (`qrisExpiredAt`) belum terlampaui (masih aktif).
- **ID Notifikasi**: `qris_pending:{saleId}`.
- **Category**: `payment`.
- **Severity**: `warning`.
- **Href**: `/dashboard/sales?search={InvoiceNumber}`.

---

## Mekanisme Stabilitas (First-Seen)
Semua notifikasi menggunakan tabel `notification_states` untuk:
- Mengunci tanggal `createdAt` agar tidak berubah saat refresh.
- Menyimpan status Read/Dismiss per user.
- Mengelola ID dinamis agar notifikasi penting bisa muncul kembali jika kondisi data berubah.
