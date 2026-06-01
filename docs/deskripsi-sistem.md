# Deskripsi Sistem Terintegrasi Point of Sale (POS)

Dokumen ini menguraikan fungsionalitas dan fitur utama dari Sistem _Point of Sale_ (POS) yang telah dikembangkan. Sistem ini dirancang sebagai solusi arsitektur perangkat lunak yang komprehensif untuk mengelola siklus operasional bisnis ritel, mulai dari pengelolaan inventaris harian hingga pencatatan transaksi dan pelaporan keuangan. Deskripsi di bawah ini menggunakan pendekatan fungsional tingkat tinggi sesuai dengan standar penulisan akademis (skripsi).

## 1. Manajemen Akses dan Pengguna (User Management)

Sistem dilengkapi dengan modul manajemen pengguna yang mendukung arsitektur kontrol akses berbasis peran (_Role-Based Access Control_). Modul ini memungkinkan pengguna dengan peran **admin sistem** untuk melakukan registrasi akun baru, memperbarui kredensial, dan mencabut hak akses pengguna. Sistem memastikan bahwa setiap peran, baik **admin toko** maupun **admin sistem**, hanya dapat mengakses fungsi-fungsi yang telah diotorisasi sesuai dengan tanggung jawabnya.

## 2. Manajemen Basis Data Produk (Product Management)

Fitur ini berfungsi sebagai pusat penyimpanan informasi barang dagangan. Sistem mendukung manajemen varian produk (misalnya: perbedaan ukuran, warna, atau kemasan) dalam satu kesatuan data produk. Pengguna dengan peran **admin sistem** memiliki otoritas untuk menambah, mengubah harga jual, serta mengarsipkan data produk melalui mekanisme _soft delete_—yang menonaktifkan produk dari antarmuka kasir tanpa merusak riwayat transaksi historis yang berelasi dengan produk tersebut.

## 3. Manajemen Persediaan dan Stok (Stock Management & Adjustment)

Modul ini menjamin keakuratan data barang secara _real-time_. Terdapat fitur penyesuaian stok (_Stock Opname_) yang memfasilitasi rekonsiliasi antara jumlah stok fisik di gudang dengan catatan sistem. Setiap aktivitas yang memengaruhi kuantitas produk akan secara otomatis direkam ke dalam jurnal mutasi stok, memberikan visibilitas penuh terhadap riwayat keluar-masuk barang.

## 4. Manajemen Pengadaan dan Pembelian (Purchase Management)

Fitur ini memfasilitasi proses pengadaan barang dari pihak pemasok (_supplier_). Ketika transaksi pembelian dicatat, sistem tidak hanya memperbarui kuantitas stok terkait, melainkan juga secara dinamis melakukan kalkulasi ulang terhadap Harga Pokok Penjualan (HPP) menggunakan metode rata-rata tertimbang (_Weighted Average_). Sistem juga mendukung mekanisme revisi atau pembatalan nota pembelian yang secara otomatis akan melakukan perhitungan mundur (_rollback_) terhadap stok dan HPP.

## 5. Manajemen Transaksi Penjualan (Sales Management)

Ini merupakan modul inti sistem yang digunakan pada antarmuka kasir. Fitur ini dirancang untuk pemrosesan interaksi yang cepat, meliputi pencarian produk, penetapan pelanggan yang bertransaksi, serta validasi ketersediaan stok sebelum transaksi diselesaikan. Sistem mendukung berbagai kanal pembayaran, baik konvensional (Tunai) maupun digital melalui integrasi kode respons cepat (QRIS). Setiap penyelesaian transaksi akan otomatis memperbarui saldo pelanggan (jika ada), memotong persediaan stok, dan merumuskan entri data transaksi untuk keperluan pelaporan.

## 6. Manajemen Piutang Pelanggan (Debt Management)

Sistem mengakomodasi model bisnis ritel yang mengizinkan transaksi dengan pembayaran tertunda (piutang). Sisa pembayaran yang tidak terpenuhi pada saat transaksi penjualan akan secara otomatis dicatat sebagai beban piutang bagi pelanggan terkait. Sistem memfasilitasi pelunasan piutang melalui dua mekanisme: pelunasan secara mandiri maupun pelunasan berjenjang (parsial) dengan memanfaatkan sisa kompensasi kembalian dari transaksi pembelian pelanggan selanjutnya.

## 7. Manajemen Pengembalian Barang (Customer Return)

Sistem memfasilitasi alur kerja pengembalian barang (_retur_) yang didasarkan pada validasi nomor nota riwayat transaksi. Fitur ini membidangi dua aspek utama: kondisi fisik barang dan jenis kompensasi. Jika retur berupa barang layak jual, sistem akan mengembalikan barang ke siklus inventaris. Adapun bentuk kompensasi bagi pelanggan dapat diagendakan dalam bentuk pencairan dana tunai, penambahan saldo retensi pelanggan, atau penukaran secara langsung dengan produk substitusi.

## 8. Manajemen Biaya Operasional dan Kinerja Keuangan (Finance & Operations)

Sebagai bagian dari pelaporan manajerial, sistem menyediakan modul pencatatan untuk pengeluaran non-stok, seperti biaya operasional harian, gaji, maupun beban pajak. Sistem secara otomatis merangkum pendapatan kotor dari transaksi penjualan dan mengurangkannya dengan total HPP serta beban operasional untuk menghasilkan laporan ringkasan komprehensif terkait laba kotor dan laba bersih secara berkala.

## 9. Sistem Pengarsipan dan Daur Ulang Data (Trash / Recycle Bin)

Guna menjaga keseimbangan antara performa sistem dan keamanan data, perancangan sistem menyertakan fasilitas loker data sementara (_Recycle Bin_). Data yang diarsipkan tidak terhapus permanen sebelum melewati batas waktu otomatis (_auto-cleanup_). Pengguna dengan peran **admin sistem** memiliki opsi untuk meninjau, mengembalikan data (_restore_), atau memusnahkan data secara mandiri secara permanen ketika dirasa tidak lagi relevan.

## 10. Pusat Notifikasi Terpadu (Notification System)

Guna menjamin sirkulasi kelancaran informasi internal, antarmuka dibekali oleh panel notifikasi sistem yang akan memberikan peringatan real-time terhadap berbagai peringatan sistematis—seperti indikator stok yang menipis atau keberhasilan pemrosesan antrean sistem asinkron. Terdapat fasilitas visual pembeda antara notifikasi yang telah dibaca dan yang membutuhkan atensi tindak lanjut.
