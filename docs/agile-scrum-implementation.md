# Implementasi Agile Scrum — Sistem POS Gunung Muria Grosir

## Tabel 1: User Story

| No | Sebagai | Saya Ingin | Sehingga |
|----|---------|------------|----------|
| 1 | Admin Toko | mengatur produk dalam berbagai satuan (Dus, Pak, Pcs, dll.) | stok otomatis terkonversi ke satuan terkecil saat dijual eceran |
| 2 | Admin Toko | memproses penjualan dengan scan barcode dan pencarian nama/SKU cepat | antrean pelanggan tidak menumpuk dan total transaksi terhitung otomatis |
| 3 | Admin Toko | sistem menghitung hpp otomatis tiap barang masuk | saya mengetahui keuntungan bersih yang akurat |
| 4 | Admin Toko | melihat daftar pelanggan yang memiliki simpanan saldo atau hutang | penagihan piutang lebih tertata |
| 5 | Admin Toko | menggunakan saldo pelanggan untuk memotong total belanjaan di transaksi berikutnya | pelanggan tidak perlu membawa uang tunai kembali |
| 6 | Admin Toko | mencatat pembayaran hutang pelanggan dan memperbarui status transaksi | piutang pelanggan terlunasi secara sistematis |
| 7 | Admin Toko | mencatat nota pembelian dari supplier | stok bertambah dan harga modal terbaru tercatat otomatis |
| 8 | Admin Toko | memproses retur barang dari pelanggan dengan opsi kompensasi | pelanggan mendapat pengembalian sesuai kebijakan toko |
| 9 | Admin Toko | melihat laporan laba rugi berdasarkan selisih harga jual dan HPP | saya dapat mengevaluasi performa toko secara harian/bulanan |
| 10 | Admin Toko | menerima peringatan otomatis untuk produk di bawah batas minimum stok | saya segera memesan ulang ke supplier |
| 11 | Admin Sistem | melihat riwayat mutasi stok secara detail | saya dapat melacak selisih atau barang hilang |
| 12 | Admin Sistem | mengelola akun pengguna beserta hak akses (RBAC) | hanya anggota terdaftar yang dapat mengakses sistem |
| 13 | Admin Sistem | memantau siapa yang melakukan setiap transaksi | jika ada selisih, saya tahu akun mana yang bertanggung jawab |

---

## Tabel 2: Product Backlog

| No | Komponen | Tingkat Prioritas |
|----|----------|-------------------|
| 1 | Perancangan Sistem dan Basis Data | Tinggi |
| 2 | Login & Autentikasi Pengguna | Tinggi |
| 3 | Dashboard Admin Sistem & Admin Toko | Sedang |
| 4 | Manajemen Produk & Konversi Satuan | Tinggi |
| 5 | Manajemen Kategori & Barcode | Tinggi |
| 6 | Transaksi Penjualan (Kasir) | Tinggi |
| 7 | Pembelian Barang dari Supplier | Tinggi |
| 8 | Perhitungan HPP| Tinggi |
| 9 | Manajemen Pelanggan, Saldo & Piutang | Tinggi |
| 10 | Pelunasan Hutang Pelanggan | Tinggi |
| 11 | Penggunaan Saldo Pelanggan saat Transaksi | Tinggi |
| 12 | Proses Retur & Tukar Barang | Sedang |
| 13 | Audit Mutasi Stok & Stock Opname | Sedang |
| 14 | Laporan Laba Rugi & Performa Toko | Sedang |
| 15 | Peringatan Stok Habis (Low Stock Alert) | Rendah |
| 16 | Pengelolaan Akun & Akses (RBAC) | Tinggi |
| 17 | Log Transaksi & Audit Trail | Sedang |
| 18 | Notifikasi Sistem | Rendah |
| 19 | Pengaturan Toko & Struk | Rendah |

---

## Tabel 3: Sprint Planning

### Sprint 1 — Fondasi Sistem & Autentikasi (Hari 1–10)

| No | Fitur | Aktor | Estimasi (Hari) |
|----|-------|-------|-----------------|
| 1 | Perancangan basis data (schema, relasi, enum) | Admin Sistem | 2 |
| 2 | Setup proyek (Next.js, Drizzle ORM, PostgreSQL) | Admin Sistem | 1 |
| 3 | Halaman login & autentikasi (JWT + refresh token) | Admin Sistem, Admin Toko | 2 |
| 4 | Dashboard awal (ringkasan stok, penjualan hari ini) | Admin Sistem, Admin Toko | 2 |
| 5 | CRUD pengguna & pengaturan role (Admin Sistem / Admin Toko) | Admin Sistem | 2 |
| 6 | Pengaturan profil toko (nama, alamat, struk) | Admin Sistem | 1 |
| | **Total** | | **10** |

**Sprint Goal:** Sistem dapat diakses oleh pengguna terdaftar dengan pemisahan hak akses berdasarkan role.

---

### Sprint 2 — Manajemen Produk & Pembelian (Hari 11–20)

| No | Fitur | Aktor | Estimasi (Hari) |
|----|-------|-------|-----------------|
| 7 | CRUD kategori produk | Admin Sistem | 1 |
| 8 | CRUD produk dengan multi-satuan & konversi base unit | Admin Sistem | 3 |
| 9 | CRUD barcode produk (input manual, dipakai untuk scan) | Admin Sistem | 1 |
| 10 | CRUD supplier | Admin Sistem, Admin Toko | 1 |
| 11 | Input nota pembelian dari supplier | Admin Sistem, Admin Toko | 2 |
| 12 | Perhitungan average otomatis saat pembelian | Admin Sistem | 2 |
| | **Total** | | **10** |

**Sprint Goal:** Admin dapat mengelola katalog produk lengkap dengan multi-satuan dan mencatat pembelian yang memperbarui stok serta harga modal rata-rata.

---

### Sprint 3 — Transaksi Penjualan & Pembayaran (Hari 21–30)

| No | Fitur | Aktor | Estimasi (Hari) |
|----|-------|-------|-----------------|
| 13 | Halaman kasir (scan barcode, cari nama/SKU) | Admin Sistem, Admin Toko | 3 |
| 14 | Perhitungan total dan sub-total otomatis | Admin Sistem | 1 |
| 15 | Pembayaran tunai (hitung kembalian) | Admin Sistem, Admin Toko | 1 |
| 16 | Pembayaran QRIS (integrasi Pakasir API) | Admin Sistem, Admin Toko | 2 |
| 17 | Pencetakan struk transaksi | Admin Sistem, Admin Toko | 1 |
| 18 | CRUD pelanggan & pencatatan saldo kredit | Admin Sistem, Admin Toko | 2 |
| | **Total** | | **10** |

**Sprint Goal:** Kasir dapat memproses transaksi penjualan tunai maupun QRIS dengan perhitungan otomatis dan struk tercetak. Pajak dikonfigurasi terpisah sebagai komponen biaya pada laporan laba rugi, bukan per transaksi.

---

### Sprint 4 — Piutang, Saldo & Retur (Hari 31–40)

| No | Fitur | Aktor | Estimasi (Hari) |
|----|-------|-------|-----------------|
| 19 | Pencatatan hutang otomatis saat pembayaran kurang | Admin Sistem, Admin Toko | 2 |
| 20 | Pelunasan hutang dari daftar piutang | Admin Sistem, Admin Toko | 1 |
| 21 | Penggunaan saldo pelanggan saat transaksi | Admin Sistem, Admin Toko | 1 |
| 22 | Pelunasan hutang otomatis dari kembalian tunai | Admin Sistem, Admin Toko | 1 |
| 23 | Proses retur barang (refund, credit note, tukar barang) | Admin Sistem, Admin Toko | 3 |
| 24 | Penanganan stok retur (restock vs rusak) | Admin Sistem | 1 |
| 25 | Koreksi pembelian (Data Salah & Data Tidak Berguna) | Admin Sistem, Admin Toko | 1 |
| | **Total** | | **10** |

**Sprint Goal:** Sistem mendukung skenario pembayaran piutang, penggunaan saldo pelanggan, dan proses retur dengan berbagai opsi kompensasi.

---

### Sprint 5 — Inventori, Laporan & Analitik (Hari 41–50)

| No | Fitur | Aktor | Estimasi (Hari) |
|----|-------|-------|-----------------|
| 26 | Audit mutasi stok (filter berdasarkan tipe & periode) | Admin Sistem | 2 |
| 27 | Stock opname via lembar kerja (cetak & input hasil) | Admin Sistem | 2 |
| 28 | Penyesuaian stok langsung dari sistem | Admin Sistem | 1 |
| 29 | Laporan laba rugi (pendapatan, HPP, biaya ops, pajak) | Admin Sistem | 2 |
| 30 | Grafik performa penjualan & produk terlaris | Admin Sistem | 1 |
| 31 | Peringatan stok rendah (low stock alert) | Admin Sistem, Admin Toko | 1 |
| ~~32~~ | ~~Retur ke supplier~~ — *tidak diimplementasikan* | ~~Admin Sistem~~ | ~~1~~ |
| | **Total** | | **9** |

**Sprint Goal:** Admin Sistem dapat melakukan audit stok, stock opname, dan mengakses laporan keuangan untuk evaluasi performa toko.

---

### Sprint 6 — Penyempurnaan, Notifikasi & Deployment (Hari 51–60)

| No | Fitur | Aktor | Estimasi (Hari) |
|----|-------|-------|-----------------|
| 33 | Sistem notifikasi (stok rendah, piutang jatuh tempo) | Admin Sistem, Admin Toko | 2 |
| 34 | Pencatatan pengguna pada setiap transaksi penjualan (siapa yang memproses) | Admin Sistem | 1 |
| 35 | Penyempurnaan UI/UX & responsif mobile | Admin Sistem, Admin Toko | 2 |
| 36 | Cetak laporan (format A4 via print browser) | Admin Sistem | 1 |
| 37 | Testing menyeluruh (unit test & integration test) | Admin Sistem | 2 |
| 38 | Deployment & konfigurasi production | Admin Sistem | 1 |
| ~~39~~ | ~~Dokumentasi pengguna akhir~~ — *tidak diimplementasikan* | ~~Admin Sistem~~ | ~~1~~ |
| | **Total** | | **9** |

**Sprint Goal:** Sistem siap dirilis dengan notifikasi aktif, UI yang matang, dan pencatatan pengguna per transaksi.

---

## Tabel 4: Skenario Increment dari Sprint Review

Berikut adalah increment yang ditambahkan berdasarkan masukan dari Sprint Review:

### Increment 1 — Penyederhanaan Input Satuan (dari Sprint 2 Review)

| Aspek | Detail |
|-------|--------|
| **Masukan** | Input konversi satuan terlalu rumit karena harus menghitung manual ke satuan terkecil. Misalnya: 1 Dus = 12 Pak × 24 Pcs = 288 Pcs, admin harus mengetik 288 secara manual. |
| **Increment** | Sistem menyediakan fitur referensi satuan sebelumnya. Saat menambah satuan baru, admin cukup memilih satuan acuan yang sudah ada (misal: Pak), lalu mengisi faktor konversi terhadap satuan tersebut (1 Pak = 24 Pcs). Sistem otomatis menghitung conversionToBase ke base unit. |
| **Sprint Terpengaruh** | Sprint 2 (penyesuaian pada fitur nomor 8) |
| **Estimasi Tambahan** | +1 hari |

**Contoh alur increment:**
```
Sebelum:  Admin input 1 Dus = 288 Pcs (hitung manual)
Sesudah:  Admin pilih acuan "Pak", isi 1 Pak = 24 Pcs
          → Admin pilih acuan "Dus", isi 1 Dus = 12 Pak
          → Sistem hitung: 1 Dus = 12 × 24 = 288 Pcs (otomatis)
```

---

### Increment 2 — Pelunasan Hutang dari Kembalian Transaksi (dari Sprint 4 Review)

| Aspek | Detail |
|-------|--------|
| **Masukan** | Pelanggan yang memiliki hutang sering berbelanja kembali dan membayar tunai. Kembalian dari transaksi baru seharusnya bisa langsung digunakan untuk membayar hutang lama, tanpa harus ke menu pelunasan terpisah. |
| **Increment** | Ditambahkan opsi "Bayar Hutang Lama" pada halaman kasir. Saat diaktifkan dan transaksi menghasilkan kembalian, sistem otomatis mengalokasikan kembalian untuk membayar hutang aktif pelanggan (diurutkan dari yang tertua). Sisa kembalian yang tidak terpakai dikembalikan ke pelanggan. |
| **Sprint Terpengaruh** | Sprint 4 (penambahan fitur nomor 22) |
| **Estimasi Tambahan** | +1 hari |

**Contoh alur increment:**
```
Transaksi:  Total belanja Rp100.000, bayar Rp150.000
            Kembalian = Rp50.000
            Hutang lama pelanggan = Rp30.000

Hasil:      Rp30.000 → bayar hutang (status: lunas)
            Rp20.000 → dikembalikan ke pelanggan (tunai)
```

---

### Increment 3 — Edit & Hapus Pembelian dengan Jejak Audit (dari Sprint 2 Review)

| Aspek | Detail |
|-------|--------|
| **Masukan** | Admin sering salah input nota pembelian (harga atau jumlah barang salah). Tidak ada cara mengoreksi nota yang sudah tersimpan tanpa menghapus data dari database. |
| **Increment** | Ditambahkan dua aksi pada nota pembelian: (1) "Data Salah" — membuka form edit dengan mekanisme Revert & Re-apply menggunakan reverse average, dapat dilakukan Admin Sistem dan Admin Toko. (2) "Data Tidak Berguna" — menghapus nota secara permanen (hard delete) dengan konfirmasi ketik "HAPUS", hanya dapat dilakukan Admin Sistem. Setiap koreksi mencatat mutasi stok bertipe purchase_cancel dengan referensi EDIT-PO atau VOID-PO sebagai jejak audit. |
| **Sprint Terpengaruh** | Sprint 2 (penambahan fitur nomor 12) |
| **Estimasi Tambahan** | +2 hari |

---

### Increment 4 — Stock Opname dengan Lembar Kerja Offline (dari Sprint 5 Review)

| Aspek | Detail |
|-------|--------|
| **Masukan** | Proses stock opname langsung di sistem kurang praktis karena harus dilakukan di depan komputer. Toko perlu mencetak daftar produk terlebih dahulu, menghitung stok fisik secara offline di gudang, lalu menginput hasilnya ke sistem. |
| **Increment** | Ditambahkan alur stock opname dua jalur: (1) Via Lembar Kerja — Admin Toko mencetak daftar produk beserta stok sistem, mengisi kolom stok fisik secara manual di kertas, lalu Admin Sistem menginput hasilnya ke sistem. (2) Langsung dari Sistem — Admin Sistem memilih produk dan menginput stok fisik langsung melalui antarmuka tanpa lembar kerja. Keduanya menghasilkan mutasi adjustment yang tercatat di audit stok. |
| **Sprint Terpenguruh** | Sprint 5 (penyesuaian pada fitur nomor 27) |
| **Estimasi Tambahan** | +1 hari |

---

## Tabel 5: Ringkasan Estimasi Total

| Sprint | Fokus | Estimasi Dasar | Increment | Total |
|--------|-------|----------------|-----------|-------|
| Sprint 1 | Fondasi & Autentikasi | 10 hari | — | 10 hari |
| Sprint 2 | Produk & Pembelian | 10 hari | +3 hari (Inc. 1, 3) | 13 hari |
| Sprint 3 | Transaksi Penjualan | 10 hari | — | 10 hari |
| Sprint 4 | Piutang, Saldo & Retur | 10 hari | +1 hari (Inc. 2) | 11 hari |
| Sprint 5 | Inventori & Laporan | 9 hari | +1 hari (Inc. 4) | 10 hari |
| Sprint 6 | Penyempurnaan & Deploy | 9 hari | — | 9 hari |
| **Total** | | **58 hari** | **+5 hari** | **63 hari** |

> **Catatan:** Estimasi tambahan dari increment diserap ke dalam sprint yang bersangkutan dengan penyesuaian prioritas atau penambahan kapasitas tim.
