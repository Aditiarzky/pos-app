# Rencana Refactor UI - Konsistensi Komponen Dasar

Dokumen ini berisi rencana untuk merapikan dan menyatukan tampilan UI yang saat ini belum konsisten, terutama pada komponen dasar seperti tombol filter, switch mode card/tabel, tombol tab, dan elemen kecil lain yang sering dipakai ulang.

## Tujuan

- Menyamakan gaya visual dan perilaku interaksi antar komponen UI dasar.
- Mengurangi variasi style ad-hoc per halaman/fitur.
- Meningkatkan keterbacaan, hirarki visual, dan kualitas estetika tanpa mengubah identitas produk.
- Menyiapkan fondasi design system ringan agar pengembangan fitur berikutnya lebih cepat dan konsisten.

## Masalah yang Ditemukan

- Tombol filter berbeda-beda dari sisi ukuran, radius, warna, icon spacing, dan state aktif.
- Switch view card/tabel tidak punya pola yang sama antar halaman (position, icon style, active state, hover/focus).
- Tombol tab memiliki style berbeda (border, background, typography, spacing), sehingga UX terasa tidak seragam.
- Komponen kecil (badge, chip, inline action button, empty state action, small dropdown trigger) belum mengikuti satu token/style yang sama.
- State penting (hover, focus, disabled, loading) belum konsisten di semua komponen.

## Scope Refactor

### 1. Standarisasi Foundation (Design Tokens)

- Definisikan token warna, radius, shadow, border, spacing, dan typography yang jadi acuan bersama.
- Tetapkan skala ukuran komponen (`sm`, `md`, `lg`) dan tinggi komponen standar.
- Pastikan token mendukung aksesibilitas kontras untuk teks dan elemen interaktif.

### 2. Standardisasi Komponen Prioritas

- `FilterButton` / `FilterGroup`
- `ViewSwitch` (Card <-> Table)
- `Tabs` / `TabButton`
- `IconButton` kecil untuk aksi sekunder
- `Badge` / `Chip` status ringkas
- `DropdownTrigger` kecil yang sering dipakai di toolbar/list

### 3. Penyatuan State Interaksi

- Definisikan state baku: `default`, `hover`, `active`, `focus-visible`, `disabled`, `loading`.
- Terapkan pola focus ring yang konsisten di semua kontrol interaktif.
- Samakan transisi ringan agar UI terasa rapi dan responsif.

### 4. Polishing Visual

- Rapikan alignment, spasi horizontal/vertikal, dan ritme layout pada area toolbar/list/header section.
- Tingkatkan visual clarity (warna aktif, indikator state, pemisahan prioritas aksi).
- Perindah tampilan secara subtle (bukan redesign total), tetap selaras gaya produk saat ini.

## Strategi Implementasi

1. Audit komponen dan mapping area pemakaian.
2. Bentuk standar final (token + varian komponen) di layer UI reusable.
3. Refactor bertahap per komponen prioritas.
4. Terapkan ke halaman-halaman utama dengan traffic tinggi terlebih dahulu.
5. Bersihkan style lama/duplikasi class setelah migrasi aman.

## Urutan Eksekusi

1. Audit dan inventaris style saat ini.
2. Buat/rapikan token global dan utility class varian komponen.
3. Refactor `FilterButton` dan `ViewSwitch`.
4. Refactor `Tabs/TabButton`.
5. Refactor komponen kecil (badge/chip/icon button/dropdown trigger).
6. Integrasi ke halaman target dan validasi visual.
7. Cleanup kode style lama.

## Kriteria Selesai (Definition of Done)

- Komponen prioritas menggunakan style yang konsisten lintas halaman.
- Tidak ada lagi style inline/ad-hoc untuk pola komponen yang sama.
- State interaksi utama tersedia dan seragam.
- Tidak ada regresi fungsi pada filter, tab navigation, dan switch view.
- Visual terlihat lebih rapi dan modern tanpa mengganggu alur kerja pengguna.

## Validasi & QA

- Uji visual desktop + mobile untuk halaman yang terdampak.
- Uji keyboard navigation (`Tab`, `Enter`, `Space`, `Esc`) untuk komponen interaktif.
- Uji kontras teks dan focus state pada tema yang aktif.
- Bandingkan sebelum/sesudah pada skenario: filtering, ganti mode tampilan, pindah tab, aksi kecil di toolbar.

## Risiko & Mitigasi

- Risiko: perbedaan style lama tersebar di banyak file.
  - Mitigasi: migrasi bertahap + fallback class sementara.
- Risiko: perubahan visual memicu mismatch ekspektasi tim.
  - Mitigasi: tetapkan contoh standar per komponen sebagai referensi tunggal sebelum rollout luas.
- Risiko: regresi interaksi komponen.
  - Mitigasi: checklist QA perilaku + verifikasi manual untuk flow utama.

## Target Area Implementasi

- Komponen reusable di folder UI/shared components.
- Halaman dashboard/listing yang memakai filter, tabs, dan view switch.
- Area toolbar dan panel ringkas yang banyak memakai komponen kecil.

## Hasil Akhir yang Diharapkan

UI dasar menjadi konsisten, lebih enak dipakai, dan terlihat lebih polished. Tim juga punya fondasi komponen yang jelas untuk pengembangan fitur berikutnya tanpa mengulang ketidakkonsistenan style.
