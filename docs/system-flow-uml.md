# Dokumentasi Alur Sistem POS untuk Dasar UML

## 1. Tujuan Dokumen

Dokumen ini disusun sebagai dasar untuk membuat:

- Use Case Diagram
- Activity Diagram
- Sequence Diagram
- Class Diagram

Fokus pembahasan ada pada fitur utama:

- Produk
- Pembelian / Kulakan
- Transaksi Penjualan
- Retur Customer
- Stok
- Notifikasi
- Trash / soft delete

Dokumen ini ditulis dengan bahasa sederhana dan mengikuti alur sistem yang ada di aplikasi.

---

## 2. Actor dan Role

### 2.1 Daftar Aktor

#### 1. Admin Toko

Peran utama operasional harian toko.

Hak akses utama:

- Melihat dashboard
- Mengelola produk
- Melakukan transaksi penjualan
- Melakukan retur customer
- Melihat riwayat penjualan dan retur
- Mengelola piutang pelanggan
- Melihat notifikasi stok, pembayaran, dan piutang
- Mengatur sebagian pengaturan toko

Catatan:

- Di sistem ini tidak ada role terpisah bernama `Kasir`.
- Fungsi kasir dijalankan oleh user dengan role `admin toko`.

#### 2. Admin Sistem

Peran pengelola sistem dan data tingkat lanjut.

Hak akses utama:

- Semua hak `admin toko`
- Mengelola trash / tempat sampah
- Restore data dari trash
- Hapus permanen data
- Menjalankan cleanup trash
- Mengatur interval cleanup trash
- Mengelola user dan akses
- Mengelola master data
- Mengakses laporan, biaya operasional, dan pajak
- Melihat semua kategori notifikasi

#### 3. Sistem

Sistem bertindak sebagai aktor otomatis untuk proses internal.

Tugas utama:

- Validasi data input
- Menghitung total transaksi
- Mengurangi dan menambah stok
- Mencatat mutasi stok
- Membuat nomor invoice dan nomor retur
- Mencatat hutang dan mutasi saldo pelanggan
- Membuat notifikasi stok rendah, restock, piutang, QRIS, dan trash
- Menjalankan auto cleanup trash berdasarkan interval

#### 4. Database

Database bukan aktor bisnis utama, tetapi penting pada sequence diagram karena menyimpan seluruh data transaksi dan perubahan status.

---

## 3. Use Case List

### 3.1 Use Case Utama per Aktor

#### Admin Toko

- Kelola produk
- Kelola pembelian
- Lihat daftar produk
- Tambah produk
- Ubah produk
- Nonaktifkan produk
- Catat pembelian
- Ubah pembelian
- Batalkan pembelian
- Penyesuaian stok
- Lihat mutasi stok
- Buat transaksi penjualan
- Cari produk saat transaksi
- Gunakan saldo pelanggan
- Catat hutang pelanggan
- Bayar hutang lama dari kembalian
- Proses pembayaran QRIS
- Lihat riwayat penjualan
- Lihat detail penjualan
- Batalkan penjualan
- Buat retur customer
- Pilih tipe kompensasi retur
- Batalkan retur
- Lihat notifikasi
- Tandai notifikasi sudah dibaca

#### Admin Sistem

- Semua use case Admin Toko
- Lihat trash
- Restore data dari trash
- Hapus permanen data
- Jalankan cleanup trash
- Atur interval cleanup trash

#### Sistem

- Validasi stok
- Hitung HPP / average cost
- Hitung total transaksi
- Update stok produk
- Simpan mutasi stok
- Buat notifikasi
- Auto cleanup trash

### 3.2 Relasi Antar Use Case

- `Catat pembelian` meng-include `Update stok produk`
- `Catat pembelian` meng-include `Simpan mutasi stok`
- `Catat pembelian` meng-include `Hitung HPP / average cost`
- `Buat transaksi penjualan` meng-include `Cari produk`
- `Buat transaksi penjualan` meng-include `Validasi stok`
- `Buat transaksi penjualan` meng-include `Update stok produk`
- `Buat transaksi penjualan` meng-include `Simpan mutasi stok`
- `Buat transaksi penjualan` dapat extend ke `Catat hutang pelanggan`
- `Buat transaksi penjualan` dapat extend ke `Gunakan saldo pelanggan`
- `Buat transaksi penjualan` dapat extend ke `Proses pembayaran QRIS`
- `Buat retur customer` meng-include `Validasi invoice asli`
- `Buat retur customer` meng-include `Update stok produk`
- `Buat retur customer` meng-include `Simpan mutasi stok`
- `Buat retur customer` dapat extend ke `Tambah saldo pelanggan`
- `Batalkan penjualan` meng-include `Batalkan retur terkait` bila retur sudah pernah dibuat
- `Lihat trash` dapat extend ke `Restore data`
- `Lihat trash` dapat extend ke `Hapus permanen`
- `Lihat trash` dapat extend ke `Cleanup trash`
- `Lihat notifikasi` meng-include `Generate notifikasi oleh sistem`

---

## 4. Alur Proses (Activity Flow)

## 4.1 Fitur Produk

### A. Tambah Produk

Tujuan:
Menambahkan produk baru beserta barcode dan varian.

Alur:

1. Admin membuka form tambah produk.
2. Admin mengisi data utama produk.
3. Admin memilih kategori dan satuan dasar.
4. Admin dapat menambahkan barcode.
5. Admin dapat menambahkan beberapa varian produk.
6. Frontend mengirim data ke backend.
7. Backend memvalidasi data.
8. Sistem membuat data produk terlebih dahulu.
9. Sistem membentuk SKU produk utama.
10. Sistem menyimpan barcode jika ada.
11. Sistem menyimpan varian jika ada.
12. Sistem mengembalikan hasil sukses ke frontend.

Kondisi:

- Jika barcode kosong, produk tetap bisa disimpan.
- Jika varian kosong, produk tetap bisa dibuat, tetapi proses penjualan bisa terganggu karena produk idealnya punya varian.

Kemungkinan error:

- Data form tidak valid
- Kategori tidak valid
- Barcode duplikat
- SKU/barcode sudah dipakai

### B. Ubah Produk

Tujuan:
Memperbarui data produk, barcode, dan varian.

Alur:

1. Admin membuka detail/edit produk.
2. Sistem mengambil data produk aktif.
3. Admin mengubah informasi produk.
4. Admin dapat menghapus, menambah, atau mengubah varian.
5. Frontend mengirim data baru ke backend.
6. Backend memvalidasi data.
7. Sistem memperbarui data produk utama.
8. Sistem memperbarui barcode.
9. Sistem membandingkan varian lama dan varian baru.
10. Varian yang tidak dipakai lagi akan dinonaktifkan.
11. Varian yang masih dipakai akan diperbarui.
12. Varian baru akan ditambahkan.

Kondisi:

- Jika varian lama tidak dikirim lagi saat update, varian tersebut dianggap nonaktif.
- Stok tidak diubah melalui edit produk biasa.

Kemungkinan error:

- Produk tidak ditemukan
- Produk sudah nonaktif
- Kategori tidak ditemukan
- Data varian tidak valid

### C. Hapus Produk (Soft Delete)

Tujuan:
Memindahkan produk ke trash tanpa langsung menghapus permanen.

Alur:

1. Admin memilih hapus produk.
2. Frontend mengirim permintaan hapus.
3. Backend mencari produk berdasarkan ID.
4. Jika ditemukan, sistem mengubah status produk menjadi nonaktif.
5. Sistem mengisi `deletedAt`.
6. Produk tidak lagi tampil di daftar aktif.
7. Produk masuk ke trash.

Kondisi:

- Produk belum benar-benar dihapus dari database.

Kemungkinan error:

- Produk tidak ditemukan

---

## 4.2 Fitur Pembelian / Kulakan

### A. Catat Pembelian

Tujuan:
Mencatat barang masuk dari supplier dan menambah stok produk.

Alur:

1. Admin membuka menu pembelian.
2. Admin memilih supplier.
3. Admin memilih produk dan varian yang dibeli.
4. Admin mengisi qty dan harga beli.
5. Frontend mengirim data ke backend.
6. Backend memvalidasi data pembelian.
7. Sistem memeriksa apakah ada varian yang sama diinput lebih dari sekali.
8. Sistem membuat header purchase sementara.
9. Untuk setiap item, sistem mengambil data produk dan varian.
10. Sistem menghitung qty dalam base unit.
11. Sistem menghitung harga beli per base unit.
12. Sistem menghitung subtotal item.
13. Sistem menghitung stok baru.
14. Sistem menghitung average cost baru dengan metode rata-rata tertimbang.
15. Sistem memperbarui `stock`, `averageCost`, dan `lastPurchaseCost`.
16. Sistem menyimpan purchase item.
17. Sistem mencatat mutasi stok tipe `purchase`.
18. Setelah semua item selesai, sistem menghitung grand total.
19. Sistem membuat nomor purchase order final.
20. Frontend menampilkan pembelian berhasil.

Kondisi:

- Satu varian tidak boleh muncul dua kali dalam satu transaksi pembelian.
- Pembelian langsung memengaruhi stok dan harga pokok rata-rata produk.

Kemungkinan error:

- Item varian duplikat
- Produk atau varian tidak ditemukan
- Data input tidak valid

### B. Ubah Pembelian

Tujuan:
Memperbarui data pembelian yang sudah tercatat.

Alur:

1. Admin memilih data pembelian yang ingin diubah.
2. Sistem mengambil purchase lama dan item-item lama.
3. Sistem melakukan rollback item lama terlebih dahulu.
4. Untuk tiap item lama, sistem mengurangi stok produk.
5. Sistem menghitung average cost sementara dengan reverse weighted average.
6. Sistem menghapus purchase item lama.
7. Sistem menghapus mutasi stok lama.
8. Sistem memproses item baru seperti pembelian baru.
9. Sistem menghitung total pembelian yang baru.
10. Sistem memperbarui header purchase.

Kondisi:

- Purchase yang sudah diarsipkan tidak bisa diubah.
- Update pembelian menggunakan pola `revert lalu apply ulang`.

Kemungkinan error:

- Purchase tidak ditemukan
- Purchase sudah diarsipkan
- Ada varian duplikat pada input baru
- Produk atau varian tidak ditemukan

### C. Batalkan Pembelian

Tujuan:
Membatalkan pembelian yang sudah tercatat.

Alur:

1. Admin memilih data pembelian.
2. Frontend mengirim permintaan hapus / arsip.
3. Sistem mengambil purchase order dan item pembelian.
4. Untuk tiap item, sistem mengurangi stok produk.
5. Sistem menghitung ulang average cost dengan reverse weighted average.
6. Sistem mencatat mutasi stok tipe `purchase_cancel`.
7. Purchase diarsipkan dan dipindah ke trash.

Kondisi:

- Pembatalan pembelian tidak langsung menghapus permanen data.
- Stok dan average cost dikembalikan ke kondisi sebelum pembelian.

Kemungkinan error:

- ID purchase tidak valid
- Purchase tidak ditemukan
- Purchase sudah diarsipkan

---

## 4.3 Fitur Transaksi Penjualan

### A. Buat Transaksi Penjualan Tunai

Tujuan:
Mencatat penjualan normal dengan pembayaran tunai.

Alur:

1. Admin membuka menu kasir.
2. Admin memilih produk dan varian.
3. Admin mengisi jumlah item.
4. Sistem mengecek apakah item yang sama terduplikasi.
5. Sistem menghitung subtotal tiap item.
6. Sistem mengecek stok setiap item.
7. Jika stok cukup, sistem mengurangi stok produk.
8. Sistem menyimpan detail item penjualan.
9. Sistem mencatat mutasi stok tipe `sale`.
10. Sistem menghitung grand total.
11. Jika ada saldo pelanggan yang dipakai, sistem mengurangi saldo pelanggan.
12. Sistem menghitung nilai yang harus dibayar.
13. Sistem membandingkan total bayar dengan total transaksi.
14. Jika bayar cukup, sistem menghitung kembalian.
15. Sistem menyimpan header penjualan.
16. Sistem membuat nomor invoice final.
17. Frontend menampilkan hasil transaksi sukses.

Kondisi:

- Jika ada saldo pelanggan dipakai, transaksi harus terkait customer.
- Jika kembalian ada dan opsi bayar hutang lama aktif, sistem bisa memakai sisa uang untuk membayar hutang customer.

Kemungkinan error:

- Item duplikat
- Produk atau varian tidak ditemukan
- Stok tidak mencukupi
- Customer tidak ditemukan
- Saldo pelanggan tidak cukup
- Pembayaran kurang dan transaksi bukan hutang

### B. Buat Transaksi Hutang

Tujuan:
Mencatat transaksi penjualan yang belum dibayar penuh.

Alur:

1. Admin membuat transaksi seperti biasa.
2. Sistem menghitung total bersih transaksi.
3. Sistem membandingkan jumlah bayar dengan total.
4. Jika pembayaran kurang dan mode hutang aktif, sistem membuat data hutang.
5. Sistem menyimpan sisa hutang sebagai `remainingAmount`.
6. Status penjualan menjadi `debt`.
7. Transaksi selesai disimpan.

Kondisi:

- Hutang hanya boleh untuk customer terdaftar.
- Jika tidak ada customer, transaksi hutang ditolak.

Kemungkinan error:

- Customer belum dipilih
- Pembayaran kurang tetapi mode hutang tidak aktif

### C. Buat Transaksi QRIS

Tujuan:
Mencatat transaksi penjualan dengan pembayaran QRIS.

Alur:

1. Admin memilih metode pembayaran QRIS.
2. Sistem memvalidasi bahwa transaksi QRIS tidak boleh dicatat sebagai hutang.
3. Sistem memvalidasi nominal pembayaran minimum.
4. Sistem tetap membuat transaksi penjualan dan mengurangi stok lebih dulu.
5. Status awal transaksi menjadi `pending_payment`.
6. Sistem menyimpan data penjualan.
7. Sistem mengirim permintaan pembuatan QRIS ke layanan pembayaran.
8. Jika berhasil, sistem menyimpan nomor pembayaran dan waktu kedaluwarsa.
9. Frontend menampilkan data QRIS ke user.

Kondisi:

- Minimal nominal QRIS adalah Rp500.
- Jika QRIS berhasil dibuat, transaksi tetap menunggu pembayaran.

Kemungkinan error:

- Nominal di bawah minimum
- Gagal membuat QRIS di layanan pembayaran

Catatan penting:

- Jika pembuatan QRIS gagal, sistem membatalkan transaksi, mengarsipkan sale, dan mengembalikan stok.

### D. Batalkan Penjualan

Tujuan:
Membatalkan penjualan yang sudah tercatat.

Alur:

1. Admin memilih data penjualan.
2. Frontend mengirim permintaan batal.
3. Backend mengambil data sale beserta item dan retur terkait.
4. Sistem memeriksa apakah sale sudah pernah dibatalkan.
5. Sistem mengembalikan stok semua item sale.
6. Sistem mencatat mutasi stok tipe `sale_cancel`.
7. Jika transaksi memakai saldo pelanggan, saldo dikembalikan.
8. Jika ada hutang aktif, hutang dinonaktifkan dan diubah menjadi `cancelled`.
9. Jika ada retur yang masih aktif, sistem membatalkan retur tersebut terlebih dahulu.
10. Status sale diubah menjadi `cancelled`.
11. Sale dipindah ke trash.

Kondisi:

- Jika sale punya retur aktif, void retur dilakukan lebih dulu agar data tetap konsisten.

Kemungkinan error:

- ID sale tidak valid
- Penjualan tidak ditemukan
- Penjualan sudah dibatalkan

---

## 4.4 Fitur Retur Customer

### A. Buat Retur dengan Refund

Tujuan:
Mengembalikan barang dan mengembalikan uang ke customer.

Alur:

1. Admin memilih invoice penjualan asal.
2. Sistem mengambil data sale dan item sale.
3. Admin memilih item yang diretur.
4. Sistem memeriksa apakah item memang ada di invoice asli.
5. Sistem menghitung berapa jumlah item yang sudah pernah diretur sebelumnya.
6. Sistem memeriksa apakah qty retur masih diperbolehkan.
7. Jika barang dikembalikan ke stok, sistem menambah stok.
8. Sistem mencatat mutasi stok tipe `return_restock`.
9. Sistem menghitung nilai retur berdasarkan harga saat penjualan lama.
10. Sistem membuat data retur.
11. Frontend menampilkan pesan bahwa uang tunai harus dikembalikan ke customer.

Kondisi:

- Refund tidak otomatis mengubah saldo pelanggan.
- Nilai refund mengikuti harga saat transaksi asli, bukan harga sekarang.

Kemungkinan error:

- Invoice tidak ditemukan
- Penjualan sudah diarsipkan
- Item bukan bagian dari invoice
- Qty retur melebihi sisa yang boleh diretur

### B. Buat Retur dengan Credit Note

Tujuan:
Mengembalikan nilai barang ke saldo pelanggan.

Alur:

1. Admin memilih sale asal.
2. Admin memilih item retur.
3. Sistem menghitung total nilai retur.
4. Sistem memeriksa bahwa customer terdaftar tersedia.
5. Sistem menambahkan nilai retur ke `creditBalance` customer.
6. Sistem mencatat mutasi saldo pelanggan.
7. Sistem menyimpan header retur dan item retur.
8. Jika item dikembalikan ke stok, stok ditambah dan mutasi stok dicatat.

Kondisi:

- Credit note hanya boleh untuk customer terdaftar.

Kemungkinan error:

- Customer tidak ada
- Data customer tidak ditemukan

### C. Buat Retur dengan Exchange

Tujuan:
Menukar barang lama dengan barang baru.

Alur:

1. Admin memilih invoice asli.
2. Admin memilih barang yang dikembalikan.
3. Admin memilih barang pengganti.
4. Sistem memvalidasi item retur dari invoice asli.
5. Sistem memvalidasi stok barang pengganti.
6. Jika item retur masuk kembali ke gudang, sistem menambah stok.
7. Sistem mengurangi stok barang pengganti.
8. Sistem mencatat mutasi `return_restock` untuk barang masuk.
9. Sistem mencatat mutasi `exchange` untuk barang keluar.
10. Sistem menghitung nilai barang diretur berdasarkan harga lama.
11. Sistem menghitung nilai barang pengganti berdasarkan harga sekarang.
12. Sistem menghitung selisih:
13. Jika selisih positif, customer berhak menerima sisa.
14. Jika selisih nol, transaksi impas.
15. Jika selisih negatif, customer harus membayar kekurangan.
16. Jika selisih positif dan strategi surplus adalah saldo pelanggan, sistem menambah saldo customer.
17. Sistem menyimpan data retur dan item exchange.

Kondisi:

- Exchange wajib memiliki barang pengganti.
- Strategi surplus hanya relevan jika nilai retur lebih besar daripada nilai barang pengganti.

Kemungkinan error:

- Barang pengganti kosong saat tipe exchange
- Barang pengganti tidak ditemukan
- Stok barang pengganti tidak cukup
- Exchange item dikirim padahal tipe kompensasi bukan exchange
- Customer tidak ada saat surplus ingin dimasukkan ke saldo

### D. Batalkan Retur

Tujuan:
Membatalkan transaksi retur yang sudah tercatat.

Alur:

1. Admin memilih retur.
2. Frontend mengirim permintaan batal.
3. Sistem mengambil data retur, item retur, dan item exchange.
4. Jika ada item yang dulu dikembalikan ke stok, sistem mengurangi stok lagi.
5. Sistem mencatat mutasi `return_cancel`.
6. Jika ada barang exchange yang dulu keluar, sistem menambah stok kembali.
7. Sistem mencatat mutasi `exchange_cancel`.
8. Jika retur pernah menambah saldo customer, sistem mengurangi saldo tersebut kembali.
9. Sistem mencatat mutasi saldo pembatalan.
10. Data retur diarsipkan dan dipindah ke trash.

Kondisi:

- Refund tunai tidak mengubah saldo customer, jadi saat dibatalkan tidak ada rollback saldo.

Kemungkinan error:

- Retur tidak ditemukan
- Retur sudah pernah dibatalkan

---

## 4.5 Fitur Stok

### A. Penyesuaian Stok Manual

Tujuan:
Menyesuaikan stok aktual dengan kondisi fisik gudang/toko.

Alur:

1. Admin membuka menu penyesuaian stok.
2. Admin memilih produk.
3. Admin memasukkan stok aktual.
4. Admin dapat sekaligus mengubah minimum stok.
5. Backend mengambil stok saat ini.
6. Sistem menghitung selisih antara stok lama dan stok baru.
7. Jika ada selisih, sistem mencatat mutasi tipe `adjustment`.
8. Sistem memperbarui stok produk.
9. Jika minimum stok diubah, sistem memperbarui `minStock`.

Kondisi:

- Jika selisih nol, mutasi stok tidak dibuat.

Kemungkinan error:

- Produk tidak ditemukan
- Produk tidak punya varian
- Data input tidak valid

### B. Mutasi Stok Otomatis

Tujuan:
Mencatat semua pergerakan stok sebagai histori.

Mutasi bisa muncul dari:

- Penjualan
- Pembatalan penjualan
- Retur masuk ke stok
- Pembatalan retur
- Exchange barang keluar
- Pembatalan exchange
- Pembelian
- Pembatalan pembelian
- Adjustment manual

Fungsi mutasi stok:

- Menjadi histori perubahan stok
- Menjadi dasar audit stok
- Membantu analisis aktivitas stok harian

---

## 4.6 Fitur Notifikasi

### A. Notifikasi Stok Rendah

Tujuan:
Memberi tahu produk yang stoknya sudah mendekati atau melewati batas minimum.

Alur:

1. User membuka halaman notifikasi.
2. Backend memeriksa session dan role user.
3. Sistem mengambil daftar produk aktif.
4. Sistem mencari produk dengan stok <= batas tertentu terhadap minimum stok.
5. Sistem membentuk notifikasi stok rendah.
6. Sistem menggabungkan status baca user sebelumnya.
7. Frontend menampilkan notifikasi.

Kondisi:

- Jika user `admin toko`, notifikasi yang tampil dibatasi pada kategori tertentu.
- Jika `admin sistem`, semua kategori notifikasi bisa tampil.

Kemungkinan error:

- User belum login

### B. Notifikasi Rekomendasi Restock

Tujuan:
Memberi rekomendasi produk yang sebaiknya segera dibeli ulang.

Alur:

1. Sistem membaca riwayat penjualan 7 hari dan 30 hari terakhir.
2. Sistem menghitung jumlah barang yang terjual.
3. Sistem menghitung rata-rata penjualan per hari.
4. Sistem memperkirakan stok akan habis dalam berapa hari.
5. Sistem menghitung saran jumlah restock.
6. Sistem memilih sinyal restock yang paling penting per produk.
7. Notifikasi dikirim ke frontend.

### C. Notifikasi Piutang

Tujuan:
Mengingatkan adanya piutang yang tidak dibayar selama 7 hari.

Alur:

1. Sistem membaca data hutang aktif.
2. Sistem mencari hutang yang belum lunas.
3. Sistem memeriksa kapan terakhir hutang diperbarui.
4. Jika sudah lewat 7 hari, sistem membuat notifikasi.

### D. Notifikasi QRIS Pending

Tujuan:
Memberi tahu transaksi QRIS yang masih menunggu pembayaran.

Alur:

1. Sistem mencari sale dengan metode pembayaran QRIS.
2. Sistem memfilter status `pending_payment`.
3. Sistem memeriksa apakah QRIS belum kedaluwarsa.
4. Sistem membuat notifikasi pembayaran pending.

### E. Notifikasi Trash Cleanup

Tujuan:
Memberi tahu data trash yang sudah expired atau hasil cleanup otomatis.

Alur:

1. Sistem mengecek data trash yang berumur lebih dari 30 hari.
2. Jika ada, sistem membuat notifikasi cleanup.
3. Jika cleanup berhasil dijalankan, sistem mencatat event cleanup.
4. Event tersebut juga ditampilkan sebagai notifikasi.

---

## 4.7 Fitur Trash (Soft Delete)

### A. Lihat Trash

Tujuan:
Melihat data yang sudah dihapus secara soft delete.

Alur:

1. Admin Sistem membuka halaman trash.
2. Sistem dapat memicu auto cleanup jika interval sudah lewat.
3. Backend mengambil data terhapus dari beberapa entitas:
4. Produk
5. Penjualan
6. Pembelian
7. Pelanggan
8. Data digabung dalam satu daftar.
9. Data dapat difilter berdasarkan tipe dan pencarian.
10. Frontend menampilkan daftar trash.

Kondisi:

- Hanya `admin sistem` yang boleh mengakses trash.

### B. Restore Data dari Trash

Tujuan:
Mengaktifkan kembali data soft delete.

Alur umum:

1. Admin Sistem memilih item di trash.
2. Frontend mengirim permintaan restore.
3. Backend memvalidasi payload.
4. Sistem menjalankan restore per tipe data.

#### Restore Produk

1. Sistem mengaktifkan kembali produk.
2. `deletedAt` dihapus.

#### Restore Customer

1. Sistem mengaktifkan kembali customer.
2. `deletedAt` dihapus.

#### Restore Sale

1. Sistem mengambil sale, item, dan data hutang.
2. Sistem memeriksa produk dan varian masih ada.
3. Sistem memeriksa stok saat ini cukup untuk menerapkan sale lagi.
4. Jika sale dulu memakai saldo pelanggan, sistem memeriksa saldo customer cukup.
5. Sistem mengurangi stok lagi sesuai item sale.
6. Sistem mencatat mutasi stok `sale`.
7. Sistem mengurangi kembali saldo pelanggan jika dulu dipakai.
8. Jika sale punya hutang aktif, hutang diaktifkan lagi.
9. Sale dikembalikan menjadi aktif.

#### Restore Purchase

1. Sistem mengambil purchase dan item purchase.
2. Sistem memeriksa produk dan varian masih ada.
3. Sistem menambah stok lagi berdasarkan item pembelian.
4. Sistem menghitung ulang average cost dan last purchase cost.
5. Sistem mencatat mutasi stok `purchase`.
6. Purchase dikembalikan aktif.

Kemungkinan error:

- Data referensi tidak ada lagi
- Stok tidak cukup untuk restore sale
- Saldo customer tidak cukup untuk rollback sale
- Data tidak ditemukan di trash

### C. Force Delete

Tujuan:
Menghapus data trash secara permanen.

Alur:

1. Admin Sistem memilih item.
2. Frontend mengirim permintaan force delete.
3. Backend memvalidasi item.
4. Sistem menghapus data langsung dari tabel.
5. Frontend menerima hasil sukses.

Kondisi:

- Hanya data yang memang sudah ada di trash yang boleh dihapus permanen.

Kemungkinan error:

- Data tidak ditemukan di trash
- Payload tidak valid

### D. Cleanup Trash Otomatis / Manual

Tujuan:
Menghapus data trash yang sudah lebih dari 30 hari.

Alur:

1. Sistem membaca pengaturan cleanup interval.
2. Sistem memeriksa kapan terakhir pengecekan dilakukan.
3. Jika sudah lewat interval, sistem mulai scan data trash expired.
4. Sistem mengumpulkan kandidat dari produk, sale, purchase, dan customer.
5. Sistem memeriksa dependency aktif tiap data.
6. Jika aman, data dihapus permanen.
7. Jika masih punya dependency, data dilewati.
8. Sistem mencatat hasil cleanup.
9. Jika ada yang berhasil dihapus, sistem memperbarui waktu cleanup terakhir.
10. Sistem membuat event notifikasi cleanup.

Kondisi:

- Produk tidak boleh dibersihkan jika masih punya relasi penting seperti sale item, purchase item, atau stock mutation.
- Customer tidak boleh dibersihkan jika masih punya sale aktif atau hutang aktif.
- Sale tidak boleh dibersihkan jika masih punya hutang aktif.

Kemungkinan error:

- Gagal akses data trash
- Gagal hapus sebagian data

---

## 5. Interaksi Sistem (Sequence Flow)

Bagian ini disusun dengan pola:

`User -> Frontend -> Backend -> Database`

## 5.1 Sequence Pembelian / Kulakan

### Tujuan

Mencatat barang masuk dari supplier dan menambah stok produk.

### Alur

1. User mengisi data supplier dan item pembelian di frontend.
2. Frontend mengirim data pembelian ke backend.
3. Backend memvalidasi payload pembelian.
4. Backend memeriksa item varian duplikat.
5. Backend menyimpan header purchase sementara.
6. Backend mengambil data produk dan varian dari database.
7. Backend menghitung qty base unit, subtotal, dan average cost baru.
8. Backend memperbarui stok produk dan cost produk.
9. Backend menyimpan purchase item.
10. Backend menyimpan stock mutation tipe `purchase`.
11. Setelah semua item selesai, backend memperbarui nomor order dan total akhir.
12. Backend mengirim response sukses ke frontend.
13. Frontend menampilkan bukti pembelian.

## 5.2 Sequence Penjualan Tunai

### Tujuan

Mencatat transaksi penjualan normal.

### Alur

1. User memilih produk di frontend.
2. Frontend mengirim data transaksi ke backend.
3. Backend memvalidasi data transaksi.
4. Backend mengambil data produk dan varian dari database.
5. Backend memeriksa stok.
6. Backend mengurangi stok produk di database.
7. Backend menyimpan header sale.
8. Backend menyimpan sale items.
9. Backend menyimpan stock mutations.
10. Jika memakai saldo pelanggan, backend memperbarui saldo customer.
11. Jika perlu, backend membuat data hutang.
12. Backend memperbarui nomor invoice final.
13. Backend mengirim response sukses ke frontend.
14. Frontend menampilkan bukti transaksi.

## 5.3 Sequence Penjualan QRIS

### Tujuan

Mencatat penjualan yang menunggu pembayaran QRIS.

### Alur

1. User memilih metode QRIS di frontend.
2. Frontend mengirim transaksi ke backend.
3. Backend memvalidasi transaksi dan nominal minimum.
4. Backend menyimpan sale dengan status `pending_payment`.
5. Backend mengurangi stok dan menyimpan detail transaksi.
6. Backend memanggil layanan pembayaran QRIS.
7. Jika berhasil, backend menyimpan nomor pembayaran dan expiry.
8. Backend mengirim QRIS data ke frontend.
9. Frontend menampilkan QR code / info pembayaran.

Alur gagal:

1. Jika layanan QRIS gagal, backend mengarsipkan sale.
2. Backend mengembalikan stok ke produk.
3. Backend mengirim error ke frontend.

## 5.4 Sequence Retur Refund

### Tujuan

Memproses retur barang dengan pengembalian uang tunai.

### Alur

1. User memilih invoice dan item retur di frontend.
2. Frontend mengirim data retur ke backend.
3. Backend mengambil sale asli dan histori retur sebelumnya.
4. Backend memvalidasi item dan qty.
5. Jika item masuk kembali ke stok, backend menambah stok produk.
6. Backend menyimpan header retur.
7. Backend menyimpan return items.
8. Backend menyimpan stock mutation `return_restock`.
9. Backend mengirim hasil perhitungan refund ke frontend.
10. Frontend menampilkan instruksi pengembalian uang tunai.

## 5.5 Sequence Retur Exchange

### Tujuan

Menukar barang lama dengan barang baru.

### Alur

1. User memilih item retur dan item pengganti.
2. Frontend mengirim data exchange ke backend.
3. Backend mengambil sale asli.
4. Backend memvalidasi item retur.
5. Backend mengambil data produk pengganti.
6. Backend memvalidasi stok barang pengganti.
7. Backend menambah stok untuk barang retur jika perlu.
8. Backend mengurangi stok untuk barang pengganti.
9. Backend menyimpan detail retur.
10. Backend menyimpan detail exchange.
11. Backend menghitung selisih nilai.
12. Jika surplus masuk saldo, backend memperbarui saldo customer.
13. Backend mengirim hasil final ke frontend.
14. Frontend menampilkan apakah customer menerima uang, saldo, atau harus menambah pembayaran.

## 5.6 Sequence Restore Trash Sale

### Tujuan

Mengaktifkan kembali sale dari trash.

### Alur

1. User memilih restore sale di frontend.
2. Frontend mengirim item trash ke backend.
3. Backend mengambil sale, item sale, dan debt dari database.
4. Backend memeriksa produk, varian, stok, dan saldo customer.
5. Jika valid, backend mengurangi stok lagi.
6. Backend mencatat stock mutation baru.
7. Backend mengaktifkan kembali debt bila ada.
8. Backend mengubah sale menjadi aktif.
9. Backend mengirim hasil restore ke frontend.

## 5.7 Sequence Ambil Notifikasi

### Tujuan

Menampilkan notifikasi sesuai role user.

### Alur

1. User membuka halaman notifikasi.
2. Frontend meminta data notifikasi ke backend.
3. Backend memverifikasi session user.
4. Backend mengambil data stok rendah, restock, piutang, QRIS pending, dan trash cleanup.
5. Backend memfilter notifikasi sesuai role user.
6. Backend menggabungkan status baca notifikasi.
7. Backend mengirim daftar notifikasi ke frontend.
8. Frontend menampilkan notifikasi.

---

## 6. Struktur Data (Class Overview)

Bagian ini bisa langsung menjadi dasar class diagram sederhana.

## 6.1 Entitas Utama

### 1. User

Field penting:

- id
- name
- email
- password
- isActive
- deletedAt

Relasi:

- User memiliki banyak Sale
- User memiliki banyak CustomerReturn
- User memiliki banyak StockMutation
- User memiliki banyak NotificationState
- User memiliki role melalui UserRole

### 2. UserRole

Field penting:

- userId
- role

Relasi:

- Banyak role milik satu User

### 3. Category

Field penting:

- id
- name
- isActive
- deletedAt

Relasi:

- Category memiliki banyak Product

### 4. Unit

Field penting:

- id
- name
- isActive
- deletedAt

Relasi:

- Unit dipakai oleh Product
- Unit dipakai oleh ProductVariant

### 5. Product

Field penting:

- id
- categoryId
- sku
- name
- minStock
- stock
- baseUnitId
- averageCost
- lastPurchaseCost
- isActive
- deletedAt

Relasi:

- Product belongs to Category
- Product belongs to Unit
- Product memiliki banyak ProductVariant
- Product memiliki banyak ProductBarcode
- Product memiliki banyak SaleItem
- Product memiliki banyak CustomerReturnItem
- Product memiliki banyak StockMutation

### 6. ProductVariant

Field penting:

- id
- productId
- name
- sku
- unitId
- conversionToBase
- sellPrice
- isActive
- deletedAt

Relasi:

- Banyak variant milik satu Product
- Variant dipakai di SaleItem
- Variant dipakai di CustomerReturnItem
- Variant dipakai di CustomerExchangeItem
- Variant dipakai di StockMutation

### 7. ProductBarcode

Field penting:

- id
- productId
- barcode

Relasi:

- Banyak barcode milik satu Product

### 8. Customer

Field penting:

- id
- name
- phone
- address
- creditBalance
- isActive
- deletedAt

Relasi:

- Customer memiliki banyak Sale
- Customer memiliki banyak Debt
- Customer memiliki banyak CustomerReturn
- Customer memiliki banyak CustomerBalanceMutation

### 8A. PurchaseOrder

Field penting:

- id
- orderNumber
- supplierId
- total
- isArchived
- deletedAt
- userId

Relasi:

- PurchaseOrder belongs to Supplier
- PurchaseOrder belongs to User
- PurchaseOrder memiliki banyak PurchaseItem

### 8B. PurchaseItem

Field penting:

- id
- purchaseId
- productId
- variantId
- qty
- price
- subtotal
- unitFactorAtPurchase
- costBefore

Relasi:

- Banyak PurchaseItem milik satu PurchaseOrder
- PurchaseItem mengacu ke Product
- PurchaseItem mengacu ke ProductVariant

### 9. Sale

Field penting:

- id
- invoiceNumber
- customerId
- totalPrice
- totalPaid
- totalReturn
- totalBalanceUsed
- status
- paymentMethod
- qrisPaymentNumber
- qrisExpiredAt
- isArchived
- deletedAt
- userId

Relasi:

- Sale belongs to User
- Sale belongs to Customer
- Sale memiliki banyak SaleItem
- Sale dapat memiliki satu Debt
- Sale memiliki banyak CustomerReturn

### 10. SaleItem

Field penting:

- id
- saleId
- productId
- variantId
- qty
- priceAtSale
- unitFactorAtSale
- costAtSale
- subtotal

Relasi:

- Banyak SaleItem milik satu Sale
- SaleItem mengacu ke Product
- SaleItem mengacu ke ProductVariant

### 11. Debt

Field penting:

- id
- saleId
- customerId
- originalAmount
- remainingAmount
- status
- isActive
- deletedAt

Relasi:

- Debt milik satu Sale
- Debt milik satu Customer
- Debt memiliki banyak DebtPayment

### 12. DebtPayment

Field penting:

- id
- debtId
- amountPaid
- paymentDate
- note

Relasi:

- Banyak DebtPayment milik satu Debt

### 13. CustomerReturn

Field penting:

- id
- returnNumber
- saleId
- customerId
- totalValueReturned
- totalRefund
- compensationType
- surplusStrategy
- isArchived
- deletedAt
- userId

Relasi:

- CustomerReturn belongs to Sale
- CustomerReturn belongs to Customer
- CustomerReturn belongs to User
- CustomerReturn memiliki banyak CustomerReturnItem
- CustomerReturn memiliki banyak CustomerExchangeItem

### 14. CustomerReturnItem

Field penting:

- id
- returnId
- productId
- variantId
- qty
- priceAtReturn
- unitFactorAtReturn
- reason
- returnedToStock

Relasi:

- Banyak return item milik satu CustomerReturn
- Return item mengacu ke Product
- Return item mengacu ke ProductVariant

### 15. CustomerExchangeItem

Field penting:

- id
- returnId
- productId
- variantId
- qty
- priceAtExchange
- unitFactorAtExchange

Relasi:

- Banyak exchange item milik satu CustomerReturn
- Exchange item mengacu ke Product
- Exchange item mengacu ke ProductVariant

### 16. CustomerBalanceMutation

Field penting:

- id
- customerId
- amount
- balanceBefore
- balanceAfter
- type
- referenceId
- referenceType
- note

Relasi:

- Banyak mutasi saldo milik satu Customer

### 17. StockMutation

Field penting:

- id
- productId
- variantId
- type
- qtyBaseUnit
- unitFactorAtMutation
- reference
- userId
- createdAt

Relasi:

- StockMutation mengacu ke Product
- StockMutation mengacu ke ProductVariant
- StockMutation dicatat oleh User

### 18. NotificationState

Field penting:

- id
- userId
- notificationId
- readAt
- dismissedAt

Relasi:

- Banyak NotificationState milik satu User

### 19. TrashSettings

Field penting:

- id
- lastCheckAt
- lastCleanupAt
- cleanupIntervalMinutes
- updatedAt

Relasi:

- Dipakai oleh Sistem untuk mengatur cleanup trash

---

## 7. Ringkasan Relasi Inti untuk Class Diagram

Relasi yang paling penting untuk digambar:

- User `1..*` Sale
- User `1..*` CustomerReturn
- User `1..*` StockMutation
- Category `1..*` Product
- Unit `1..*` Product
- Product `1..*` ProductVariant
- Product `1..*` ProductBarcode
- Product `1..*` PurchaseItem
- Product `1..*` SaleItem
- Product `1..*` CustomerReturnItem
- Product `1..*` StockMutation
- Customer `1..*` Sale
- Customer `1..*` Debt
- Customer `1..*` CustomerReturn
- Customer `1..*` CustomerBalanceMutation
- PurchaseOrder `1..*` PurchaseItem
- Sale `1..*` SaleItem
- Sale `1..1` Debt
- Sale `1..*` CustomerReturn
- CustomerReturn `1..*` CustomerReturnItem
- CustomerReturn `1..*` CustomerExchangeItem
- Debt `1..*` DebtPayment

---

## 8. Saran Penggunaan untuk UML

### Untuk Use Case Diagram

Gunakan aktor:

- Admin Toko
- Admin Sistem
- Sistem

Use case utama yang disarankan:

- Kelola Produk
- Kelola Pembelian
- Kelola Stok
- Buat Penjualan
- Kelola Retur
- Kelola Piutang
- Lihat Notifikasi
- Kelola Trash

### Untuk Activity Diagram

Activity diagram paling penting:

- Pembelian / kulakan
- Tambah produk
- Penjualan tunai
- Penjualan hutang
- Penjualan QRIS
- Retur refund
- Retur exchange
- Restore trash
- Cleanup trash

### Untuk Sequence Diagram

Sequence diagram paling penting:

- Pembelian / kulakan
- Penjualan tunai
- Penjualan QRIS
- Retur refund
- Retur exchange
- Batalkan penjualan
- Restore sale dari trash
- Ambil notifikasi

### Untuk Class Diagram

Prioritaskan class berikut:

- User
- UserRole
- Customer
- Product
- ProductVariant
- ProductBarcode
- PurchaseOrder
- PurchaseItem
- Sale
- SaleItem
- Debt
- DebtPayment
- CustomerReturn
- CustomerReturnItem
- CustomerExchangeItem
- CustomerBalanceMutation
- StockMutation
- NotificationState
- TrashSettings

---

## 9. Kesimpulan

Sistem POS ini berpusat pada tiga alur utama:

- Pengelolaan produk dan stok
- Penjualan dan retur
- Pengelolaan data terhapus melalui trash

Di atas alur tersebut, sistem juga menjalankan fungsi otomatis seperti:

- validasi transaksi
- pencatatan mutasi stok
- pengelolaan saldo customer
- pembentukan notifikasi
- cleanup trash berkala

Dokumen ini sudah cukup detail untuk menjadi dasar pembuatan empat diagram UML utama tanpa harus membaca source code secara penuh.
