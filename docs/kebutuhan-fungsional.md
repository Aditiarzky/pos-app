# Analisis Kebutuhan Fungsional Berdasarkan RBAC

Dokumen ini menjelaskan pembagian fungsi sistem berdasarkan sistem kontrol akses berbasis peran (_Role-Based Access Control_) yang diimplementasikan dalam aplikasi. Sistem membagi hak akses ke dalam dua kategori utama: **admin toko** dan **admin sistem**.

## 1. Peran: admin toko (Fungsi Kasir & Operasional)

Peran ini ditujukan bagi pengguna yang menangani aktivitas operasional harian di depan toko. Kebutuhan fungsional untuk peran ini meliputi:

- **Layanan Transaksi Penjualan:** Melayani proses transaksi belanja pelanggan secara _real-time_, termasuk memindai barcode produk untuk entri data yang cepat.
- **Validasi Inventaris Otomatis:** Melakukan pengecekan ketersediaan stok secara otomatis sebelum transaksi difinalisasi untuk memastikan barang tersedia.
- **Manajemen Bukti Pembayaran:** Melakukan finalisasi pembayaran (Tunai/QRIS) dan mencetak struk transaksi sebagai bukti belanja sah.
- **Pengelolaan Pelanggan & Piutang:** Mencatat data identitas pelanggan baru serta mengelola catatan penjualan tempo (piutang), termasuk memproses cicilan pelunasan piutang.
- **Pemrosesan Retur Pelanggan:** Menangani pengembalian barang (_snack_) yang rusak atau tidak sesuai melalui proses verifikasi nota transaksi asli dalam sistem.
- **Monitoring Persediaan:** Menerima indikator atau peringatan visual saat stok produk tertentu di etalase mulai mencapai batas minimum.

## 2. Peran: admin sistem (Fungsi Pemilik & Manajerial)

Peran ini memiliki otoritas penuh terhadap aspek manajerial, pengaturan sistem, dan pemantauan performa bisnis secara keseluruhan. Kebutuhan fungsional untuk peran ini meliputi:

- **Manajemen Data Induk (Master Data):** Memiliki wewenang penuh untuk mengelola data kategori produk, inventaris barcode, serta pengaturan varian kemasan (eceran/grosir).
- **Manajemen Pengadaan (Procurement):** Mencatat nota transaksi pembelian barang (_kulakan_) dari _supplier_ yang secara otomatis memperbarui kebijakan harga pokok (HPP) dan jumlah persediaan.
- **Audit & Penyesuaian Stok:** Melakukan sinkronisasi data sistem dengan stok fisik (_stock opname_) serta memantau riwayat mutasi stok secara mendalam untuk keperluan audit.
- **Pemantauan Performa Bisnis:** Mengakses ringkasan grafik performa toko dan laporan keuangan komprehensif, termasuk laporan laba-rugi bersih yang dihitung berdasarkan biaya rata-rata tertimbang.
- **Manajemen Keamanan & Pengguna:** Mengelola pendaftaran akun pengguna, melakukan pengaturan ulang kata sandi, serta menentukan batasan hak akses untuk menjaga keamanan sistem.
- **Manajemen Sampah Data (Trash Management):** Mengelola database transisi untuk data yang dihapus (tidak permanen), dengan kemampuan untuk memulihkan atau memusnahkan data secara permanen.
