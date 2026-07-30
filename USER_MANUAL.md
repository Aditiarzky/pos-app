# 📕 Buku Panduan Pengguna (User Manual)

## Sistem Point of Sale (POS) & Manajemen Toko Ritel

Selamat datang di Buku Panduan Pengguna **Sistem Point of Sale (POS) & Manajemen Toko**. Panduan ini dirancang untuk membantu staf operasional (**Admin Toko / Kasir**) dan pemilik/pengelola (**Admin Sistem**) dalam mengoperasikan aplikasi secara mandiri, cepat, dan akurat.

---

## 📑 Daftar Isi

1. [Memulai & Alur Akses (Login/Logout)](#1-memulai--alur-akses-loginlogout)
2. [Panduan Operasional Kasir (POS Penjualan)](#2-panduan-operasional-kasir-pos-penjualan)
3. [Panduan Pengadaan & Pembelian Supplier](#3-panduan-pengadaan--pembelian-supplier)
4. [Panduan Manajemen Retur & Tukar Barang](#4-panduan-manajemen-retur--tukar-barang)
5. [Panduan Manajemen Piutang Pelanggan](#5-panduan-manajemen-piutang-pelanggan)
6. [Panduan Manajemen Produk & Stok Opname](#6-panduan-manajemen-produk--stok-opname)
7. [Panduan Biaya Operasional & Pajak](#7-panduan-biaya-operasional--pajak)
8. [Panduan Laporan & Analytics Toko](#8-panduan-laporan--analytics-toko)
9. [Panduan Manajemen User & Pengaturan Toko](#9-panduan-manajemen-user--pengaturan-toko)
10. [Tanya Jawab & Solusi Masalah (FAQ)](#10-tanya-jawab--solusi-masalah-faq)

---

## 1. Memulai & Alur Akses (Login/Logout)

### A. Peran Pengguna (User Roles)

Sistem memiliki 2 jenis peran dengan tingkat akses berbeda:

- **Admin Toko (Kasir / Staf)**: Berfokus pada transaksi harian kasir, pencatatan pembelian supplier, retur konsumen, piutang, dan stok opname.
- **Admin Sistem (Manager / Owner)**: Memiliki hak penuh atas seluruh fitur Admin Toko ditambah pengelolaan pengguna, pengaturan biaya operasional, konfigurasi pajak, cetak struk toko, dan analisis laporan keuangan.

### B. Cara Login Ke Aplikasi

1. Buka browser (Google Chrome / Edge) dan akses alamat web aplikasi POS toko Anda.
2. Masukkan **Email** dan **Password** yang telah didaftarkan.
3. Klik tombol **Login**. Jika berhasil, Anda akan diarahkan ke halaman Dashboard Utama atau Kasir POS.

### C. Lupa Password / Reset Password

1. Pada halaman login, klik **Lupa Password?**.
2. Masukkan email akun Anda dan kirimkan permintaan reset password.
3. **Admin Sistem** akan menerima notifikasi dan menyetujui permintaan reset password Anda di menu _Manajemen Pengguna_.

---

## 2. Panduan Operasional Kasir (POS Penjualan)

Menu Kasir adalah pusat transaksi harian toko untuk melayani pembeli secara cepat.

### A. Langkah Transaksi Penjualan Baru

1. Akses menu **Sales / Kasir** di bilah navigasi sebelah kiri.
2. **Menambahkan Produk Ke Keranjang**:
   - **Gunakan Barcode Scanner**: Arahkan pemindai barcode ke kode barang. Barang akan otomatis masuk ke keranjang.
   - **Cari Manual**: Ketik nama atau SKU produk pada kolom pencarian produk.
3. **Mengatur Jumlah (Qty) & Varian Satuan**:
   - Tentukan varian satuan yang dibeli (misal: _Dus_, _Pack_, atau _Pcs_).
   - Ubah jumlah barang menggunakan tombol `+` / `-` atau mengetik angka langsung.
4. **Memilih Pelanggan (Opsional)**:
   - Jika transaksi dari pelanggan terdaftar, pilih nama pelanggan dari dropdown.
   - Jika pelanggan memiliki **Saldo Kredit** (dari kompensasi retur sebelumnya), sistem akan otomatis menampilkan opsi untuk menggunakannya sebagai potongan pembayaran.

### B. Memproses Pembayaran

#### 1. Pembayaran Tunai (Cash)

1. Pilih metode pembayaran **Tunai**.
2. Masukkan nominal uang yang diterima dari pembeli (atau klik tombol cepat nominal seperti Rp50.000 / Rp100.000).
3. Sistem akan secara otomatis menghitung **Kembalian**.
4. Klik **Selesaikan Transaksi**.

#### 2. Pembayaran QRIS (Digital)

1. Pilih metode pembayaran **QRIS**.
2. Sistem akan menampilkan kode QRIS beserta batas waktu pembayaran.
3. Pembeli memindai QR Code menggunakan aplikasi e-wallet / m-banking (Gopay, OVO, Dana, ShopeePay, BCA, dll).
4. Setelah verifikasi berhasil, sistem otomatis menyelesaikan transaksi.

### C. Cetak Struk Penjualan

- Setelah transaksi selesai, pop-up _Struk Pembayaran_ akan muncul.
- Klik **Cetak Struk** untuk mencetak nota melalui printer thermal toko.

---

## 3. Panduan Pengadaan & Pembelian Supplier

Menu Pembelian digunakan ketika toko membeli stok barang baru dari supplier/distributor.

### A. Mencatat Pembelian Baru (Purchase Order)

1. Buka menu **Purchases / Pembelian** > Klik **+ Pembelian Baru**.
2. Pilih **Supplier / Pemasok** dari daftar.
3. Tambahkan barang yang dibeli: pilih produk, varian satuan, kuantitas yang dibeli, dan harga beli per unit.
4. Periksa total tagihan pembelian.
5. Klik **Simpan Pembelian**.
6. **Dampak Otomatis**: Stok barang di gudang otomatis bertambah pada satuan terkecil (_Base Unit_), dan nilai HPP (_Weighted Average Cost_) produk akan diperbarui secara otomatis.

### B. Merevisi / Mengedit Nota Pembelian

1. Buka riwayat nota pembelian di menu **Purchases**.
2. Klik tombol **Edit** pada nota yang ingin diubah.
3. Sesuaikan kuantitas atau harga barang.
4. Simpan perubahan. Sistem secara otomatis melakukan kalkulasi ulang HPP dan stok tanpa merusak data historis (_Revert & Re-apply_).

---

## 4. Panduan Manajemen Retur & Tukar Barang

Modul Retur menangani pengembalian barang dari pembeli yang rusak, salah pilih, atau ingin ditukar.

### A. Proses Retur Penjualan Konsumen

1. Buka menu **Returns / Retur Konsumen** > Klik **+ Buat Retur**.
2. Masukkan **Nomor Nota Penjualan** (Invoice) transaksi pembeli.
3. Pilih produk & kuantitas yang dikembalikan oleh konsumen.
4. Tentukan **Kondisi Stok**:
   - _Kembalikan ke Stok_: Jika barang masih bagus dan layak dijual kembali.
   - _Afkir/Rusak_: Jika barang rusak dan tidak dikembalikan ke persediaan.
5. Pilih **Bentuk Kompensasi**:
   - **Refund Tunai**: Mengembalikan uang cash langsung ke pembeli.
   - **Saldo Kredit Pelanggan**: Menyimpan nilai retur sebagai saldo deposit pelanggan untuk belanja berikutnya.
   - **Tukar Barang (Exchange)**: Memilih barang pengganti secara langsung di toko.

---

## 5. Panduan Manajemen Piutang Pelanggan

Modul ini mencatat transaksi pelanggan yang belum membayar lunas pada saat transaksi di kasir.

### A. Melihat Daftar Piutang

1. Akses menu **Debts / Piutang**.
2. Anda dapat melihat daftar nama pelanggan, sisa piutang, status (_Belum Lunas / Partial / Lunas_), dan tanggal jatuh tempo.

### B. Memproses Pelunasan Piutang

1. Klik nama pelanggan atau tombol **Bayar** pada daftar piutang.
2. Masukkan nominal uang pelunasan yang diterima.
3. Tambahkan catatan/keterangan jika diperlukan.
4. Klik **Simpan Pembayaran**. Status piutang akan otomatis ter-update.

### C. Pelunasan Otomatis Lewat Kembalian Kasir

Saat pelanggan yang memiliki piutang bertransaksi di kasir:

- Jika ada sisa uang kembalian pada transaksi baru, kasir dapat mengalokasikan kembalian tersebut secara langsung untuk memotong saldo piutang lama pelanggan.

---

## 6. Panduan Manajemen Produk & Stok Opname

### A. Menambah Produk Baru

1. Buka menu **Products / Produk** > Klik **+ Tambah Produk**.
2. Masukkan **Nama Produk**, **Kategori**, dan **Satuan Dasar (Base Unit)** (misal: _Pcs_ atau _Gram_).
3. Atur **Stok Minimal** untuk peringatan stok menipis.
4. Tambahkan **Varian Satuan** (misal: Varian _Dus_ = 24 Pcs dengan Harga Jual Rp120.000).
5. Tambahkan **Barcode** jika ada.
6. Simpan data produk.

### B. Stok Opname (Penyesuaian Stok Fisik)

1. Buka menu **Stock / Penyesuaian Stok**.
2. Cari produk yang ingin disesuaikan stok fisiknya di gudang.
3. Masukkan jumlah stok hasil perhitungan fisik riil.
4. Masukkan alasan penyesuaian (misal: _Barang Hilang_, _Selisih Opname_, _Barang Rusak_).
5. Simpan. Jurnal mutasi stok akan mencatat perubahan secara permanen.

---

## 7. Panduan Biaya Operasional & Pajak _(Khusus Admin Sistem)_

### A. Pencatatan Biaya Operasional Toko

1. Buka menu **Operational Costs / Biaya Operasional**.
2. Klik **+ Tambah Biaya**.
3. Masukkan nama pengeluaran (misal: _Gaji Karyawan_, _Listrik PLN_, _Sewa Ruko_, _Bensin Deliveries_).
4. Tentukan nominal dan **Periode** (Harian, Mingguan, Bulanan, Tahunan, atau One-Time).
5. Masukkan tanggal mulai berlaku.
6. Sistem akan secara otomatis menghitung proporsi biaya ini pada Laporan Laba Rugi bulanan/harian.

### B. Pengaturan Pajak Toko

1. Buka menu **Taxes / Konfigurasi Pajak**.
2. Anda dapat menambahkan pajak seperti **PPh Final UMKM (0.5% Omset)** atau **Pajak Laba Bersih**.
3. Sistem secara otomatis menghitung potongan pajak pada Laporan Keuangan.

---

## 8. Panduan Laporan & Analytics Toko

### A. Jenis-Jenis Laporan

Akses menu **Reports / Laporan** untuk melihat analisis kinerja toko:

- **Laporan Penjualan**: Grafik omset, jumlah transaksi, dan produk terlaris.
- **Laporan Stok**: Sisa persediaan, nilai total persediaan barang (berdasarkan HPP), dan daftar produk stok menipis.
- **Laporan Laba Rugi (P&L) & Pajak**: Ringkasan Pendapatan Kotor, HPP (Modal Terjual), Laba Kotor, Total Biaya Operasional, EBT, Pajak Omset/Laba, dan **Laba Bersih Akhir**.

---

## 9. Panduan Manajemen User & Pengaturan Toko

### A. Kelola Akun Staf (Kasir)

1. Buka menu **Users / Pengguna**.
2. Klik **+ Tambah Pengguna Baru**.
3. Masukkan Nama, Email, Password, dan tentukan Role (_Admin Toko_ atau _Admin Sistem_).

> ⚠️ **Catatan Penting Pengamanan Data**:
> Penghapusan akun pengguna atau produk yang sudah pernah terlibat dalam transaksi historis (Penjualan/Pembelian) akan ditolak oleh sistem (_Relation-Aware Guard_) demi menjaga keabsahan laporan keuangan audit.

### B. Pengaturan Profil Struk Toko

1. Buka menu **Settings / Pengaturan Toko**.
2. Sesuaikan Nama Toko, Alamat, No. Telp, Logo Toko, serta Pesan Footer Struk.
3. Klik **Simpan Pengaturan**.

---

## 10. Tanya Jawab & Solusi Masalah (FAQ)

#### Q1: Mengapa produk tidak bisa dihapus dari sistem?

> **Jawab**: Untuk mencegah kerusakan laporan keuangan historis, sistem melarang penghapusan (_hard delete_) produk yang pernah dijual atau dibeli. Jika produk tidak dijual lagi, cukup non-aktifkan opsi **Aktif (is_active)** pada form produk.

#### Q2: Bagaimana jika scanner barcode fisik tidak terbaca?

> **Jawab**: Pastikan kabel USB scanner terhubung dengan baik ke komputer kasir. Posisikan kursor pada kolom pencarian produk kasir sebelum memindai barang.

#### Q3: Bagaimana jika koneksi internet terputus saat transaksi QRIS?

> **Jawab**: Pembayaran QRIS membutuhkan koneksi internet untuk verifikasi real-time. Jika jaringan terganggu, kasir dapat mengalihkan pembayaran ke metode **Tunai (Cash)**.

---

_Buku Panduan Pengguna ini dapat dicetak atau disimpan sebagai acuan operasional standar (SOP) toko._
