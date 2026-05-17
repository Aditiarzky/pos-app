# High-Level Plan - Konsolidasi Laporan Multi-Kategori

## Tujuan
Mengubah laporan yang saat ini terpisah atau terlalu tipis per bagian menjadi satu laporan terpadu yang terdiri dari beberapa kategori. Setiap kategori harus memiliki konten yang lebih kaya dan kontekstual, tanpa mengorbankan kejelasan atau performa antarmuka.

## Hasil yang Diharapkan
1. Satu halaman laporan utama dengan struktur kategori yang jelas.
2. Setiap kategori memiliki detail yang cukup (ringkasan, metrik inti, breakdown, dan insight pendukung).
3. UI laporan tetap selaras dengan design system dan pola interaksi yang sudah ada.

## Ruang Lingkup Perubahan
1. Konsolidasi sumber data laporan ke satu alur agregasi.
2. Restrukturisasi konten laporan berdasarkan kategori yang relevan.
3. Pendalaman isi per kategori agar tidak hanya menampilkan angka ringkas.
4. Penyesuaian komponen UI agar konsisten dengan gaya existing (layout, typography, spacing, warna, komponen).
5. Validasi kualitas data, pengalaman pengguna, dan performa render.

## Strategi Implementasi
1. Definisikan kategori utama laporan beserta tujuan bisnis tiap kategori.
2. Petakan data yang tersedia saat ini, lalu identifikasi gap data untuk detail kategori.
3. Rancang skema tampilan per kategori:
   - Ringkasan kategori
   - Metrik kunci
   - Breakdown detail (contoh: periode, produk, channel, atau dimensi relevan lain)
   - Catatan insight/anomali jika ada
4. Bangun pipeline data terpadu agar setiap kategori mengambil data dari kontrak yang konsisten.
5. Implementasikan halaman laporan tunggal dengan section kategori yang mudah dipindai.
6. Lakukan harmonisasi UI:
   - Gunakan komponen existing terlebih dahulu
   - Ikuti pola grid, spacing, dan hierarchy visual yang sudah dipakai di aplikasi
   - Pastikan responsif desktop dan mobile tetap stabil
7. Tambahkan state lengkap (loading, empty, error) per kategori agar UX tetap informatif.
8. Lakukan QA fungsional dan visual untuk memastikan akurasi serta konsistensi.

## Kriteria Detail Per Kategori
1. Setiap kategori minimal memiliki 3 lapisan informasi:
   - Angka utama
   - Breakdown pendukung
   - Interpretasi singkat atau indikator perubahan
2. Hindari kategori yang hanya berisi 1 angka tanpa konteks.
3. Prioritaskan detail yang bisa ditindaklanjuti pengguna.

## Prinsip Keselarasan UI
1. Tidak membuat bahasa visual baru yang bertabrakan dengan UI eksisting.
2. Mempertahankan pola navigasi, card, tabel, dan filter yang sudah familiar.
3. Menjaga konsistensi jarak, ukuran teks, dan interaksi antar komponen.
4. Menjaga keterbacaan saat data kategori bertambah banyak.

## Validasi & Pengujian
1. Validasi data:
   - Kecocokan angka agregat vs sumber data
   - Konsistensi antar kategori
2. Validasi UX:
   - Alur baca dari ringkasan ke detail terasa natural
   - Empty state dan error state jelas
3. Validasi UI:
   - Konsistensi style dengan halaman lain
   - Responsif di breakpoint utama
4. Validasi performa:
   - Waktu render tetap wajar saat seluruh kategori tampil

## Deliverables
1. Halaman laporan tunggal berbasis multi-kategori.
2. Struktur data dan kontrak kategori yang terdokumentasi.
3. Checklist QA data + UI untuk verifikasi sebelum release.
