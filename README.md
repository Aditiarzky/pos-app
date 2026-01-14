## 💡 Dokumentasi Teknis: Sistem Manajemen Pembelian & Akurasi HPP

### 1. Strategi Perhitungan Biaya (Costing Method)

Sistem ini menggunakan metode **Weighted Average Cost (WAC)** atau Rata-Rata Tertimbang yang dihitung secara _real-time_ setiap kali terjadi barang masuk (Purchase).

- **Base Unit Consistency**: Semua perhitungan dilakukan pada tingkat "Satuan Dasar" (misal: Gram, ml, atau Pcs) untuk menjamin akurasi meskipun pembelian dilakukan dengan varian satuan yang berbeda (misal: Dus, Pack, atau Kg).
- **Formula WAC**:

---

### 2. Struktur Data Utama (Database Schema)

Penyesuaian penting dilakukan pada tabel `purchase_items` untuk mendukung fitur _undo/edit_ yang akurat:

| Kolom         | Tipe Data | Deskripsi                                                                                |
| ------------- | --------- | ---------------------------------------------------------------------------------------- |
| `qty`         | Decimal   | Jumlah barang dalam satuan varian yang dipilih.                                          |
| `price`       | Decimal   | Harga beli per satu unit varian.                                                         |
| `cost_before` | Decimal   | **(Krusial)** Menyimpan nilai `averageCost` produk tepat sebelum transaksi ini diproses. |
| `subtotal`    | Decimal   | Hasil dari `qty * price`.                                                                |

---

### 3. Logika Update & Revisi (Integritas Data)

Untuk menjaga sinkronisasi stok dan nilai modal, sistem menggunakan strategi **"Revert & Re-apply"** di dalam satu transaksi database:

1. **Pengecekan Duplikat**: Sistem menolak input jika dalam satu PO terdapat `variantId` yang sama untuk menghindari ambiguitas data.
2. **Revert (Pembatalan Efek)**:

- Stok dikurangi berdasarkan jumlah yang pernah dibeli sebelumnya.
- `averageCost` produk dikembalikan (reset) ke nilai `cost_before`.

3. **Hapus Data Lama**: Data `purchase_items` dan `stock_mutations` lama dihapus berdasarkan ID PO.
4. **Re-apply (Penerapan Baru)**:

- Menghitung ulang HPP menggunakan nilai `cost_before` sebagai titik awal.
- Memasukkan data item baru dan mencatat mutasi stok yang baru.

---

### 4. Penjelasan Hasil Perhitungan (Studi Kasus)

Jika ditemukan angka desimal seperti **15,3333** pada `averageCost`, ini adalah penjelasan teknisnya:

- Angka tersebut mencerminkan nilai modal per **Base Unit**.
- Jika Base Unit adalah Kilogram dan konversi varian adalah 1000 (Gram), maka 15,3333 adalah harga per gram.
- Hal ini menjamin bahwa ketika barang dijual dalam satuan apa pun (eceran maupun grosir), margin keuntungan yang dihitung sistem akan tetap akurat hingga digit terkecil.

---

### 5. Validasi Guard Clauses

Sistem dilengkapi dengan pengaman (Guard Clauses) untuk mencegah kerusakan data:

- **Foreign Key Constraint**: Menjamin setiap item harus terhubung ke PO yang ada.
- **Variant Uniqueness**: Mencegah redundansi data produk yang sama dalam satu transaksi.
- **Database Transaction**: Menggunakan `db.transaction` untuk memastikan jika salah satu proses gagal, seluruh perubahan dibatalkan (Atomicity).
