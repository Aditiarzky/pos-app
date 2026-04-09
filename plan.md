# Rencana Implementasi - Overhaul UX Form Produk (Satuan Jual)

Berdasarkan keluhan yang ada, banyak pengguna awam yang bingung dengan istilah "Variant" dan sistem hitung konversi ke satuan terkecil. Kita akan melakukan perombakan UI/UX pada form produk agar lebih ramah pengguna.

## Rencana Perubahan (Proposed Changes)

### 1. Perubahan Istilah (Terminology)
Istilah "Variant" akan diganti sepenuhnya karena sering disalahartikan sebagai "rasa" atau "warna".
- **Tab Variants** ➔ **Satuan & Harga**
- **Nama Variant** ➔ Dihilangkan dari input manual secara visual. Nama akan **otomatis mengambil nama Satuan** (misal: jika pilih satuan "Dus", namanya otomatis "Dus"). Kita bisa menyediakannya sebagai opsi lanjutan (Advanced Option) jika butuh nama unik "Pack Isi 10".
- **Tambah Variant** ➔ **Tambah Satuan Jual**

### 2. Auto-Generate Satuan Terkecil
- Saat user mengisi **Satuan Terkecil** di Tab "Informasi", Tab "Satuan & Harga" akan otomatis memiliki satu baris pertama yang terkunci khusus untuk Satuan Terkecil tersebut.
- Baris pertama ini nilai konversinya otomatis `1` dan tidak bisa diubah.
- **Toggle "Dijual / Tidak Dijual"**: Karena terkadang satuan terkecil (contoh: Pcs) hanya untuk stok gudang dan tidak diecer/dijual. Akan disediakan *toggle* (saklar). Jika dimatikan, input harga akan non-aktif, dan saat disubmit, sistem mengabaikan satuan ini dari daftar jualan (`product_variants`), namun tetap menjadikannya acuan stok utama di database (`products`).

### 3. Logika Konversi Berantai (Chained Conversion)
- Saat ini user harus menghitung manual: 1 Dus = berapa Pcs.
- **UX Baru**: Input konversi akan berubah menjadi format bertingkat yang memilih satuan sebelumnya.
- **Contoh Flow**:
  1. *Satuan Pertama*: Pcs (Otomatis 1)
  2. *Satuan Ke-2*: User pilih "Pack". Input konversi: **1 Pack = [ X ] Pcs**.
  3. *Satuan Ke-3*: User pilih "Dus". Input konversi: **1 Dus = [ X ] Pilih Satuan Acuan: [Pack, Pcs]**.
  - Jika user menginput `1 Dus = 10 Pack` (sedangkan 1 Pack = 12 Pcs), maka di belakang layar (State/Form), sistem kita akan **otomatis** mengalikan (10 × 12). Hasilnya `120` akan dimasukkan ke `conversionToBase`. User tidak perlu memakai kalkulator!
  - UI akan selalu mengarahkan pengguna agar menginput dari kemasan terkecil (Pcs) -> sedang (Pack) -> terbesar (Dus).

### 4. Perbaikan Layout Kartu Satuan
- Pemilihan satuan, rasio konversi bertingkat, dan harga jual akan ditata letaknya agar alurnya mengalir secara kronologis: "Gunakan Satuan Ini" ➔ "Berapa Isinya?" ➔ "Berapa Harganya?".
- Menghapuskan istilah `conversionToBase` di level UI, ganti menjadi "Isi per [Satuan]".

## Next Steps
Rencana ini akan langsung diimplementasikan pada:
- `src/app/dashboard/products/_components/product-form/product-form-modal.tsx`
- `src/app/dashboard/products/_components/product-form/tabs/variants-tab.tsx`
- `src/app/dashboard/products/_components/variant-card.tsx`
- Hook terkait form handling (`use-product-form.ts`).
