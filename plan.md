# Plan: Penghapusan Fitur Tempat Sampah (Trash) & Implementasi Hard Delete dengan Peringatan Relasi

## 1. Tujuan

Menghilangkan fitur "Tempat Sampah" (Soft Delete) agar sistem lebih sederhana dan tidak _over-engineered_. Mekanisme penghapusan akan diubah menjadi "Hard Delete" konvensional. Namun, untuk mencegah kecerobohan yang mengakibatkan hilangnya data penting, sistem akan memberikan **peringatan khusus (Warning)** saat akan menghapus Master Data, yang menampilkan **jumlah data berelasi** (misal: jumlah transaksi, produk yang menggunakan kategori tersebut) yang terhubung atau akan ikut terhapus (jika _cascade_).

## 2. Ruang Lingkup Perubahan

### A. Backend (Tingkat Database & API)

1. **Pembersihan Schema Database**
   - Meninjau kembali `drizzle/schema.ts` dan menghapus logic Soft Delete (misalnya keberadaan kolom seperti `deletedAt`) pada entitas master data (Users, Categories, Units, Suppliers, Customers, Products, dll).
2. **Penghapusan Fitur Trash**
   - Menghapus keseluruhan servis Tempat Sampah (contoh: `trashService.ts`, controller/route API yang membawahi fungsi restore, empty trash, dan list trash).
3. **Pembaruan Logika Delete & Pengecekan Relasi**
   - Mengubah API hapus utama (seperti `DELETE /:entity/:id`) agar menjalankan Hard Delete (langsung hapus row dari tabel).
   - **Pembuatan Pre-flight Check Endpoint (Dependency Check)**: Sistem perlu Endpoint khusus, misalnya `GET /:entity/:id/relations-check`, yang bertugas mengkalkulasi (COUNT) jumlah relasi yang terkait dengan ID data yang ingin dihapus.
   - (Alternatif: Cek relasi disertakan di Endpoint GET single item jika lebih efisien).

### B. Frontend (UI & Integrasi)

1. **Penghapusan Halaman & Navigasi Trash**
   - Menghapus komponen halaman untuk menu "Tempat Sampah" (misalnya `src/app/dashboard/trash`).
   - Menghilangkan _link_ navigasi menuju halaman tersebut dari menu samping (Sidebar).
2. **Perombakan Dialog Konfirmasi Hapus (Delete Confirmation Modal)**
   - Saat admin menekan tombol "Hapus" pada Master Data (misal Supplier), jangan langsung dieksekusi. Tampilkan _Dialog_.
   - Begitu dialog ini terbuka (render), jalankan API untuk mengecek relasi. Tampilkan _loading stat_ selama mengecek.
   - **Isi Dialog Dinamis**:
     - _Jika tidak ada relasi_: Tampilkan kalimat _'Apakah Anda yakin ingin menghapus [Nama Item]?'_
     - _Jika ada relasi_: Tampilkan peringatan destruktif. Contoh: _'PERHATIAN: Master data ini berkait dengan [5] Produk dan [12] Transaksi Pembelian. Melanjutkan penghapusan ini akan menghapus data tersebut secara permanen. Apakah Anda benar-benar yakin?'_
   - Jika jumlah relasinya masif (atau menyangkut transaksi), pertimbangkan menambahkan _Constraint_ konfirmasi ketik (misal mengetikkan tulisan "HAPUS" atau semacamnya) agar tidak mudah tidak disengaja.
3. **Penyeragaman Aksi Hapus**
   - Pastikan _action menu_ pada tabel/list dan halaman detail mengarahkan _trigger_ ke komponen modal relasi yang baru ini.

## 3. Prioritas & Langkah Implementasi

1. **Fase 1: Cleanup Schema & Trash Code**
   - Hapus properti soft-delete `deletedAt`. Buat migrasi db baru.
   - Hapus service dan route untuk Trash. Hapus UI folder `dashboard/trash`.
2. **Fase 2: Helper Cek Relasi Backend**
   - Buat fungsi query agregat di backend (`COUNT()`) untuk tiap entitas master:
     - **Category**: hitung jumlah _Products_ terkait.
     - **Supplier**: hitung _Purchase Orders_ dan _Supplier Returns_ terkait.
     - **Customer**: hitung _Sales_ dan _Customer Returns_ terkait.
     - **Product**: hitung _Product Variants_, _Purchase Items_, _Sale Items_, _Returns_.
     - **User**: hitung _Sales / Purchases_ yang di-handle (Atau _set null_ jika user dihapus).
3. **Fase 3: Reusable Delete Modal**
   - Bangun atau refaktor _UI Component_ (missal: `RelationAwareDeleteDialog`) yang menerima props _endpoint pengecekan_, lalu merender peringatan yang sesuai. Integrasikan secara luas ke semua tabel Master Data.
4. **Fase 4: Testing & Deployment**
   - Uji semua _hard delete_ satu per satu menggunakan UI dan konfirmasikan data anak (cascade) terhapus di database (atau ada constraint restrict sesuai rancangan schema final).

## 4. Validasi Utama

1. Memastikan **penghitungan relasi akurat** sebelum aksi penghapusan dieksekusi.
2. Memastikan user mendapat peringatan visual (warna merah, tanda seru).
3. Mengecek `schema.ts` apakah relasi Drizzle ditandai `{ onDelete: "cascade" }` atau justru `"restrict"`. Rencana ini lebih cocok apabila status dari cascade dapat memberitahukan ke user dengan jelas. Kalau `"set null"`, UX harus disesuaikan.
