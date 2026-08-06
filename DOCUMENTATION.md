# 📘 Dokumentasi Teknis Sistem Point of Sale (POS) & Manajemen Toko

Dokumen ini berisi gambaran umum, arsitektur teknis, skema basis data, logika bisnis, serta panduan operasional dan deployment dari Sistem _Point of Sale_ (POS) dan Manajemen Toko Ritel Terintegrasi.

---

## 📄 Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Arsitektur & Teknologi Stack](#2-arsitektur--teknologi-stack)
3. [Struktur Folder & Proyek](#3-struktur-folder--proyek)
4. [Skema Basis Data (Database Schema)](#4-skema-basis-data-database-schema)
5. [Modul & Fitur Utama Sistem](#5-modul--fitur-utama-sistem)
6. [Logika Bisnis & Perhitungan Matematika](#6-logika-bisnis--perhitungan-matematika)
7. [Fitur Keamanan, Validasi & Guard Clauses](#7-fitur-keamanan-validasi--guard-clauses)
8. [Panduan Instalasi, Pengujian & Deployment](#8-panduan-instalasi-pengujian--deployment)

---

## 1. Ringkasan Eksekutif

Sistem **Point of Sale (POS) Terintegrasi** dirancang khusus untuk memenuhi kebutuhan operasional toko ritel berskala kecil hingga menengah. Sistem ini mengintegrasikan seluruh rantai kegiatan toko—mulai dari manajemen produk varian multi-satuan, kalkulasi Harga Pokok Penjualan (HPP) berbasis _Weighted Average Cost_ (WAC), kasir transaksi cepat (Tunai & QRIS), manajemen piutang pelanggan, retur & tukar barang, pencatatan biaya operasional, hingga kalkulasi Laba Rugi dan Pajak (PPh & Net Profit).

### Keunggulan Utama:

- **Presisi Modal (HPP WAC)**: Menghitung modal per satuan terkecil (_Base Unit_) secara _real-time_ saat terjadi barang masuk.
- **Fleksibilitas Varian & Multi-Satuan**: Mendukung produk dengan kemasan bertingkat (misal: Dus, Pack, Pcs, Gram) dengan konversi presisi desimal.
- **Kasir Cepat & Pemindai Barcode**: Mendukung scanner fisik barcode dengan pencarian presisi _exact match_ serta antarmuka ramah pengguna.
- **Manajemen Piutang & Retur Fleksibel**: Mendukung pelunasan piutang parsial/berjenjang dan kompensasi retur dalam bentuk _cash_, saldo kompensasi, atau tukar barang langsung.
- **Kalkulasi Laba Rugi Terstruktur**: Memisahkan Laba Kotor, Biaya Operasional Ter-normalisasi, Pajak Omset (PPh Final), _Earnings Before Tax_ (EBT), dan Pajak Laba Bersih.

---

## 2. Arsitektur & Teknologi Stack

Sistem dibangun menggunakan arsitektur modern berkinerja tinggi:

```
[ Frontend: React 19 / Next.js App Router ]
                │
                ▼
[ Service & Server Actions Layer ] ◄──► [ Drizzle ORM (Type-Safe Query) ]
                │                                    │
                ▼                                    ▼
[ TanStack Query / State ]               [ PostgreSQL Database (Neon/Local) ]
```

### Stack Teknologi:

- **Framework Core**: Next.js 15 / 16 (App Router) & React 19.
- **Bahasa Pemrograman**: TypeScript (End-to-End Type Safety).
- **ORM & Database**: Drizzle ORM dengan PostgreSQL (Mendukung Full-Text Search PostgreSQL `tsvector` & Index GIN).
- **Styling & UI Components**: Tailwind CSS v4, Radix UI Primitives, Lucide Icons, Tabler Icons, Vaul Drawer, Sonner Toast.
- **Form & Validation**: React Hook Form, Zod Schema Validation, `@hookform/resolvers`.
- **Data Visual & Table**: Recharts (Grafik Laporan), TanStack Table v8.
- **Barcode & Scanner**: `@yudiel/react-qr-scanner`, `html5-qrcode`, `react-barcode`, `qrcode.react`.
- **Pengujian (Testing)**: Vitest untuk unit test logic & perhitungan.
- **Build & Deployment**: Support Next.js Standard, Cloudflare Workers via Vinext & Wrangler, serta Docker Containerization.

---

## 3. Struktur Folder & Proyek

```
pos-app/
├── docs/                        # Dokumentasi Skripsi, DBML, UML, Manual & UAT Test
├── public/                      # Static Assets (Logo, Icons, PWA Manifest)
├── src/
│   ├── app/                     # App Router Routes & Pages
│   │   ├── (auth)/              # Halaman Login & Reset Password
│   │   ├── (dashboard)/         # Halaman Dashboard Administrasi & Operasional
│   │   │   ├── categories/      # Kelola Kategori
│   │   │   ├── customers/       # Kelola Pelanggan & Saldo
│   │   │   ├── debts/           # Kelola Piutang & Pelunasan
│   │   │   ├── operational-costs/ # Kelola Biaya Operasional
│   │   │   ├── products/        # Kelola Produk, Varian & Barcode
│   │   │   ├── purchases/       # Kelola Pembelian Supplier (PO)
│   │   │   ├── reports/         # Laporan Penjualan, Stok & Laba Rugi/Pajak
│   │   │   ├── returns/         # Kelola Retur Konsumen & Supplier
│   │   │   ├── sales/           # Kasir POS & Riwayat Transaksi
│   │   │   ├── stock/           # Stok Opname & Mutasi Stok
│   │   │   ├── suppliers/       # Kelola Data Supplier
│   │   │   ├── taxes/           # Kelola Konfigurasi Pajak
│   │   │   ├── users/           # Kelola Pengguna (Admin Toko / Admin Sistem)
│   │   │   └── page.tsx         # Dashboard Analytics Ringkasan
│   │   └── api/                 # Endpoints API (QRIS, Cloudinary Upload, Export)
│   ├── components/              # UI Components Reusable (Modals, Forms, Tables)
│   ├── contexts/                # React Contexts (AuthContext, UI State)
│   ├── drizzle/                 # Drizzle Schema, Migration Files & Relations
│   │   ├── schema.ts            # Definisi Tabel DB, Enum & Full-Text Search Index
│   │   └── relations.ts         # Relasi Drizzle ORM
│   ├── hooks/                   # Custom Hooks (useDebounce, useProducts, dsb)
│   ├── lib/                     # Utilities (Currency Formatter, Date Utils, Auth Helpers)
│   └── services/                # Business Logic Layer (Data Access & Calculations)
├── CALCULATIONS.md              # Rincian Formula Matematika Laporan & Pajak
├── README.md                    # Dokumentasi Teknis HPP & Pembelian
├── docker-compose.yml           # Konfigurasi Container Docker PostgreSQL
├── drizzle.config.ts            # Konfigurasi Drizzle Kit
├── next.config.ts               # Konfigurasi Next.js
├── package.json                 # Dependencies & Script Command
└── vite.config.ts / vitest.config.ts # Konfigurasi Runner Test Vitest
```

---

## 4. Skema Basis Data (Database Schema)

Skema database didesain dengan tingkat integritas data yang tinggi (ACID compliant):

### A. Tabel Utama & Fungsi

| Nama Tabel                | Deskripsi Ringkas                                                    | Kolom Kunci Utama                                                                                                                    |
| :------------------------ | :------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| `users`                   | Akun pengguna sistem (Admin Toko & Admin Sistem).                    | `id`, `email`, `password`, `is_active`, `deleted_at`                                                                                 |
| `user_roles`              | Role pengguna (RBAC).                                                | `user_id`, `role` (`admin toko`, `admin sistem`)                                                                                     |
| `categories`              | Kategori produk dagangan.                                            | `id`, `name`, `is_active`, `deleted_at`                                                                                              |
| `units`                   | Satuan pengukuran (Pcs, Kg, Gram, Pack, Dus).                        | `id`, `name`, `is_active`, `deleted_at`                                                                                              |
| `suppliers`               | Data pemasok barang.                                                 | `id`, `name`, `phone`, `address`, `deleted_at`                                                                                       |
| `customers`               | Data pelanggan & saldo kredit kompensasi retur.                      | `id`, `name`, `phone`, `credit_balance`                                                                                              |
| `products`                | Master produk (tingkat dasar). Menyimpan HPP WAC.                    | `id`, `sku`, `name`, `base_unit_id`, `average_cost`, `last_purchase_cost`, `stock`, `min_stock`                                      |
| `product_variants`        | Varian produk & konversi ke satuan dasar (_Base Unit_).              | `id`, `product_id`, `sku`, `unit_id`, `conversion_to_base`, `sell_price`                                                             |
| `product_barcodes`        | Barcode tambahan yang ditautkan ke varian/produk.                    | `id`, `product_id`, `barcode`                                                                                                        |
| `purchase_orders`         | Header transaksi pembelian dari supplier.                            | `id`, `order_number`, `supplier_id`, `total`, `user_id`                                                                              |
| `purchase_items`          | Rincian item yang dibeli & snapshot HPP terdahulu (`cost_before`).   | `id`, `purchase_id`, `product_id`, `variant_id`, `qty`, `price`, `cost_before`, `subtotal`                                           |
| `sales`                   | Header transaksi penjualan kasir (POS).                              | `id`, `invoice_number`, `customer_id`, `total_price`, `total_paid`, `total_return`, `total_balance_used`, `payment_method`, `status` |
| `sale_items`              | Rincian item terjual & snapshot `cost_at_sale` (HPP saat transaksi). | `id`, `sale_id`, `product_id`, `variant_id`, `qty`, `price_at_sale`, `unit_factor_at_sale`, `cost_at_sale`, `subtotal`               |
| `stock_mutations`         | Jurnal keluar-masuk stok barang di gudang.                           | `id`, `product_id`, `variant_id`, `type`, `qty_base_unit`, `reference`, `user_id`                                                    |
| `debts`                   | Catatan piutang transaksi pelanggan.                                 | `id`, `sale_id`, `customer_id`, `original_amount`, `remaining_amount`, `status`                                                      |
| `debt_payments`           | Riwayat pembayaran cicilan/pelunasan piutang.                        | `id`, `debt_id`, `amount_paid`, `payment_date`, `note`                                                                               |
| `customer_returns`        | Header transaksi pengembalian barang dari konsumen.                  | `id`, `return_number`, `sale_id`, `customer_id`, `total_value_returned`, `total_refund`, `compensation_type`, `surplus_strategy`     |
| `customer_return_items`   | Rincian item yang dikembalikan konsumen.                             | `id`, `return_id`, `product_id`, `variant_id`, `qty`, `price_at_return`, `returned_to_stock`                                         |
| `customer_exchange_items` | Rincian item pengganti jika retur berupa tukar barang.               | `id`, `return_id`, `product_id`, `variant_id`, `qty`, `price_at_exchange`                                                            |
| `operational_costs`       | Catatan pengeluaran biaya operasional toko.                          | `id`, `name`, `category`, `amount`, `period`, `effective_from`, `effective_to`                                                       |
| `tax_configs`             | Pengaturan persentase/nominal pajak toko.                            | `id`, `name`, `type`, `rate`, `fixed_amount`, `applies_to`, `period`, `effective_from`                                               |
| `store_settings`          | Informasi profil & cetak struk toko.                                 | `id`, `store_name`, `address`, `phone`, `footer_message`, `receipt_note`                                                             |

> [!NOTE]
> Kolom `deleted_at` pada beberapa tabel merupakan kolom sisa skema versi sebelumnya. Fitur _soft delete_ dan halaman _Trash/Recycle Bin_ telah sepenuhnya ditiadakan dalam implementasi sistem saat ini; seluruh penghapusan data menggunakan mekanisme _hard delete_ yang dilindungi oleh pengaman relasi (_Relation-Aware Deletion Guards_).

---

## 5. Modul & Fitur Utama Sistem

### 1. Manajemen Hak Akses & User (RBAC)

- **Admin Sistem**: Memiliki kewenangan penuh termasuk manajemen user, konfigurasi pajak, dan pengaturan toko.
- **Admin Toko**: Berfokus pada operasional harian (Kasir Penjualan, Input Pembelian, Stok Opname, Retur).

### 2. Manajemen Produk & Multi-Satuan (Katalog)

- Setiap produk memiliki **Base Unit** (satuan terkecil, misal: Gram / Pcs).
- Setiap varian memiliki **Konversi Ke Base Unit** (misal: 1 Dus = 24 Pcs, 1 Pack = 6 Pcs).
- Pencarian produk mendukung **Full-Text Search (FTS)** dan pemindai **Barcode Physics Scanner**.

### 3. Pengadaan (Purchase Order) & Kalkulasi HPP WAC

- Pencatatan barang masuk dari supplier secara otomatis menambah jumlah stok pada _Base Unit_.
- Menghitung ulang `average_cost` (HPP) secara otomatis menggunakan metode **Weighted Average Cost**.
- Mendukung fitur **Revisi Purchase Order** tanpa merusak integritas HPP historis menggunakan pola _Revert & Re-apply_.

### 4. Kasir Penjualan (POS Interface)

- Antarmuka transaksi kasir yang responsif & cepat.
- Mendukung metode pembayaran **Tunai (Cash)** dan **QRIS** (Integrasi antrean pembayaran & QR Code).
- Mengizinkan penggunaan **Saldo Kredit Pelanggan** (dari kompensasi retur sebelumnya).
- Validasi otomatis ketersediaan stok fisik sebelum transaksi diproses.

### 5. Manajemen Piutang (Debts)

- Transaksi Penjualan yang belum lunas otomatis masuk ke modul Piutang.
- Mendukung pelunasan parsial (cicilan) atau pelunasan langsung.
- Fitur otomatisasi pelunasan piutang menggunakan sisa uang kembalian transaksi pelanggan selanjutnya.

### 6. Manajemen Retur Konsumen & Supplier

- Validasi retur berbasis Nomor Nota Penjualan / Pembelian.
- **Opsi Kompensasi Retur**:
  1. _Refund_ Tunai.
  2. Tambah Saldo Kredit Pelanggan (_Credit Note_).
  3. Tukar Barang (_Exchange Item_).
- Opsi untuk mengembalikan barang layak jual kembali ke stok (_returned_to_stock = true_) atau dianggap rusak (_written off_).

### 7. Biaya Operasional & Pelaporan Laba Rugi / Pajak

- Pencatatan biaya operasional berkala (Harian, Mingguan, Bulanan, Tahunan, One-Time).
- Normalisasi biaya otomatis sesuai rentang tanggal laporan yang dipilih.
- Kalkulasi otomatis Pajak Omset (misal PPh Final 0.5%) dan Pajak Laba Bersih (misal 10% EBT).

---

## 6. Logika Bisnis & Perhitungan Matematika

### A. Rumus Weighted Average Cost (WAC) untuk HPP

Setiap kali terjadi transaksi Pembelian (Purchase) baru:

$$\text{Stock}_{\text{baru}} = \text{Stock}_{\text{lama}} + \text{Qty}_{\text{beli\_base}}$$

$$\text{AverageCost}_{\text{baru}} = \frac{(\text{Stock}_{\text{lama}} \times \text{AverageCost}_{\text{lama}}) + (\text{Qty}_{\text{beli\_base}} \times \text{Price}_{\text{beli\_base}})}{\text{Stock}_{\text{baru}}}$$

_(Seluruh perhitungan dilakukan pada tingkat Satuan Terkecil/Base Unit)._

---

### B. Rumus Revert & Re-apply saat Revisi Pembelian

Jika Purchase Order direvisi:

1. **Revert**:
   - `stock` dikurangi dengan `qty` lama.
   - `average_cost` dikembalikan ke nilai `cost_before` yang disimpan pada `purchase_items`.
2. **Re-apply**:
   - Menghitung ulang `average_cost` menggunakan item baru dengan basis `cost_before`.

---

### C. Normalisasi Biaya Operasional dalam Laporan

Jika laporan ditarik untuk periode $N$ hari:

$$\text{Biaya}_{\text{daily}} = \text{Amount} \times N$$

$$\text{Biaya}_{\text{weekly}} = \text{Amount} \times \left(\frac{N}{7}\right)$$

$$\text{Biaya}_{\text{monthly}} = \text{Amount} \times \left(\frac{N}{30}\right)$$

$$\text{Biaya}_{\text{yearly}} = \text{Amount} \times \left(\frac{N}{365}\right)$$

$$\text{Biaya}_{\text{one\_time}} = \text{Amount} \quad (\text{penuh jika tanggal masuk rentang})$$

---

### D. Urutan Kalkulasi Laba Rugi dan Pajak

```
Pendapatan (Revenue)  = Total Penjualan Bersih
HPP (COGS)            = ∑ (Qty Terjual × Cost At Sale)
─────────────────────────────────────────────────────────────
Laba Kotor (Gross Profit) = Pendapatan − HPP

Pajak Omset (Revenue Tax) = ∑ (Revenue × Rate Pajak Omset)
Total Biaya Ops           = ∑ (Biaya Ops Ter-normalisasi)
Pajak Tetap (Fixed Tax)   = ∑ (Pajak Tetap Ter-normalisasi)
─────────────────────────────────────────────────────────────
Laba Sebelum Pajak (EBT)  = Laba Kotor − Total Biaya Ops − Pajak Omset − Pajak Tetap

Pajak Laba Bersih         = MAX(0, EBT × Rate Pajak Laba Bersih)
─────────────────────────────────────────────────────────────
Laba Bersih (Net Profit)  = EBT − Pajak Laba Bersih
```

---

## 7. Fitur Keamanan, Validasi & Guard Clauses

1. **Penerapan Direct Delete & Relation-Aware Guards**:
   - Fitur _soft delete_ dan halaman _trash/recycle bin_ telah sepenuhnya ditiadakan.
   - Penghapusan data (seperti Produk, Kategori, Supplier, Varian, atau User) dilakukan secara langsung (_hard delete_) dengan perlindungan pengaman relasi (_Relation-Aware Deletion_). Sistem akan menolak penghapusan data jika entitas tersebut terhubung dengan riwayat transaksi aktif (Penjualan, Pembelian, Retur, atau Mutasi Stok) untuk menjaga integritas data historis.
2. **Relation-Aware User Deletion**:
   - Sistem mencegah penghapusan akun pengguna jika pengguna tersebut telah mencatat transaksi penjualan, pembelian, atau mutasi stok untuk menjaga akuntabilitas log historis.
3. **Penyusutan Transaksi Database (ACID Transactions)**:
   - Penggunaan `db.transaction()` pada seluruh penulisan multi-tabel (Penjualan, Pembelian, Retur) memastikan jika satu langkah gagal, seluruh perubahan di-rollback secara otomatis.
4. **Validasi Scanner Barcode Presisi**:
   - Pencarian barcode fisik menggunakan _exact-match lookup_ (mencocokkan SKU varian & tabel barcode) untuk mencegah kesalahan item yang dimasukkan ke keranjang kasir.

---

## 8. Panduan Instalasi, Pengujian & Deployment

### A. Prasyarat Sistem

- Node.js versi 20.0 atau lebih baru.
- PostgreSQL Database Server (atau Neon Serverless PostgreSQL).
- NPM atau PNPM package manager.

---

### B. Langkah Instalasi Lokal

1. **Clone repository & masuk ke direktori proyek**:

   ```bash
   git clone <repository-url>
   cd pos-app
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables (`.env`)**:
   Buat file `.env` di root proyek dan isi parameter berikut:

   ```env
   DATABASE_URL="postgres://username:password@localhost:5432/pos_db"
   JWT_SECRET="your-super-secret-jwt-key"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Jalankan Migrasi Database**:

   ```bash
   npx drizzle-kit push
   ```

5. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses di `https://localhost:3000`.

---

### C. Pengujian (Testing)

Menjalankan pengujian otomatis untuk memverifikasi kalkulasi HPP dan logika bisnis:

```bash
npm run test
```

---

### D. Opsi Deployment

1. **Deployment Standard (Vercel / Node Server)**:

   ```bash
   npm run build
   npm run start
   ```

2. **Deployment Cloudflare Workers (via Vinext & Wrangler)**:

   ```bash
   npm run deploy:worker
   ```

3. **Deployment Docker Container**:
   ```bash
   docker-compose up -d --build
   ```

---

_Dokumentasi ini dibuat untuk menjadi acuan teknis utama pengembangan, pemeliharaan, dan operasional Sistem Point of Sale (POS)._
