# Panduan Versi Presentasi UML

Dokumen ini membantu menyederhanakan draft UML agar lebih cocok untuk presentasi skripsi.

## 1. Diagram yang Paling Disarankan Ditampilkan

Jika jumlah slide terbatas, prioritaskan:

1. Use Case Diagram utama
2. Activity Diagram pembelian
3. Activity Diagram penjualan
4. Activity Diagram retur
5. Sequence Diagram pembelian atau penjualan
6. Sequence Diagram retur
7. Class Diagram inti

Diagram trash dan notifikasi tetap penting, tetapi lebih cocok sebagai diagram pendukung.

---

## 2. Saran Penyederhanaan per Diagram

### A. Use Case Diagram

Pakai aktor:

- Admin Toko
- Admin Sistem
- Sistem

Batasi use case utama menjadi:

- Kelola Produk
- Kelola Pembelian
- Kelola Stok
- Buat Penjualan
- Kelola Retur
- Kelola Piutang
- Lihat Notifikasi
- Kelola Trash

Jangan tampilkan terlalu banyak `include` dan `extend` jika slide sempit.

### B. Activity Diagram Penjualan

Fokuskan hanya pada keputusan utama:

- stok cukup / tidak
- pembayaran tunai / QRIS
- pembayaran cukup / hutang
- transaksi berhasil / gagal

Jangan masukkan detail seperti `invoice final`, `mutasi saldo`, atau `hutang lama` jika dosen hanya meminta gambaran umum.

### C. Activity Diagram Pembelian

Fokuskan pada:

- pilih supplier
- input item pembelian
- update stok
- hitung average cost
- simpan transaksi pembelian

### D. Activity Diagram Retur

Fokuskan pada:

- validasi invoice
- validasi qty retur
- pilihan refund / credit note / exchange
- update stok
- hasil akhir ke customer

### E. Sequence Diagram

Untuk presentasi, cukup gunakan 4 lifeline:

- User
- Frontend
- Backend
- Database

Tambahkan lifeline eksternal hanya bila benar-benar penting, misalnya:

- Layanan QRIS

### F. Class Diagram

Untuk slide presentasi, tampilkan hanya class utama:

- User
- Customer
- Product
- ProductVariant
- PurchaseOrder
- PurchaseItem
- Sale
- SaleItem
- Debt
- CustomerReturn
- CustomerReturnItem
- CustomerExchangeItem
- StockMutation

Class seperti `NotificationState`, `TrashSettings`, `CustomerBalanceMutation`, dan `UserRole` bisa dipindah ke lampiran jika diagram terlalu padat.

---

## 3. Paket Diagram Presentasi Minimal

Jika ingin versi yang ringkas dan aman untuk sidang, gunakan paket ini:

1. `uml-use-case.puml`
2. `uml-activity-purchase.puml`
3. `uml-activity-sales.puml`
4. `uml-activity-return.puml`
5. `uml-sequence-purchase.puml`
6. `uml-sequence-return.puml`
7. `uml-class-overview.puml`

---

## 4. Paket Diagram Presentasi Lengkap

Jika dosen meminta detail lebih tinggi, tambahkan:

1. `uml-activity-product.puml`
2. `uml-sequence-sales.puml`
3. `uml-activity-trash-cleanup.puml`
4. `uml-activity-trash-restore.puml`
5. `uml-sequence-trash.puml`
6. `uml-sequence-notifications.puml`

---

## 5. Saran Narasi Saat Menjelaskan

### Use Case

Jelaskan bahwa sistem memiliki dua aktor utama manusia, yaitu admin toko dan admin sistem, serta satu aktor otomatis yaitu sistem.

### Activity Penjualan

Tekankan bahwa inti alur penjualan adalah validasi stok, pencatatan transaksi, pengurangan stok, dan penentuan status pembayaran.

### Activity Pembelian

Tekankan bahwa pembelian selalu menambah stok dan sekaligus memperbarui harga pokok rata-rata produk.

### Activity Retur

Tekankan bahwa retur selalu mengacu ke invoice asli dan memiliki tiga kemungkinan hasil, yaitu refund, credit note, atau exchange.

### Sequence

Tekankan bahwa frontend hanya mengirim input dan menampilkan hasil, sedangkan seluruh validasi bisnis terjadi di backend sebelum data disimpan ke database.

### Class Diagram

Tekankan bahwa struktur data berpusat pada produk, pembelian, transaksi penjualan, retur, pelanggan, dan mutasi stok.

---

## 6. Catatan Teknis

Semua draft sumber diagram tersedia dalam format PlantUML di folder `docs`, sehingga masih bisa disederhanakan lagi sesuai kebutuhan dosen pembimbing.
