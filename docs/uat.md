# User Acceptance Test (UAT)

User Acceptance Test (UAT) merupakan pengujian yang dilakukan bersama pengguna akhir (*end user*) untuk memastikan sistem yang dibangun sesuai kebutuhan dan dapat diterima untuk digunakan dalam proses kerja. Pada penelitian ini, UAT dilakukan menggunakan kuesioner skala Likert 1–5 agar persepsi pengguna dapat diukur secara kuantitatif dan direkap dalam bentuk persentase penerimaan.

---

## 1. Responden

Responden UAT dipilih berdasarkan peran yang benar-benar menggunakan sistem dalam operasional harian. UAT dilakukan secara *role-based*, yaitu satu responden mewakili setiap peran inti agar seluruh alur kerja utama dapat diuji. Peran Admin Sistem tidak menjadi responden UAT karena bersifat administratif-teknis dan tidak terlibat langsung dalam alur operasional utama, sehingga pengujian difokuskan pada Admin Toko dan Pemilik Toko.

| No | Role | Aktivitas Utama yang Diuji |
|:--:|------|---------------------------|
| 1 | Admin Toko | Memproses penjualan di kasir, mencatat pembelian dari supplier, mengelola stok dan retur, menangani piutang pelanggan. |
| 2 | Pemilik Toko | Melihat laporan keuangan (ikhtisar, penjualan, pembelian, laba rugi), memantau performa bisnis, mengambil keputusan berdasarkan data. |

---

## 2. Instrumen Pengujian: Kuesioner Skala Likert

Instrumen pengujian berupa kuesioner dengan pilihan jawaban skala Likert 1–5. Setiap responden mengisi kuesioner setelah melakukan skenario uji sesuai perannya.

| Skor | Kategori | Makna |
|:----:|----------|-------|
| 5 | Sangat Setuju | Fitur/alur sangat sesuai dan sangat mudah digunakan. |
| 4 | Setuju | Fitur/alur sesuai dan mudah digunakan. |
| 3 | Netral/Cukup | Cukup sesuai, namun masih ada hal yang perlu perbaikan. |
| 2 | Tidak Setuju | Kurang sesuai dan menyulitkan pengguna. |
| 1 | Sangat Tidak Setuju | Tidak sesuai dan tidak dapat diterima pengguna. |

---

## 3. Rancangan Kuesioner UAT Per-Role

Kuesioner disusun per role sesuai aktivitas utama pengguna. Untuk menjaga keadilan penilaian antar aspek, setiap role diberikan jumlah pernyataan yang sama pada setiap aspek. Pada penelitian ini digunakan 8 pernyataan per role, dengan proporsi 2 pernyataan untuk setiap aspek (Fungsionalitas, Usability, Kinerja, Reliability). Setiap pernyataan dijawab dengan skala 1–5 (Sangat Tidak Setuju – Sangat Setuju).

| Role | Fungsionalitas | Usability | Kinerja | Reliability | Total Item |
|------|:--------------:|:---------:|:-------:|:-----------:|:----------:|
| Admin Toko | 2 | 2 | 2 | 2 | 8 |
| Pemilik Toko | 2 | 2 | 2 | 2 | 8 |

*Catatan: Daftar butir pernyataan kuesioner UAT lebih lengkap untuk masing-masing role disajikan pada Bagian 5.*

---

## 4. Skenario Pengujian Per-Role

Setiap responden diminta menjalankan skenario berikut secara mandiri sebelum mengisi kuesioner, agar penilaian didasarkan pada pengalaman langsung menggunakan sistem.

### 4.1 Skenario Admin Toko

Responden menjalankan skenario operasional berikut:

| No | Langkah Uji |
|:--:|-------------|
| A1 | Login ke sistem, lalu buka halaman Kasir. Tambahkan beberapa produk ke keranjang (ketik nama dan scan barcode), atur jumlah, pilih pembayaran tunai, masukkan nominal, proses, dan cetak struk. |
| A2 | Buat transaksi baru dengan pembayaran QRIS, lalu batalkan sebelum dibayar. |
| A3 | Buat transaksi piutang untuk pelanggan terdaftar. Kemudian buka daftar piutang dan lakukan pembayaran sebagian (cicil) hingga lunas. |
| A4 | Buka halaman Pembelian. Tambahkan supplier baru, lalu buat nota pembelian dengan beberapa item. Periksa apakah stok dan harga pokok bertambah otomatis. |
| A5 | Buka riwayat pembelian. Klik "Data Salah" pada salah satu nota, ubah harga, lalu simpan. Periksa apakah stok dan harga pokok terhitung ulang dengan benar. |
| A6 | Buka riwayat penjualan. Lakukan retur barang dengan kompensasi pengembalian uang (refund). Periksa apakah stok bertambah jika barang layak stok. |
| A7 | Buka halaman Produk. Lakukan penyesuaian stok (stock opname) pada satu produk dengan memasukkan stok aktual dan alasan. Periksa riwayat mutasi stok. |
| A8 | Buka panel notifikasi dan periksa apakah peringatan stok rendah dan piutang jatuh tempo tampil dengan benar. |

### 4.2 Skenario Pemilik Toko

Responden menjalankan skenario berikut:

| No | Langkah Uji |
|:--:|-------------|
| B1 | Login ke sistem, buka halaman Laporan. Pilih rentang tanggal bulan ini. Buka tab "Ikhtisar Performa" dan perhatikan kartu ringkasan serta grafik tren. |
| B2 | Buka tab "Analisis Penjualan". Perhatikan grafik tren harian, daftar produk terlaris, dan grafik kontribusi produk. |
| B3 | Buka tab "Analisis Pembelian". Perhatikan total pengeluaran dan grafik tren pembelian. |
| B4 | Buka tab "Laporan Laba Rugi". Perhatikan struktur: Laba Kotor → Beban → Laba/Rugi Bersih. |
| B5 | Buka halaman Biaya & Pajak, tambahkan satu biaya operasional dan satu pajak. Kembali ke laporan dan periksa apakah nilai laba bersih berubah sesuai. |
| B6 | Cetak laporan dan periksa apakah hasilnya rapi dalam format A4. |
| B7 | Buka halaman Pelanggan, lihat daftar piutang dan saldo kredit pelanggan. |
| B8 | Buka halaman Produk, periksa notifikasi stok rendah dan riwayat mutasi stok. |

---

## 5. Lembar Kuesioner UAT

### 5.1 Kuesioner Admin Toko

**Nama Responden:** _________________________
**Tanggal Pengujian:** _________________________

*Petunjuk: Beri tanda centang (✓) pada kolom skor yang sesuai setelah menjalankan skenario pengujian.*

| No | Aspek | Pernyataan | 1 | 2 | 3 | 4 | 5 |
|:--:|-------|------------|:--:|:--:|:--:|:--:|:--:|
| 1 | Fungsionalitas | Sistem dapat memproses transaksi penjualan (tunai dan QRIS) dengan perhitungan total dan kembalian yang benar. | | | | | |
| 2 | Fungsionalitas | Sistem mencatat pembelian dari supplier dan memperbarui stok serta harga pokok secara otomatis. | | | | | |
| 3 | Usability | Halaman kasir mudah digunakan untuk mencari produk (ketik nama, scan barcode) dan menambahkan ke keranjang. | | | | | |
| 4 | Usability | Navigasi antar halaman (Kasir, Pembelian, Produk, Piutang, Retur) jelas dan mudah ditemukan. | | | | | |
| 5 | Kinerja | Proses transaksi penjualan berlangsung cepat, termasuk saat menambahkan beberapa item sekaligus. | | | | | |
| 6 | Kinerja | Halaman daftar produk dan riwayat transaksi dimuat tanpa jeda yang mengganggu. | | | | | |
| 7 | Reliability | Stok berkurang dan bertambah secara akurat setelah transaksi penjualan, retur, dan pembelian. | | | | | |
| 8 | Reliability | Data transaksi tersimpan dengan benar dan dapat dilihat kembali di riwayat tanpa kehilangan informasi. | | | | | |

**Total Skor:** _____ / 40

---

### 5.2 Kuesioner Pemilik Toko

**Nama Responden:** _________________________
**Tanggal Pengujian:** _________________________

*Petunjuk: Beri tanda centang (✓) pada kolom skor yang sesuai setelah menjalankan skenario pengujian.*

| No | Aspek | Pernyataan | 1 | 2 | 3 | 4 | 5 |
|:--:|-------|------------|:--:|:--:|:--:|:--:|:--:|
| 1 | Fungsionalitas | Laporan laba rugi menampilkan struktur yang jelas (Laba Kotor, Beban, Laba/Rugi Bersih) sesuai kebutuhan bisnis. | | | | | |
| 2 | Fungsionalitas | Analisis penjualan dan pembelian menyediakan informasi yang cukup untuk pengambilan keputusan. | | | | | |
| 3 | Usability | Halaman laporan mudah dipahami dengan grafik dan tabel yang informatif. | | | | | |
| 4 | Usability | Filter rentang tanggal pada laporan mudah digunakan dan hasilnya sesuai periode yang dipilih. | | | | | |
| 5 | Kinerja | Laporan dimuat dengan cepat meskipun dalam rentang tanggal yang panjang (satu bulan penuh). | | | | | |
| 6 | Kinerja | Hasil cetak laporan tampil rapi dan terbaca jelas dalam format A4. | | | | | |
| 7 | Reliability | Data pada laporan (penjualan, pembelian, laba rugi) akurat dan konsisten dengan transaksi harian. | | | | | |
| 8 | Reliability | Informasi piutang pelanggan dan stok produk ditampilkan dengan benar dan dapat diandalkan. | | | | | |

**Total Skor:** _____ / 40

---

## 6. Teknik Analisis dan Perhitungan Indeks Persen

Hasil kuesioner dianalisis menggunakan rumus indeks persen untuk mengukur tingkat penerimaan sistem oleh pengguna.

### 6.1 Rumus

$$\text{Indeks Persen} = \frac{\text{Total Skor Aktual}}{\text{Skor Maksimum}} \times 100\%$$

Keterangan:
- **Total Skor Aktual** = jumlah skor yang diberikan responden
- **Skor Maksimum** = jumlah pernyataan × skor tertinggi (5) = 8 × 5 = 40

### 6.2 Kriteria Penerimaan

| Rentang Indeks Persen | Kategori | Keputusan |
|:---------------------:|----------|-----------|
| 81% – 100% | Sangat Baik | Sistem diterima tanpa revisi. |
| 61% – 80% | Baik | Sistem diterima dengan catatan perbaikan minor. |
| 41% – 60% | Cukup | Sistem memerlukan perbaikan sebelum diterima. |
| 21% – 40% | Kurang | Sistem memerlukan perbaikan besar. |
| 0% – 20% | Sangat Kurang | Sistem ditolak dan perlu dirancang ulang. |

### 6.3 Rekapitulasi Hasil UAT

| No | Role | Total Skor | Skor Maks | Indeks Persen | Kategori |
|:--:|------|:----------:|:---------:|:-------------:|----------|
| 1 | Admin Toko | | 40 | | |
| 2 | Pemilik Toko | | 40 | | |
| | **Rata-rata** | | | | |

---

## 7. Kesimpulan dan Persetujuan

Berdasarkan hasil pengujian kuesioner UAT di atas:

| | |
|---|---|
| **Keputusan** | ☐ Sistem **DITERIMA** tanpa revisi (rata-rata ≥ 81%) |
| | ☐ Sistem **DITERIMA DENGAN CATATAN** (rata-rata 61%–80%) |
| | ☐ Sistem **MEMERLUKAN PERBAIKAN** (rata-rata < 61%) |

**Catatan Perbaikan (jika ada):**

_________________________________________________________________________

_________________________________________________________________________

_________________________________________________________________________

| | | |
|---|---|---|
| **Responden Admin Toko** | **Tanggal** | **Tanda Tangan** |
| Nama: _________________ | _________________ | _________________ |

| | | |
|---|---|---|
| **Responden Pemilik Toko** | **Tanggal** | **Tanda Tangan** |
| Nama: _________________ | _________________ | _________________ |

| | | |
|---|---|---|
| **Peneliti / Penanggung Jawab Sistem** | **Tanggal** | **Tanda Tangan** |
| Nama: _________________ | _________________ | _________________ |
