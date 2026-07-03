# Plan: Simpan `conversionReferenceVariantId` untuk Akurasi Tampilan Form Edit

## Latar Belakang Masalah

Pada form variant jual, user bisa mengisi **konversi relatif** terhadap variant lain
(bukan hanya terhadap satuan dasar). Contoh:

```
Satuan Dasar: Gram (1)
Variant 1:    Pack   → referenceUnitId = 0 (Gram), conversionValue = 500   → conversionToBase = 500
Variant 2:    Karton → referenceUnitId = 1 (Pack), conversionValue = 24    → conversionToBase = 500 × 24 = 12.000
```

Yang disimpan ke DB (`product_variants.conversion_to_base`) hanya **nilai akhir ke
satuan dasar** (misal `12000`). Nilai `referenceUnitId` dan `conversionValue` adalah
**state form sementara** yang tidak pernah dipersist.

Akibatnya saat **edit produk**, fungsi `mapProductToForm` tidak tahu acuan konversi
aslinya, sehingga selalu me-render:

```
conversionValue    = conversionToBase  (12000)
referenceUnitId    = 0 (Satuan Dasar)
```

Padahal inputan asli user adalah `conversionValue = 24` dengan acuan `Pack`.
Ini membingungkan dan berpotensi menyebabkan user salah mengedit nilai konversi.

---

## Solusi: Kolom `conversion_reference_variant_id` di `product_variants`

Simpan **ID variant acuan** yang dipakai user saat input — bukan nilai konversinya —
ke tabel `product_variants`. Nilai `conversion_to_base` tetap disimpan sebagai **nilai
final ke satuan dasar** (tidak berubah), sehingga **seluruh logika perhitungan HPP,
stok, dan WAC tidak terpengaruh sama sekali**.

Saat form edit di-load, kita reconstruct `conversionValue` dengan rumus:

```
conversionValue = conversionToBase(variant ini) / conversionToBase(reference variant)
```

---

## Perubahan yang Diperlukan

### 1. Database Schema — `src/drizzle/schema.ts`

Tambahkan kolom baru di tabel `productVariants`:

```ts
// Menyimpan ID variant yang dijadikan acuan konversi saat input.
// Null berarti acuan adalah satuan dasar (konversi langsung).
// Nilai conversionToBase TETAP dihitung ke satuan dasar — kolom ini
// hanya untuk mereproduksi tampilan form edit.
conversionReferenceVariantId: p
  .integer("conversion_reference_variant_id")
  .references(() => productVariants.id, { onDelete: "set null" }),
```

> Kolom ini **nullable** dan menggunakan `onDelete: "set null"` agar jika variant acuan
> dihapus, data tidak rusak — form edit cukup fallback ke satuan dasar.

### 2. Migration SQL

Buat migration baru (file `src/drizzle/0005_variant_conversion_reference.sql`):

```sql
ALTER TABLE "product_variants"
ADD COLUMN "conversion_reference_variant_id" integer
REFERENCES "product_variants"("id") ON DELETE SET NULL;
```

### 3. API — Endpoint Create & Update Product

**File:** `src/app/api/products/route.ts` (atau handler terkait)

Pada proses **insert/update variant**, pastikan:
- Payload dari form menyertakan `conversionReferenceVariantId` (ID variant acuan).
- ID ini **ditulis langsung** ke kolom baru tanpa mempengaruhi `conversionToBase`.

Catatan penting pada **insert**: variant belum punya ID sebelum disimpan. Urutan insert:
1. Insert semua variant **tanpa** `conversionReferenceVariantId` terlebih dahulu.
2. Setelah semua variant tersimpan dan punya ID, **update** kolom
   `conversionReferenceVariantId` berdasarkan mapping posisi array → ID yang baru
   di-insert.

Alternatif lebih sederhana: karena posisi variant dalam array sudah diurutkan
(index 0 = base, index 1, 2, … = non-base), kita bisa insert secara sequential
dan track ID per-index dalam satu transaksi.

### 4. Form State — `variants-tab.tsx` & `use-product-form.ts`

Tidak ada perubahan signifikan pada logika kalkulasi form. Perubahan hanya di:

**`_utils/product-form.utils.ts` — fungsi `mapProductToForm`:**

```ts
// SEBELUM (selalu pakai base)
nonBaseVariants.map((variant) => ({
  ...
  conversionValue: variant.conversionToBase,   // ← selalu nilai ke base
  referenceUnitId: product.baseUnitId,         // ← selalu variant dasar
}))

// SESUDAH (reconstruct dari reference variant)
nonBaseVariants.map((variant) => {
  const refVariant = variant.conversionReferenceVariantId
    ? product.variants.find(v => v.id === variant.conversionReferenceVariantId)
    : null;

  const refConversionToBase = refVariant
    ? Number(refVariant.conversionToBase)
    : 1;

  // Index acuan dalam array form (untuk referenceUnitId yg berbasis index)
  const refArrayIndex = refVariant
    ? product.variants.findIndex(v => v.id === refVariant.id)
    : 0;

  const reconstructedConversionValue =
    refConversionToBase > 0
      ? String(Number(variant.conversionToBase) / refConversionToBase)
      : variant.conversionToBase;

  return {
    id: variant.id,
    name: variant.name,
    sku: variant.sku,
    unitId: variant.unitId,
    conversionToBase: variant.conversionToBase,  // ← tetap nilai final
    conversionValue: reconstructedConversionValue, // ← reconstruct untuk tampilan
    referenceUnitId: refArrayIndex,              // ← index acuan dalam array
    sellPrice: variant.sellPrice,
    isActive: true,
  };
})
```

### 5. Validasi Schema — `src/lib/validations/product-variant.ts`

Tambahkan field opsional di Zod schema:

```ts
conversionReferenceVariantId: z.number().int().optional().nullable(),
```

### 6. Payload dari Form ke API

Di `use-product-form.ts` (fungsi `submitHandler`), pastikan setiap variant
menyertakan `conversionReferenceVariantId`. Nilai ini diambil dari:

```
variant.conversionReferenceVariantId = ID dari variants[referenceUnitId].id
```

Jika `variants[referenceUnitId].id` tidak ada (variant baru yang belum tersimpan),
set `null` — server akan resolve-nya setelah insert.

---

## Alur Data Lengkap

### Saat Tambah Produk Baru

```
User input: conversionValue=24, referenceUnitId=1 (index array Pack)
                                        ↓
Form calculates: conversionToBase = 24 × variants[1].conversionToBase = 24 × 500 = 12.000
                                        ↓
API payload:
  conversionToBase = 12.000        ← untuk perhitungan
  conversionReferenceVariantId = null  ← belum punya ID (new variant)
                                        ↓
Server insert variants → dapat ID → update conversionReferenceVariantId
  dengan ID variant Pack yang baru disimpan
```

### Saat Edit Produk

```
DB: conversionToBase = 12.000, conversionReferenceVariantId = <id Pack>
                                        ↓
mapProductToForm:
  refVariant = variants.find(id = <id Pack>)
  refConversionToBase = 500
  reconstructedConversionValue = 12.000 / 500 = 24
  referenceUnitId = index Pack dalam array
                                        ↓
Form tampil: conversionValue=24, acuan=Pack  ✓ (sama seperti waktu input)
```

---

## Yang TIDAK Berubah

- Nilai `conversion_to_base` di DB → tetap nilai final ke satuan dasar.
- Semua logika WAC / HPP / stok → tidak tersentuh sama sekali.
- Logika kalkulasi `conversionToBase` di form (`variants-tab.tsx`) → tidak berubah.
- Tampilan dan UX form → tidak berubah, hanya nilai awal yang lebih akurat saat edit.

---

## Urutan Implementasi

1. [ ] Tambah kolom `conversion_reference_variant_id` di `schema.ts`
2. [ ] Buat file migration SQL
3. [ ] Update Zod validation schema untuk variant
4. [ ] Update `mapProductToForm` di `product-form.utils.ts` untuk reconstruct nilai
5. [ ] Update API handler (create & update) untuk menerima dan menyimpan field baru
6. [ ] Update `submitHandler` di `use-product-form.ts` untuk resolve reference ID
7. [ ] Test: tambah produk dengan konversi berantai → edit → pastikan tampil sama
