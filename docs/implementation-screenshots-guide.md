# Hasil Implementasi Antarmuka — Sistem POS Gunung Muria Grosir

---

## 1. Halaman Login

[gambar halaman login]

Halaman login merupakan pintu masuk utama sistem yang menampilkan formulir autentikasi dengan dua kolom input: email dan kata sandi. Halaman ini dilengkapi dengan latar belakang visual dan logo toko. Setelah pengguna menekan tombol "Masuk", sistem memvalidasi kredensial dan menyimpan token sesi. Jika validasi gagal, pesan error ditampilkan di bawah formulir.

---

## 2. Beranda (Dashboard)

### 2.1 Kartu KPI (Admin Sistem)

[gambar dashboard kartu KPI admin sistem]

Empat kartu indikator utama yang hanya tampil untuk Admin Sistem, menampilkan: Pendapatan bulan ini, Laba Kotor bulan ini, Total Transaksi bulan ini, dan Total Piutang Aktif. Setiap kartu dilengkapi dengan indikator persentase pertumbuhan (*growth*) dibandingkan bulan sebelumnya, ditandai dengan panah hijau (naik) atau merah (turun).

### 2.2 Kartu Operasional

[gambar dashboard kartu operasional]

Empat kartu ringkasan operasional yang tampil untuk semua role, menampilkan: Transaksi Bulan Ini, Produk Stok Kritis, Piutang Aktif, dan Alert Operasional. Setiap kartu memiliki tombol "Buka detail" yang mengarahkan ke halaman terkait.

### 2.3 Grafik Tren Pendapatan 30 Hari

[gambar dashboard grafik tren pendapatan]

Grafik area interaktif yang hanya tampil untuk Admin Sistem, menampilkan tren pendapatan harian selama 30 hari terakhir. Sumbu X menunjukkan tanggal dan sumbu Y menunjukkan nilai pendapatan dalam Rupiah.

### 2.4 Business Alerts

[gambar dashboard business alerts]

Panel peringatan bisnis yang dibagi menjadi dua kolom: (1) **Stok di bawah minimum** — menampilkan daftar produk yang stoknya berada di bawah batas minimum, disertai gambar produk dan badge perbandingan stok sisa vs batas minimum. (2) **Daftar Piutang Belum Lunas** — menampilkan daftar pelanggan dengan hutang aktif beserta umur hutang (dalam hari), nomor invoice, dan sisa tagihan. Kedua bagian menyediakan tombol "Lihat selengkapnya" yang mengarahkan ke halaman terkait.

---

## 3. Master Data (Admin Sistem)

### 3.1 Kartu Ringkasan

[gambar halaman master data kartu ringkasan]

Dua kartu ringkasan menampilkan jumlah Total Kategori dan Total Satuan yang terdaftar di sistem.

### 3.2 Tabel Kategori

[gambar halaman master data tabel kategori]

Bagian CRUD untuk mengelola kategori produk. Menampilkan tabel dengan kolom Nama, Tanggal Dibuat, dan menu aksi (titik tiga) yang berisi opsi Edit dan Hapus. Di atas tabel terdapat kolom pencarian dan tombol "Tambah Kategori". Saat menambah atau mengedit, muncul dialog modal dengan satu kolom input Nama.

### 3.3 Tabel Satuan

[gambar halaman master data tabel satuan]

Bagian CRUD untuk mengelola satuan produk (Dus, Pak, Pcs, dll.). Strukturnya identik dengan tabel kategori — menampilkan kolom Nama, Tanggal Dibuat, dan menu aksi Edit/Hapus. Dilengkapi kolom pencarian dan tombol "Tambah Satuan".

---

## 4. Produk & Stok

### 4.1 Kartu Ringkasan Produk

[gambar halaman produk kartu ringkasan]

Empat kartu yang menampilkan: Total Produk (jumlah produk terdaftar), Total Stok (total stok dalam satuan terkecil), Stok Rendah (jumlah produk yang di bawah batas minimum / total produk), dan Aktivitas Stok (jumlah mutasi stok hari ini).

### 4.2 Tab Daftar Produk

[gambar halaman produk tab daftar produk]

Menampilkan seluruh produk dalam bentuk kartu (*card*) yang masing-masing berisi gambar produk, nama, SKU, kategori, harga jual, stok per varian, dan harga pokok rata-rata. Di atas daftar terdapat kolom pencarian dan filter berdasarkan kategori, status aktif, dan kondisi stok (stok rendah, normal, semua). Admin Sistem dapat menekan tombol "Tambah Produk" untuk membuka modal tambah produk, serta tombol aksi pada setiap kartu untuk mengedit atau menghapus.

### 4.3 Tab Mutasi Stok (Admin Sistem)

[gambar halaman produk tab mutasi stok]

Menampilkan riwayat seluruh pergerakan stok dalam bentuk tabel. Setiap baris mencatat tanggal, produk/varian, tipe mutasi (pembelian, penjualan, retur, penyesuaian, dll.), jumlah perubahan dalam satuan dasar, dan nomor referensi. Tersedia filter berdasarkan rentang tanggal, tipe mutasi, dan pencarian produk.

### 4.4 Modal Tambah/Edit Produk

[gambar modal tambah edit produk tab informasi dasar]
[gambar modal tambah edit produk tab varian dan satuan]
[gambar modal tambah edit produk tab barcode]

Modal formulir produk terbagi menjadi tiga tab: (1) **Informasi Dasar** — berisi kolom Nama, SKU, Kategori (dropdown), Satuan Dasar (dropdown), Stok Minimum, dan Gambar Produk. (2) **Varian & Satuan** — menampilkan daftar satuan yang dapat ditambah/dihapus, setiap satuan memiliki kolom Nama, Harga Jual, dan Faktor Konversi ke satuan dasar. Tersedia tombol referensi satuan sebelumnya untuk mempermudah pengisian konversi. (3) **Barcode** — daftar barcode produk yang dapat ditambah manual.

### 4.5 Modal Penyesuaian Stok

[gambar modal penyesuaian stok]

Modal yang muncul saat Admin Sistem menekan tombol "Sesuaikan Stok" pada kartu produk. Menampilkan daftar varian produk beserta stok sistem saat ini, kolom input untuk memasukkan stok fisik, dan kolom catatan. Selisih antara stok fisik dan stok sistem dihitung secara otomatis.

### 4.6 Lembar Kerja Stock Opname

[gambar lembar kerja stock opname]

Tabel cetak yang berisi daftar seluruh produk beserta varian dan stok sistem saat ini. Kolom "Stok Fisik" dan "Catatan" dikosongkan untuk diisi secara manual oleh Admin Toko di atas kertas. Setelah diisi, Admin Sistem menginput hasilnya kembali melalui Modal Penyesuaian Stok.

---

## 5. Pembelian

### 5.1 Kartu Ringkasan Pembelian (Admin Sistem)

[gambar halaman pembelian kartu ringkasan]

Empat kartu yang menampilkan: Total Pembelian bulan ini (dengan persentase perubahan vs bulan lalu), Transaksi Baru hari ini, Supplier Terlibat (jumlah supplier aktif yang bertransaksi), dan Item Dibeli (kuantitas barang masuk hari ini).

### 5.2 Tab Riwayat Pembelian

[gambar halaman pembelian tab riwayat pembelian]

Menampilkan daftar nota pembelian dalam bentuk tabel dengan kolom: Nomor Nota, Tanggal, Supplier, Pengguna yang mencatat, Total Nilai, Jumlah Item, dan menu aksi. Tersedia kolom pencarian berdasarkan nomor nota atau nama supplier, serta filter berdasarkan rentang tanggal dan pengurutan (terbaru/terlama). Setiap baris memiliki tombol "Lihat Detail" yang membuka ringkasan nota, serta opsi "Data Salah" (edit) dan "Data Tidak Berguna" (hapus) sesuai hak akses.

### 5.3 Tab Daftar Supplier

[gambar halaman pembelian tab daftar supplier]

Menampilkan daftar supplier dalam bentuk tabel atau kartu dengan kolom: Nama Supplier, Telepon, Email, Alamat, dan menu aksi Edit/Hapus. Tersedia kolom pencarian dan tombol "Tambah Supplier".

### 5.4 Formulir Catat Pembelian

[gambar formulir catat pembelian]

Formulir lengkap yang muncul di dalam halaman (bukan modal) untuk mencatat nota pembelian baru. Terdiri dari: kolom Supplier (dropdown pencarian), kolom input item pembelian dimana setiap baris berisi Produk/Varian (dropdown pencarian), Satuan, Jumlah, Harga Beli per unit — subtotal dihitung otomatis. Total keseluruhan nota ditampilkan di bagian bawah. Tombol "Simpan" menyimpan nota dan otomatis menambah stok serta memperbarui harga pokok rata-rata.

### 5.5 Modal Supplier

[gambar modal tambah edit supplier]

Dialog modal untuk menambah atau mengedit data supplier dengan kolom: Nama, Telepon, Email, Alamat, dan Deskripsi/Catatan.

---

## 6. Kasir & Penjualan

### 6.1 Kartu Ringkasan Penjualan (Tab Riwayat)

[gambar halaman kasir kartu ringkasan]

Empat kartu yang tampil saat berada di tab Riwayat, menampilkan: Penjualan hari ini, Laba Kotor hari ini, Piutang hari ini, dan Aktivitas (jumlah transaksi hari ini). Setiap kartu dilengkapi indikator pertumbuhan dibandingkan hari sebelumnya.

### 6.2 Tab Menu Kasir — Mode Penjualan

[gambar halaman kasir mode penjualan]

Halaman utama kasir dengan dua panel: (1) **Panel Kiri — Pencarian & Keranjang**: kolom pencarian produk (nama, SKU, atau barcode) yang dilengkapi tombol pemindai barcode kamera, daftar produk yang ditampilkan sebagai kartu kecil untuk dipilih, dan keranjang belanja yang menampilkan item terpilih dengan kolom kuantitas dan subtotal per item. (2) **Panel Kanan — Ringkasan & Pembayaran**: menampilkan ringkasan transaksi (subtotal, pajak, total), pilihan pelanggan (dropdown), metode pembayaran (Tunai / QRIS), kolom jumlah bayar, perhitungan kembalian otomatis, dan opsi "Bayar Hutang Lama" yang mengalokasikan kembalian untuk melunasi hutang pelanggan. Tombol "Proses Transaksi" menyimpan data penjualan.

### 6.3 Tab Menu Kasir — Mode Retur

[gambar halaman kasir mode retur]

Halaman retur dengan kolom pencarian nomor invoice untuk menemukan transaksi penjualan yang akan diretur. Setelah ditemukan, ditampilkan daftar item transaksi dan admin dapat memilih item mana saja yang akan diretur beserta jumlah dan alasannya. Tersedia pilihan tipe kompensasi: Pengembalian Tunai (*refund*), Penambahan Saldo Pelanggan (*credit_note*), atau Tukar Barang (*exchange*). Jika opsi tukar barang dipilih, muncul panel tambahan untuk memilih barang pengganti.

### 6.4 Tab Riwayat — Daftar Penjualan & Piutang

[gambar halaman kasir tab riwayat penjualan]

Menampilkan dua bagian secara bertumpuk: (1) **Daftar Piutang** — menampilkan kartu/tabel hutang aktif pelanggan yang dapat disaring berdasarkan status (aktif, belum bayar, dibayar sebagian) dan ID pelanggan. Setiap kartu menampilkan nama pelanggan, sisa hutang, nomor invoice, dan tombol "Bayar" yang membuka dialog pembayaran. (2) **Daftar Penjualan** — menampilkan riwayat seluruh transaksi penjualan dalam tampilan tabel atau kartu (dapat diganti via toggle). Tersedia kolom pencarian nomor invoice (dilengkapi pemindai barcode), filter berdasarkan rentang tanggal, status, dan pelanggan. Setiap baris menampilkan nomor invoice, tanggal, pelanggan, total, status, dan tombol detail/struk.

### 6.5 Tab Retur — Daftar Retur

[gambar halaman kasir tab retur]

Menampilkan riwayat seluruh retur pelanggan dalam bentuk tabel. Tersedia filter berdasarkan rentang tanggal dan tipe kompensasi. Setiap baris menampilkan nomor retur, tanggal, nomor invoice asal, pelanggan, total pengembalian, dan tipe kompensasi. Tersedia tombol detail untuk melihat rincian item yang diretur, serta tombol "Batalkan" (void) untuk membatalkan retur yang sudah tercatat.

### 6.6 Dialog Pembayaran Hutang

[gambar dialog pembayaran hutang]

Dialog modal yang muncul saat admin menekan tombol "Bayar" pada daftar piutang. Menampilkan informasi hutang (jumlah awal, sisa, dan riwayat cicilan sebelumnya), kolom input jumlah pembayaran, dan catatan opsional. Setelah disimpan, sistem mengurangi sisa hutang dan mencatat pembayaran. Jika sisa hutang menjadi nol, status otomatis berubah menjadi "Lunas".

### 6.7 Modal Sukses Transaksi & Struk

[gambar modal sukses transaksi penjualan]
[gambar struk penjualan]

Setelah transaksi berhasil diproses, muncul modal konfirmasi sukses yang menampilkan ringkasan singkat (total, kembalian) dan tombol "Cetak Struk". Struk yang dicetak berisi: nama toko, nomor invoice, tanggal, daftar item, subtotal, pajak, total, pembayaran, kembalian, dan nama kasir.

### 6.8 Modal Sukses Retur & Bukti Retur

[gambar modal sukses retur]
[gambar bukti retur]

Setelah retur berhasil diproses, muncul modal konfirmasi dengan ringkasan retur (total pengembalian, tipe kompensasi). Bukti retur yang dapat dicetak berisi: nomor retur, tanggal, nomor invoice asal, daftar item yang diretur, jumlah, alasan, dan tipe kompensasi.

### 6.9 Modal Peringatan Stok

[gambar modal peringatan stok]

Modal yang muncul setelah transaksi jika ada produk yang stoknya turun di bawah batas minimum. Menampilkan daftar produk yang perlu di-restock beserta stok saat ini dan batas minimum.

### 6.10 Filter Lanjutan

[gambar filter lanjutan riwayat penjualan]

Panel filter yang dapat dibuka dari ikon filter di samping kolom pencarian. Untuk riwayat penjualan berisi: rentang tanggal mulai dan sampai, status transaksi (semua, selesai, hutang, menunggu pembayaran), dan filter pelanggan. Untuk piutang berisi: filter status (aktif, belum bayar, dibayar sebagian) dan filter pelanggan.

---

## 7. Pelanggan

### 7.1 Kartu Ringkasan Pelanggan

[gambar halaman pelanggan kartu ringkasan]

Empat kartu yang menampilkan: Total Pelanggan (pelanggan aktif terdaftar), Total Piutang (hutang pelanggan yang belum lunas), Saldo Simpanan (total saldo mengendap pelanggan), dan Pelanggan Baru (terdaftar hari ini).

### 7.2 Daftar Pelanggan

[gambar halaman pelanggan daftar pelanggan]

Menampilkan daftar pelanggan dalam bentuk tabel atau kartu. Tersedia kolom pencarian berdasarkan nama atau telepon. Setiap baris menampilkan nama, telepon, alamat, saldo kredit (positif = deposit, negatif = hutang), dan menu aksi Edit/Hapus. Klik pada salah satu pelanggan membuka panel detail yang menampilkan riwayat mutasi saldo pelanggan.

### 7.3 Detail Pelanggan & Mutasi Saldo

[gambar halaman pelanggan detail dan mutasi saldo]

Panel detail pelanggan yang menampilkan informasi lengkap: nama, telepon, alamat, saldo saat ini, dan riwayat mutasi saldo dalam bentuk tabel. Setiap baris mutasi mencatat tanggal, tipe perubahan (penambahan/pengurangan), jumlah, saldo sebelum, saldo setelah, dan referensi transaksi.

### 7.4 Modal Tambah/Edit Pelanggan

[gambar modal tambah edit pelanggan]

Dialog modal untuk menambah atau mengedit data pelanggan dengan kolom: Nama, Telepon, Alamat, dan Saldo Awal (untuk pelanggan baru).

---

## 8. Biaya & Pajak (Admin Sistem)

### 8.1 Kartu Ringkasan Biaya

[gambar halaman biaya dan pajak kartu ringkasan]

Empat kartu yang menampilkan: Biaya Ops Aktif (jumlah konfigurasi aktif dan yang berakhir dalam 30 hari), Estimasi Biaya/Bulan (total estimasi bulanan beserta kategori teratas), Pajak Aktif (jumlah konfigurasi pajak beserta rincian persentase dan tetap), dan Pajak Tetap/Bulan (estimasi pajak nominal tetap bulanan).

### 8.2 Tab Biaya Operasional

[gambar halaman biaya tab biaya operasional]

Menampilkan daftar biaya operasional dalam bentuk kartu/tabel. Tersedia panel panduan yang menjelaskan contoh biaya (listrik, gaji karyawan, sewa ruko, ongkos bensin). Setiap item menampilkan nama, kategori (utilitas, gaji, sewa, logistik, pemasaran, perawatan, lainnya), jumlah, periode (harian, mingguan, bulanan, tahunan, sekali), tanggal berlaku, dan status aktif. Tombol "Tambah Biaya" membuka formulir biaya.

### 8.3 Tab Pajak

[gambar halaman biaya tab pajak]

Menampilkan daftar konfigurasi pajak. Tersedia panel panduan yang menjelaskan dua jenis pajak: Persentase (%) dan Nominal Tetap (Rp). Setiap item menampilkan nama, jenis, tarif/nominal, dasar pengenaan (pendapatan atau laba kotor), periode, dan status aktif.

### 8.4 Formulir Biaya Operasional

[gambar formulir biaya operasional]

Formulir untuk menambah atau mengedit biaya operasional dengan kolom: Nama, Kategori (dropdown), Jumlah, Periode (dropdown), Tanggal Berlaku Mulai, Tanggal Berlaku Sampai (opsional), Catatan, dan Status Aktif (toggle).

### 8.5 Formulir Pajak

[gambar formulir pajak]

Formulir untuk menambah atau mengedit konfigurasi pajak dengan kolom: Nama, Jenis (Persentase / Nominal Tetap), Tarif (%) atau Nominal (Rp) — tampil sesuai jenis yang dipilih, Dikenakan pada (Pendapatan / Laba Kotor), Periode, Tanggal Berlaku Mulai, Tanggal Berlaku Sampai (opsional), Catatan, dan Status Aktif.

---

## 9. Laporan (Admin Sistem)

### 9.1 Filter Rentang Waktu

[gambar halaman laporan filter waktu]

Bar filter di bagian atas yang menyediakan pilihan cepat: Hari Ini, Kemarin, 7 Hari, 30 Hari, Bulan Ini, Bulan Lalu, Tahun Ini, dan Kustom. Opsi Kustom menampilkan dua kolom input tanggal (Mulai dan Sampai) dalam popover kalender.

### 9.2 Tab Ikhtisar Performa

[gambar halaman laporan tab ikhtisar performa]

Menampilkan ringkasan keuangan utama dalam kartu: Total Pendapatan, Laba Kotor, Jumlah Transaksi, dan Rata-rata Nilai Transaksi — semuanya dalam periode yang dipilih. Di bawahnya terdapat grafik tren harian perbandingan pendapatan dan pembelian.

### 9.3 Tab Analisis Penjualan

[gambar halaman laporan tab analisis penjualan]

Menampilkan detail penjualan dalam periode terpilih: tabel harian pendapatan penjualan, grafik tren harian, daftar produk terlaris (berdasarkan kuantitas dan pendapatan), serta daftar kategori terlaris.

### 9.4 Tab Analisis Pembelian

[gambar halaman laporan tab analisis pembelian]

Menampilkan detail pembelian dalam periode terpilih: tabel harian total pembelian dan jumlah transaksi, serta grafik tren pembelian harian.

### 9.5 Tab Laporan Laba Rugi

[gambar halaman laporan tab laporan laba rugi]

Menampilkan perhitungan laba rugi satu langkah (*single-step*): Pendapatan (total penjualan), dikurangi Harga Pokok Penjualan (HPP), menghasilkan Laba Kotor, dikurangi Biaya Operasional (rincian per item), dikurangi Pajak (rincian per item), menghasilkan **Laba Bersih**. Tabel rincian biaya dan pajak ditampilkan di bawah untuk transparansi perhitungan.

### 9.6 Cetak Laporan

[gambar hasil cetak laporan]

Tombol "Cetak" di sudut kanan atas menghasilkan dokumen PDF format A4 portrait yang berisi seluruh data laporan dalam format cetak yang rapi, termasuk header toko, periode laporan, ringkasan keuangan, grafik harian, dan rincian laba rugi.

---

## 10. Notifikasi

### 10.1 Header & Kontrol

[gambar halaman notifikasi header]

Header halaman menampilkan badge jumlah total notifikasi dan jumlah yang belum dibaca. Tersedia tombol "Tandai Semua Dibaca" yang menandai seluruh notifikasi sebagai sudah dibaca, dan "Bersihkan Riwayat" yang menghapus notifikasi yang sudah dibaca dari daftar.

### 10.2 Filter & Pengurutan

[gambar halaman notifikasi filter dan pengurutan]

Baris filter menyediakan tombol kategori: Semua, Belum Dibaca, Stok, Keuangan, Pembayaran, dan Tempat Sampah (khusus Admin Sistem). Di sampingnya terdapat toggle pengurutan: Terkini (berdasarkan waktu) atau Prioritas (berdasarkan tingkat kepentingan).

### 10.3 Daftar Notifikasi

[gambar halaman notifikasi daftar notifikasi]

Notifikasi ditampilkan dalam bentuk kartu yang dikelompokkan berdasarkan tanggal (Hari ini, Kemarin, nama hari, atau tanggal lengkap). Setiap kartu menampilkan ikon kategori, badge kategori (Stok/Keuangan/Pembayaran), badge keparahan (Kritis/Peringatan/Info), pesan notifikasi, waktu pembuatan, dan tombol aksi yang mengarahkan ke halaman terkait. Notifikasi yang belum dibaca ditandai dengan border kiri berwarna dan latar yang sedikit berbeda.

---

## 11. User & Akses (Admin Sistem)

### 11.1 Kartu Ringkasan User

[gambar halaman user kartu ringkasan]

Tiga kartu yang menampilkan: Total User (pengguna aktif terdaftar), Admin Toko (jumlah operator operasional), dan Admin Sistem (jumlah pengguna dengan akses kontrol penuh).

### 11.2 Daftar User

[gambar halaman user daftar user]

Menampilkan daftar pengguna dalam bentuk tabel dengan kolom: Nama, Email, Role (badge), Status (aktif/nonaktif), Tanggal Dibuat, dan menu aksi Edit/Hapus. Tersedia kolom pencarian dan filter berdasarkan role dan status. Tombol "Tambah User" di header membuka modal formulir pengguna.

### 11.3 Modal Tambah/Edit User

[gambar modal tambah edit user]

Dialog modal dengan kolom: Nama, Email, Kata Sandi (hanya saat tambah baru), Role (dropdown: Admin Toko / Admin Sistem), dan Status Aktif (toggle). Untuk mode edit, kolom kata sandi tidak ditampilkan kecuali ingin mereset.

---

## 12. Pengaturan

### 12.1 Kartu Pengaturan Akun

[gambar halaman pengaturan kartu akun]

Formulir pengaturan akun pengguna yang sedang login. Menampilkan informasi profil: Nama, Email (tidak dapat diubah), dan opsi untuk mengubah kata sandi (kata sandi lama, kata sandi baru, konfirmasi kata sandi baru).

### 12.2 Kartu Pengaturan Toko (Admin Sistem)

[gambar halaman pengaturan kartu toko]

Formulir pengaturan informasi toko yang hanya tampil untuk Admin Sistem. Berisi kolom: Nama Toko, Alamat, dan Nomor Telepon. Data ini digunakan sebagai informasi header pada struk transaksi dan laporan cetak.
