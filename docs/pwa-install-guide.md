# Panduan Instalasi PWA (Progressive Web App) - POS App

Dokumen ini menjelaskan cara menginstal dan menguji POS App sebagai Progressive Web App (PWA) di perangkat Android, iOS, dan Desktop (Google Chrome / Microsoft Edge).

---

## 1. Persyaratan Lingkungan (Environment Prerequisites)

Untuk dapat diinstall dan menjalankan fitur PWA secara optimal:
- **Koneksi Aman**: Harus diakses melalui `https://` atau `http://localhost` (Secure Context).
- **Service Worker & Manifest**: Browser mendeteksi `/manifest.webmanifest` dan `/sw.js` pada scope `/`.

---

## 2. Cara Instalasi di Android (Google Chrome)

1. Buka browser **Google Chrome** di perangkat Android.
2. Akses URL aplikasi POS (contoh: `https://<domain-pos>/` atau `https://localhost:3000`).
3. Tunggu halaman selesai dimuat.
4. **Metode Otomatis**:
   - Jika banner/dialog *"Tambahkan POS App ke Layar Utama"* muncul di bawah layar, ketuk tombol **Tambahkan / Install**.
5. **Metode Manual**:
   - Ketuk menu **tiga titik (⋮)** di pojok kanan atas browser.
   - Pilih menu **"Tambahkan ke Layar Utama" (Add to Home screen)** atau **"Instal aplikasi" (Install app)**.
   - Konfirmasi dialog instalasi.
6. Icon **POS App** akan muncul di app drawer dan layar utama ponsel.
7. Saat dibuka, aplikasi akan langsung berjalan dalam mode **Standalone** (layar penuh tanpa address bar browser) dan membuka `/dashboard/sales`.

---

## 3. Cara Instalasi di iOS / iPadOS (Apple Safari)

> [!NOTE]
> Apple iOS mewajibkan instalasi PWA melalui browser bawaan **Safari** menggunakan fitur **Add to Home Screen**.

1. Buka browser **Safari** di iPhone atau iPad.
2. Akses URL aplikasi POS.
3. Ketuk tombol **Share** (ikon kotak dengan panah ke atas) di bilah navigasi bawah Safari.
4. Gulir ke bawah pada lembar menu berbagi dan pilih **"Add to Home Screen" (Tambahkan ke Layar Utama)**.
5. Nama aplikasi akan terbaca otomatis sebagai **POS App** beserta icon toko.
6. Ketuk **Add (Tambah)** di pojok kanan atas.
7. Icon aplikasi akan terpasang di Home Screen iOS dan berjalan sebagai aplikasi mandiri (standalone web app).

---

## 4. Cara Instalasi di Desktop (Chrome / Edge / Brave)

1. Buka **Google Chrome** atau **Microsoft Edge** di PC / Laptop.
2. Kunjungi halaman aplikasi POS.
3. Di ujung kanan **Address Bar (Omnibox)**, akan muncul ikon **Install App** (ikon monitor kecil dengan panah bawah).
4. Klik ikon tersebut, lalu klik **Install**.
5. Aplikasi akan terbuka di jendela desktop mandiri (dedicated window) terpisah dari browser, lengkap dengan shortcut di Start Menu / Desktop.

---

## 5. Pengujian di Chrome DevTools (Testing & Verifikasi)

Untuk memverifikasi bahwa PWA memenuhi kriteria installable:

1. Buka Chrome DevTools (`F12` atau `Ctrl + Shift + I`).
2. Masuk ke tab **Application**.
3. Di panel sebelah kiri, periksa:
   - **Manifest**:
     - *Identity*: Name `POS App`, Short Name `POS`, Start URL `/dashboard/sales?source=pwa`.
     - *Presentation*: Display `standalone`, Orientation `portrait`.
     - *Colors*: Theme `#0f766e`, Background `#ffffff`.
     - *Icons*: Terdeteksi icon `192x192` dan `512x512` dengan purpose `any` dan `maskable`.
     - *Installability*: Tidak ada error blocking.
   - **Service Workers**:
     - Status `/sw.js` adalah **Activated and is running**.
4. Di bagian atas tab **Manifest**, klik link **"Install app"** untuk memicu prompt instalasi simulasi langsung di browser desktop.
