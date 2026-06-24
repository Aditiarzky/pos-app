# Hasil Pengujian Blackbox POS App

Dokumen ini berisi skenario pengujian Blackbox untuk Sistem Point of Sales (POS) Gunung Muria Grosir. Setiap skenario ditulis dari sudut pandang pengguna (penguji) berdasarkan fitur yang benar-benar ada di sistem.

---

## 4.2.1 Modul Pengelolaan Produk

Modul ini digunakan untuk mengelola data barang, varian, satuan, dan kategori produk.

| No | Fitur | Langkah Pengujian | Hasil yang Diharapkan | Hasil |
|:--:|-------|-------------------|----------------------|:-----:|
| CP-01 | Tambah Produk | 1. Buka halaman Produk. 2. Klik tombol "Tambah Produk". 3. Isi nama produk, pilih kategori, pilih satuan dasar. 4. Tambahkan varian dan barcode jika perlu. 5. Klik "Simpan". | Produk baru berhasil ditambahkan dan muncul di daftar produk. | |
| CP-02 | Edit Produk | 1. Klik ikon edit pada produk yang sudah ada. 2. Ubah nama, harga jual, kategori, atau varian produk. 3. Klik "Simpan". | Perubahan data berhasil disimpan dan langsung terlihat di daftar produk. | |
| CP-03 | Hapus Produk | 1. Klik ikon hapus pada produk. 2. Ketik "HAPUS" pada kolom konfirmasi. 3. Klik konfirmasi. | Produk beserta seluruh varian dan barcode-nya terhapus permanen dari sistem. Hanya Admin Sistem yang dapat melakukan aksi ini. | |
| CP-04 | Tambah Varian Produk | 1. Buka halaman detail produk. 2. Klik tab "Varian". 3. Isi nama varian (misal: "Dus 24 pcs"), nilai konversi, harga beli, dan harga jual. 4. Klik "Simpan". | Varian baru berhasil ditambahkan dan tersedia saat transaksi pembelian maupun penjualan. | |
| CP-05 | Kelola Barcode Produk | 1. Buka halaman detail produk. 2. Klik tab "Barcodes". 3. Tambah, ubah, atau hapus barcode. 4. Klik "Simpan". | Barcode berhasil disimpan dan dapat digunakan untuk mencari produk di halaman produk maupun kasir. | |
| CP-06 | Pencarian Produk | 1. Ketik nama produk pada kolom pencarian di halaman produk. | Daftar produk langsung terfilter sesuai kata kunci yang diketik. | |
| CP-07 | Filter Kategori | 1. Pilih salah satu kategori pada dropdown filter di halaman produk. | Daftar produk hanya menampilkan produk yang sesuai dengan kategori yang dipilih. | |
| CP-08 | Scan Barcode untuk Cari Produk | 1. Buka halaman Produk. 2. Klik ikon scanner. 3. Arahkan kamera ke barcode produk. | Produk langsung ditemukan dan ditampilkan berdasarkan barcode yang dipindai. | |
| CP-09 | Notifikasi Stok Rendah | 1. Pastikan stok suatu produk berada di bawah batas minimum yang diatur. 2. Buka panel notifikasi di pojok kanan atas. | Muncul notifikasi peringatan stok rendah beserta nama produk dan jumlah stok saat ini. | |

---

## 4.2.2 Modul Pengelolaan Pembelian

Modul ini digunakan untuk mencatat stok masuk dari supplier. Harga pokok penjualan (HPP) dihitung otomatis menggunakan metode rata-rata tertimbang (Weighted Average Cost).

| No | Fitur | Langkah Pengujian | Hasil yang Diharapkan | Hasil |
|:--:|-------|-------------------|----------------------|:-----:|
| PB-01 | Buat Pembelian Baru | 1. Buka halaman Pembelian. 2. Klik "Buat Pembelian". 3. Pilih supplier. 4. Tambahkan item: pilih produk/varian, isi jumlah dan harga beli. 5. Klik "Simpan". | Stok produk bertambah. Harga pokok produk dihitung ulang otomatis. Total biaya tercatat pada nota. | |
| PB-02 | Validasi Varian Ganda | 1. Saat membuat pembelian, coba tambahkan varian yang sama dua kali. | Sistem menolak dan menampilkan pesan error. Satu varian hanya boleh muncul satu kali per nota. | |
| PB-03 | Edit Pembelian (Data Salah) | 1. Buka riwayat pembelian. 2. Klik "Data Salah" pada nota. 3. Ubah jumlah atau harga beli item. 4. Klik "Simpan". | Sistem membatalkan efek nota lama, lalu menerapkan data baru. Stok dan harga pokok terhitung ulang dengan benar. | |
| PB-04 | Hapus Pembelian (Data Tidak Berguna) | 1. Buka form edit pembelian. 2. Klik "Data Tidak Berguna". 3. Ketik "HAPUS" dan konfirmasi. | Efek pembelian terhadap stok dan harga pokok dibatalkan. Nota pembelian terhapus permanen. | |
| PB-05 | Tambah Supplier | 1. Buka tab Supplier di halaman Pembelian. 2. Isi nama dan nomor telepon supplier baru. 3. Klik "Simpan". | Supplier baru berhasil ditambahkan dan muncul di pilihan saat membuat pembelian. | |
| PB-06 | Edit & Hapus Supplier | 1. Klik edit pada supplier, ubah nama, simpan. 2. Klik hapus pada supplier yang tidak dipakai. | Data supplier berhasil diperbarui atau dihapus tanpa error. | |
| PB-07 | Lihat Riwayat Pembelian | 1. Buka tab Riwayat di halaman Pembelian. 2. Klik salah satu nota. | Detail nota ditampilkan: nomor nota, supplier, daftar item, dan total biaya. | |
| PB-08 | Filter Riwayat Pembelian | 1. Pilih rentang tanggal. 2. Filter berdasarkan supplier. | Daftar nota hanya menampilkan data sesuai filter yang dipilih. | |

---

## 4.2.3 Modul Penyelarasan Stok

Modul ini digunakan untuk menyesuaikan stok fisik (nyata) dengan stok yang tercatat di sistem, biasa disebut Stock Opname.

| No | Fitur | Langkah Pengujian | Hasil yang Diharapkan | Hasil |
|:--:|-------|-------------------|----------------------|:-----:|
| ST-01 | Penyesuaian Stok (Stock Opname) | 1. Buka halaman Produk. 2. Klik ikon penyesuaian stok pada produk tertentu. 3. Masukkan jumlah stok fisik yang sebenarnya. 4. Isi alasan penyesuaian. 5. Klik "Simpan". | Sistem menghitung selisih antara stok fisik dan stok sistem. Stok diperbarui ke nilai sebenarnya. Riwayat penyesuaian tercatat. | |
| ST-02 | Cetak Lembar Stock Opname | 1. Buka halaman Produk. 2. Klik tombol "Cetak Opname". | Lembar kerja tercetak berisi daftar produk, varian, satuan, stok sistem, dan kolom kosong untuk diisi stok fisik secara manual. | |
| ST-03 | Lihat Riwayat Mutasi Stok | 1. Buka halaman Produk. 2. Klik tab "Mutasi Stok". | Seluruh riwayat perubahan stok ditampilkan: pembelian, penjualan, penyesuaian, retur, dan pembatalan beserta tanggal dan keterangannya. | |

---

## 4.2.4 Modul Pengelolaan Kasir

Modul ini merupakan modul inti untuk melakukan transaksi penjualan harian kepada pelanggan.

| No | Fitur | Langkah Pengujian | Hasil yang Diharapkan | Hasil |
|:--:|-------|-------------------|----------------------|:-----:|
| KR-01 | Transaksi Penjualan Tunai | 1. Buka halaman Kasir. 2. Cari dan tambahkan produk ke keranjang. 3. Atur jumlah jika perlu. 4. Pilih metode bayar "Tunai". 5. Masukkan nominal uang diterima. 6. Klik "Proses Pembayaran". | Total harga terhitung otomatis. Kembalian dihitung benar. Transaksi berhasil dan tercatat. Stok produk berkurang. | |
| KR-02 | Scan Barcode di Kasir | 1. Di halaman Kasir, klik ikon scanner. 2. Arahkan kamera ke barcode produk. | Produk langsung ditemukan dan ditambahkan ke keranjang dengan jumlah 1. | |
| KR-03 | Transaksi Pembayaran QRIS | 1. Tambahkan produk ke keranjang. 2. Pilih metode bayar "QRIS". 3. Klik "Proses Pembayaran". 4. QR code tampil di layar. 5. Lakukan simulasi pembayaran berhasil. | QR code tampil dengan waktu kedaluwarsa. Setelah pembayaran dikonfirmasi, transaksi selesai otomatis. | |
| KR-04 | Pembatalan Transaksi QRIS | 1. Buat transaksi QRIS. 2. Sebelum bayar, klik "Batalkan". | Transaksi dibatalkan. Stok produk dikembalikan seperti semula. | |
| KR-05 | Transaksi Piutang | 1. Tambahkan produk ke keranjang. 2. Pilih pelanggan terdaftar. 3. Aktifkan opsi "Piutang". 4. Proses pembayaran. | Transaksi tercatat sebagai piutang. Hutang pelanggan bertambah. Stok tetap berkurang. | |
| KR-06 | Bayar Hutang dari Kembalian | 1. Lakukan penjualan tunai untuk pelanggan yang punya hutang. 2. Centang "Bayar Hutang Lama". 3. Proses pembayaran. | Kembalian otomatis digunakan untuk melunasi hutang tertua pelanggan. Sisa kembalian diberikan ke pelanggan. | |
| KR-07 | Gunakan Saldo Kredit Pelanggan | 1. Pilih pelanggan yang punya saldo kredit. 2. Aktifkan opsi penggunaan saldo. 3. Proses transaksi. | Saldo kredit pelanggan berkurang. Jumlah yang harus dibayar berkurang sebesar saldo yang digunakan. | |
| KR-08 | Cetak Struk | 1. Setelah transaksi selesai, klik "Cetak Struk". | Struk tercetak lengkap: nama toko, tanggal, nomor nota, daftar barang, total, dan metode bayar. | |
| KR-09 | Lihat Riwayat Penjualan | 1. Buka tab "Riwayat Penjualan" di halaman Kasir. 2. Klik salah satu transaksi. | Detail transaksi ditampilkan: nomor nota, pelanggan, daftar barang, total, metode bayar, dan status. | |
| KR-10 | Notifikasi QRIS Belum Dibayar | 1. Buat transaksi QRIS. 2. Jangan lakukan pembayaran. 3. Buka panel notifikasi. | Muncul notifikasi bahwa ada pembayaran QRIS yang masih menunggu. | |

---

## 4.2.5 Modul Pemrosesan Retur

Modul ini menangani pengembalian barang dari pelanggan dengan tiga jenis kompensasi: pengembalian uang tunai, penambahan saldo kredit, atau penukaran barang.

| No | Fitur | Langkah Pengujian | Hasil yang Diharapkan | Hasil |
|:--:|-------|-------------------|----------------------|:-----:|
| RT-01 | Retur dengan Pengembalian Uang | 1. Buka riwayat penjualan, cari transaksi yang sudah selesai. 2. Klik "Retur". 3. Pilih barang dan jumlah yang dikembalikan. 4. Tandai apakah barang layak stok atau rusak. 5. Pilih kompensasi "Refund". 6. Konfirmasi. | Retur tercatat. Jika barang layak stok, stok bertambah. Kasir memberikan pengembalian uang tunai. | |
| RT-02 | Tukar Barang | 1. Pilih transaksi, klik "Retur". 2. Pilih barang yang dikembalikan. 3. Tandai kondisi barang. 4. Pilih kompensasi "Exchange". 5. Pilih barang pengganti dan jumlahnya. 6. Konfirmasi. | Stok barang lama bertambah, stok pengganti berkurang. Selisih harga dihitung otomatis. | |
| RT-03 | Penanganan Selisih Tukar Barang | 1. Lakukan tukar barang dengan selisih harga. 2. Pilih cara penanganan: tunai atau saldo kredit. | Jika tunai: kasir kembalikan uang selisih. Jika saldo kredit: selisih masuk ke saldo kredit pelanggan. | |
| RT-04 | Retur dengan Saldo Kredit | 1. Pilih transaksi, klik "Retur". 2. Pilih barang yang dikembalikan. 3. Pilih kompensasi "Credit Note". 4. Konfirmasi. | Saldo kredit pelanggan bertambah sesuai nilai retur. Saldo bisa dipakai di transaksi berikutnya. | |
| RT-05 | Lihat Riwayat Retur | 1. Buka tab "Riwayat Retur" di halaman Kasir. 2. Filter berdasarkan tanggal atau jenis kompensasi. | Daftar retur ditampilkan lengkap: nomor retur, nota asal, pelanggan, barang, dan jenis kompensasi. | |

---

## 4.2.6 Modul Pembayaran Piutang

Modul ini digunakan untuk mengelola dan menerima pembayaran piutang dari pelanggan.

| No | Fitur | Langkah Pengujian | Hasil yang Diharapkan | Hasil |
|:--:|-------|-------------------|----------------------|:-----:|
| UT-01 | Lihat Daftar Piutang | 1. Buka halaman Kasir, tab "Riwayat Penjualan". 2. Lihat bagian daftar piutang. | Daftar piutang ditampilkan: tanggal, jumlah awal, sisa hutang, dan status (Belum Lunas / Nyicil). | |
| UT-02 | Lihat Detail Hutang Pelanggan | 1. Buka halaman Pelanggan. 2. Pilih pelanggan yang punya hutang. 3. Klik "Lihat Detail Hutang". | Diarahkan ke riwayat penjualan khusus pelanggan tersebut untuk melihat detail transaksi hutang. | |
| UT-03 | Pembayaran Piutang | 1. Di daftar piutang, klik "Bayar" pada piutang tertentu. 2. Masukkan nominal pembayaran. 3. Konfirmasi. | Pembayaran tercatat. Sisa hutang berkurang. Jika lunas → status "Lunas". Jika belum → status "Nyicil". | |
| UT-04 | Validasi Pembayaran | 1. Coba bayar piutang yang sudah lunas. 2. Coba bayar dengan nominal melebihi sisa hutang. | Sistem menolak dan menampilkan pesan error yang sesuai. | |
| UT-05 | Filter Piutang | 1. Gunakan filter status: "Aktif", "Belum Lunas", atau "Nyicil". | Daftar piutang terfilter sesuai status yang dipilih. | |
| UT-06 | Filter Pelanggan | 1. Gunakan filter pelanggan untuk melihat piutang per pelanggan. | Daftar piutang hanya menampilkan data pelanggan yang dipilih. | |
| UT-07 | Notifikasi Piutang Jatuh Tempo | 1. Biarkan piutang tanpa pembayaran lebih dari 7 hari. 2. Buka panel notifikasi. | Muncul notifikasi peringatan piutang jatuh tempo beserta nama pelanggan dan sisa hutang. | |

---

## 4.2.7 Modul Pengelolaan Laporan

Modul ini menyediakan laporan keuangan dan performa bisnis yang terbagi dalam 4 bagian: Ikhtisar, Penjualan, Pembelian, dan Laba Rugi.

| No | Fitur | Langkah Pengujian | Hasil yang Diharapkan | Hasil |
|:--:|-------|-------------------|----------------------|:-----:|
| LP-01 | Ikhtisar Performa | 1. Buka halaman Laporan. 2. Pilih rentang tanggal. 3. Buka tab "Ikhtisar Performa". | Menampilkan kartu ringkasan: total penjualan, total pembelian, laba kotor, jumlah transaksi, dan grafik tren pendapatan vs pengeluaran. | |
| LP-02 | Analisis Penjualan | 1. Buka tab "Analisis Penjualan". 2. Pilih rentang tanggal. | Menampilkan statistik omset, grafik tren penjualan harian, daftar 10 produk terlaris (tabel + grafik batang), dan grafik pie kontribusi produk. | |
| LP-03 | Analisis Pembelian | 1. Buka tab "Analisis Pembelian". 2. Pilih rentang tanggal. | Menampilkan total pengeluaran pembelian dan grafik tren pembelian harian sesuai periode yang dipilih. | |
| LP-04 | Laporan Laba Rugi | 1. Buka tab "Laporan Laba Rugi". 2. Pilih rentang tanggal. | Menampilkan: Laba Kotor (Penjualan − HPP), Beban (Biaya Operasional + Pajak), dan Laba/Rugi Bersih. Data akurat sesuai periode. | |
| LP-05 | Cetak Laporan | 1. Klik tombol "Cetak" di halaman Laporan. | Laporan tercetak dalam format A4 yang rapi, berisi seluruh bagian laporan beserta nama toko dan periode. | |

---

## 4.2.8 Modul Pengelolaan Pengguna

Modul ini digunakan untuk mengatur akun pengguna beserta hak aksesnya. Terdapat dua level akses: Admin Sistem (akses penuh) dan Admin Toko (akses terbatas).

| No | Fitur | Langkah Pengujian | Hasil yang Diharapkan | Hasil |
|:--:|-------|-------------------|----------------------|:-----:|
| PG-01 | Tambah Pengguna | 1. Login sebagai Admin Sistem. 2. Buka halaman Pengguna. 3. Klik "Tambah Pengguna". 4. Isi nama, email, password, nomor telepon, dan pilih role. 5. Klik "Simpan". | Akun baru berhasil dibuat dan muncul di daftar. Pengguna baru dapat langsung login. | |
| PG-02 | Edit Pengguna | 1. Klik edit pada pengguna. 2. Ubah nama, email, atau role. 3. Klik "Simpan". | Data pengguna berhasil diperbarui. Perubahan role langsung berlaku. | |
| PG-03 | Hapus Pengguna | 1. Klik hapus pada pengguna. 2. Konfirmasi penghapusan. | Akun pengguna terhapus permanen dari sistem. | |
| PG-04 | Reset Password | 1. Pengguna mengajukan permintaan reset password. 2. Admin buka tab "Permintaan Reset Password". 3. Admin menyetujui permintaan. | Password pengguna direset ke default. Pengguna dapat login dengan password baru. | |
| PG-05 | Pembatasan Akses | 1. Login sebagai Admin Toko. 2. Coba buka halaman yang hanya untuk Admin Sistem (misal: halaman Pengguna). | Sistem menampilkan "Akses Ditolak". Admin Toko tidak dapat membuka halaman atau melakukan aksi yang dibatasi. | |
| PG-06 | Pengaturan Toko | 1. Login sebagai admin. 2. Buka halaman Pengaturan. 3. Ubah nama toko, alamat, telepon, dan pesan footer struk. 4. Klik "Simpan". | Pengaturan tersimpan. Nama toko dan pesan footer baru langsung muncul pada struk transaksi berikutnya. | |
