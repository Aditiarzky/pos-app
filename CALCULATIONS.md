# Dokumentasi Rumus Perhitungan Sistem POS

Dokumen ini mencatat seluruh rumus perhitungan matematis yang digunakan dalam sistem POS Gunung Muria Grosir, beserta referensi akademis untuk setiap rumus.

---

## Daftar Isi

1. [Weighted Average Cost (WAC) — Valuasi Inventori](#1-weighted-average-cost-wac--valuasi-inventori)
2. [Reverse WAC (Revert & Re-apply)](#2-reverse-wac-revert--re-apply)
3. [Laba Kotor per Item (Gross Profit)](#3-laba-kotor-per-item-gross-profit)
4. [Laba Bersih (Net Profit)](#4-laba-bersih-net-profit)
5. [Normalisasi Periode (Pro-rata)](#5-normalisasi-periode-pro-rata)
6. [Perhitungan Pajak](#6-perhitungan-pajak)
7. [Total Transaksi Penjualan](#7-total-transaksi-penjualan)
8. [Nilai Retur & Refund Bersih](#8-nilai-retur--refund-bersih)
9. [Margin Varian Produk](#9-margin-varian-produk)
10. [Mutasi Saldo Pelanggan](#10-mutasi-saldo-pelanggan)
11. [Pembayaran Hutang (Debt Payment)](#11-pembayaran-hutang-debt-payment)
12. [Penyesuaian Stok Fisik](#12-penyesuaian-stok-fisik)
13. [Analisis Margin Laporan](#13-analisis-margin-laporan)
14. [Referensi Akademis](#14-referensi-akademis)

---

## 1. Weighted Average Cost (WAC) — Valuasi Inventori

### Deskripsi
Metode **Weighted Average Cost** (Rata-Rata Tertimbang) digunakan untuk menghitung Harga Pokok Penjualan (HPP) secara _real-time_ setiap kali terjadi pembelian barang masuk (inbound transaction). Sistem menggunakan pendekatan **Perpetual WAC** — rata-rata dihitung ulang setelah setiap transaksi pembelian, bukan secara periodik.

### Rumus

**Kasus umum (stok awal > 0):**

\[
\text{WAC}_{baru} = \frac{(S_{lama} \times \text{AC}_{lama}) + (Q_{baru} \times P_{base})}{S_{lama} + Q_{baru}}
\]

**Kasus pertama (stok awal = 0):**

\[
\text{WAC}_{baru} = P_{base}
\]

**Konversi unit:**

\[
Q_{base} = Q_{varian} \times \text{conversionToBase}
\]

\[
P_{base} = \frac{P_{varian}}{\text{conversionToBase}}
\]

### Variabel

| Variabel | Deskripsi |
|---|---|
| \(S_{lama}\) | Stok lama produk (base unit) sebelum pembelian |
| \(\text{AC}_{lama}\) | Average cost lama per base unit |
| \(Q_{baru}\) | Kuantitas pembelian dalam base unit |
| \(P_{base}\) | Harga beli per base unit |
| \(Q_{varian}\) | Kuantitas pembelian dalam satuan varian |
| \(P_{varian}\) | Harga beli per unit varian |
| \(\text{conversionToBase}\) | Faktor konversi varian ke satuan dasar |

### Sumber Kode
- `src/app/api/purchases/route.ts` — POST (pembelian baru)
- `src/app/api/purchases/[purchaseId]/route.ts` — PUT (edit, apply phase)

### Referensi
> Kieso, D. E., Weygandt, J. J., & Warfield, T. D. (2020). *Intermediate Accounting* (17th ed.). Wiley. Chapter 8: Valuation of Inventories — A Cost-Basis Approach. Section: Moving-Average Method.
>
> Corporate Finance Institute. (n.d.). *Weighted Average Cost Method*. Diakses dari https://corporatefinanceinstitute.com/resources/accounting/weighted-average-cost-method/

---

## 2. Reverse WAC (Revert & Re-apply)

### Deskripsi
Saat Purchase Order (PO) diedit atau diarsipkan, sistem melakukan **Reverse Weighted Average** — mengembalikan kondisi stok dan HPP ke titik sebelum PO tersebut dibuat, kemudian menerapkan ulang perhitungan baru. Strategi ini disebut **Revert & Re-apply**.

### Rumus

**Langkah 1 — REVERT (Kembalikan kondisi sebelum PO):**

\[
\text{Nilai Aset Saat Ini} = S_{sekarang} \times \text{AC}_{sekarang}
\]

\[
\text{Nilai Dihapus} = Q_{lama} \times P_{lama,base}
\]

\[
S_{revert} = S_{sekarang} - Q_{lama}
\]

\[
V_{revert} = \text{Nilai Aset Saat Ini} - \text{Nilai Dihapus}
\]

\[
\text{AC}_{revert} = \begin{cases}
\frac{V_{revert}}{S_{revert}} & \text{jika } S_{revert} > 0 \\
\text{costBefore} & \text{jika } S_{revert} \leq 0
\end{cases}
\]

**Langkah 2 — APPLY (Terapkan data baru):**
Sama persis dengan rumus WAC pada poin 1, namun menggunakan \(S_{revert}\) dan \(\text{AC}_{revert}\) sebagai titik awal.

### Variabel

| Variabel | Deskripsi |
|---|---|
| \(S_{sekarang}\) | Stok saat ini (setelah PO asli) |
| \(\text{AC}_{sekarang}\) | Average cost saat ini |
| \(Q_{lama}\) | Kuantitas item PO lama (base unit) |
| \(P_{lama,base}\) | Harga beli item PO lama per base unit |
| \(\text{costBefore}\) | Snapshot average cost sebelum PO asli dibuat (disimpan di `purchase_items.cost_before`) |
| \(S_{revert}\) | Stok setelah dikembalikan |
| \(\text{AC}_{revert}\) | Average cost setelah dikembalikan |

### Guard Clause
- Jika \(S_{revert} \leq 0\) (stok habis setelah revert), \(\text{AC}_{revert}\) dikembalikan ke `costBefore` — nilai HPP awal sebelum PO pertama.
- \(\text{AC}_{revert} < 0\) di-_clamp_ ke 0 (mencegah floating point error).

### Sumber Kode
- `src/app/api/purchases/[purchaseId]/route.ts` — PUT (edit), DELETE (arsip)

### Referensi
> Kieso et al. (2020). *Intermediate Accounting*. Chapter 8. Konsep reversal pada perpetual inventory system — saat terjadi koreksi transaksi, nilai aset dan rata-rata biaya harus dikembalikan ke kondisi pre-transaksi sebelum perhitungan ulang.
>
> Horngren, C. T., Datar, S. M., & Rajan, M. V. (2015). *Cost Accounting: A Managerial Emphasis* (15th ed.). Pearson. Chapter 9: Inventory Costing and Capacity Costs.

---

## 3. Laba Kotor per Item (Gross Profit)

### Deskripsi
Laba kotor dihitung per item penjualan sebagai selisih antara harga jual (revenue) dengan biaya pokok penjualan (COGS/HPP) pada saat transaksi. HPP dihitung berdasarkan WAC yang tersimpan pada field `costAtSale`.

### Rumus

**Per item:**

\[
\text{COGS}_i = \text{costAtSale}_i \times \text{qty}_i \times \text{unitFactor}_i
\]

\[
\text{GrossProfit}_i = \text{subtotal}_i - \text{COGS}_i
\]

**Agregat (total untuk suatu periode):**

\[
\text{TotalGrossProfit} = \sum_{i=1}^{n} \left( \text{subtotal}_i - (\text{costAtSale}_i \times \text{qty}_i \times \text{unitFactor}_i) \right)
\]

### Variabel

| Variabel | Deskripsi |
|---|---|
| \(\text{subtotal}_i\) | Nilai jual item \(i\) (qty × harga jual per unit varian) |
| \(\text{costAtSale}_i\) | WAC per base unit saat transaksi item \(i\) terjadi (snapshot) |
| \(\text{qty}_i\) | Kuantitas item \(i\) (satuan varian) |
| \(\text{unitFactor}_i\) | Faktor konversi varian → base unit saat transaksi |
| \(n\) | Jumlah total item dalam periode |

### Sumber Kode
- `src/app/api/reports/route.ts` — fungsi `getSalesGrossProfit()`
- `src/app/api/sales/route.ts` — saat insert `saleItems.costAtSale`

### Referensi
> Kieso et al. (2020). *Intermediate Accounting*. Chapter 8. Gross Profit = Net Sales − Cost of Goods Sold.
>
> Investopedia. (n.d.). *Cost of Goods Sold (COGS) Explained*. Diakses dari https://www.investopedia.com/terms/c/cogs.asp

---

## 4. Laba Bersih (Net Profit)

### Deskripsi
Laba bersih dihitung dari laba kotor setelah dikurangi seluruh biaya operasional dan pajak yang dinormalisasi ke periode laporan. Ini merupakan bottom line dari Laporan Laba Rugi (Profit & Loss / P&L).

### Rumus

\[
\text{Net Profit} = \text{Gross Profit} - \text{Total Biaya Operasional} - \text{Total Pajak}
\]

**Jumlah hari periode laporan:**

\[
\text{rangeDays} = \max\left(1, \left\lceil \frac{\text{endDate} - \text{startDate}}{86.400.000} \right\rceil + 1 \right)
\]

**Total Biaya Operasional:**

\[
\text{Total Biaya Operasional} = \sum_{j=1}^{C} \text{normalizeToRange}(\text{amount}_j, \text{period}_j, \text{rangeDays})
\]

**Total Pajak:**

\[
\text{Total Pajak} = \sum_{k=1}^{T} \text{taxAmount}_k
\]

### Variabel

| Variabel | Deskripsi |
|---|---|
| \(\text{Gross Profit}\) | Laba kotor agregat (lihat poin 3) |
| \(C\) | Jumlah biaya operasional aktif |
| \(T\) | Jumlah pajak aktif |
| \(\text{rangeDays}\) | Jumlah hari dalam periode laporan (minimal 1) |

### Sumber Kode
- `src/lib/net-profit-helper.ts` — fungsi `calculateNetProfit()`
- `src/app/api/reports/route.ts` — pemanggil `calculateNetProfit()`

### Referensi
> Weygandt, J. J., Kimmel, P. D., & Kieso, D. E. (2018). *Financial Accounting* (11th ed.). Wiley. Chapter 4: The Reporting Cycle — Income Statement. Net Income = Total Revenue − Total Expenses.
>
> SCIRP. (2021). *Operating Profit and Net Profit: Measurements of Profitability*. Journal of Mathematical Finance. https://www.scirp.org/journal/paperinformation?paperid=105860

---

## 5. Normalisasi Periode (Pro-rata)

### Deskripsi
Biaya operasional dan pajak yang memiliki periode berbeda (harian, mingguan, bulanan, tahunan, sekali) perlu **dinormalisasi** ke periode laporan menggunakan pendekatan pro-rata (proporsional berdasarkan jumlah hari).

### Rumus

\[
\text{normalizeToRange}(\text{amount}, \text{period}, \text{rangeDays}) = \text{amount} \times \text{factor}
\]

| Periode | Faktor |
|---|---|
| `daily` | \(\text{rangeDays} \times 1\) |
| `weekly` | \(\text{rangeDays} / 7\) |
| `monthly` | \(\text{rangeDays} / 30\) |
| `yearly` | \(\text{rangeDays} / 365\) |
| `one_time` | \(1\) (tidak dinormalisasi) |

### Contoh
Biaya listrik Rp 500.000/bulan, laporan 15 hari:
\[
\text{normalized} = 500.000 \times \frac{15}{30} = \text{Rp 250.000}
\]

### Sumber Kode
- `src/lib/net-profit-helper.ts` — fungsi `normalizeToRange()`
- `src/app/api/tax-configs/route.ts` — fungsi `normalizeTaxToRange()`

### Referensi
> Horngren et al. (2015). *Cost Accounting: A Managerial Emphasis*. Pearson. Chapter 2: An Introduction to Cost Terms and Purposes — Cost allocation dan pro-rata basis.
>
> Ontario Energy Board. (2005). *Cost Allocation Review*. Pro-rata expense allocation methodology. https://www.oeb.ca/documents/cases/EB-2005-0317/staffdiscussionpaper_160905.pdf

---

## 6. Perhitungan Pajak

### Deskripsi
Sistem mendukung dua jenis pajak: **persentase** (dari omset atau laba kotor) dan **nominal tetap** (fixed amount per periode yang dinormalisasi).

### Rumus

**Pajak Persentase:**

\[
\text{taxAmount} = \text{rate} \times \text{basis}
\]

\[
\text{basis} = \begin{cases}
\text{revenue} & \text{jika appliesTo} = \text{"revenue"} \\
\text{grossProfit} & \text{jika appliesTo} = \text{"gross\_profit"}
\end{cases}
\]

**Pajak Nominal Tetap:**

\[
\text{taxAmount} = \text{normalizeToRange}(\text{fixedAmount}, \text{period}, \text{rangeDays})
\]

### Contoh

- **PPh Final UMKM 0.5%** dari omset: \(\text{rate} \times \text{revenue}\)
- **PPN 11%** dari laba kotor: \(\text{rate} \times \text{grossProfit}\)
- **Retribusi Rp 50.000/bulan**: dinormalisasi ke periode laporan

### Sumber Kode
- `src/lib/net-profit-helper.ts` — perhitungan pajak dalam `calculateNetProfit()`
- `src/app/api/tax-configs/route.ts` — fungsi `calculateTotalTax()`

### Referensi
> Kieso et al. (2020). *Intermediate Accounting*. Chapter 13: Current Liabilities and Contingencies — Income tax estimation dan percentage-based obligations.
>
> PwC. (2023). *Revenue from Contracts with Customers* — Chapter 8.2: Rights of Return. Tax treatment on revenue vs. profit basis. https://viewpoint.pwc.com/dt/us/en/pwc/accounting_guides/revenue_from_contrac/revenue_from_contrac_US/

---

## 7. Total Transaksi Penjualan

### Deskripsi
Total transaksi dihitung dari penjumlahan subtotal setiap item (berdasarkan harga jual varian), dikurangi penggunaan saldo pelanggan, untuk menentukan jumlah yang harus dibayar.

### Rumus

**Subtotal per item:**

\[
\text{subtotal}_i = \text{qty}_i \times \text{sellPrice}_i
\]

**Grand total:**

\[
\text{grandTotal} = \sum_{i=1}^{n} \text{subtotal}_i
\]

**Net total (setelah saldo):**

\[
\text{netTotal} = \text{grandTotal} - \text{totalBalanceUsed}
\]

**Kembalian (tunai):**

\[
\text{change} = \text{paidAmount} - \text{netTotal}
\]

**Hutang (jika pembayaran kurang):**

\[
\text{debtAmount} = \text{netTotal} - \text{paidAmount}
\]

### Sumber Kode
- `src/app/api/sales/route.ts` — POST (transaksi baru)

### Referensi
> Kieso et al. (2020). *Intermediate Accounting*. Chapter 14: Revenue Recognition — Sales revenue = Quantity × Unit Selling Price.
>
> Weygandt et al. (2018). *Financial Accounting*. Chapter 5: Merchandising Operations — Net Sales = Sales Revenue − Sales Returns − Sales Discounts.

---

## 8. Nilai Retur & Refund Bersih

### Deskripsi
Perhitungan nilai retur mempertimbangkan barang yang dikembalikan customer, barang pengganti (exchange), dan menghitung selisih (net refund) sebagai dasar kompensasi.

### Rumus

**Nilai barang retur:**

\[
\text{totalValueReturned} = \sum_{i=1}^{n} (\text{qty}_i \times \text{priceAtSale}_i)
\]

**Nilai barang pengganti (exchange):**

\[
\text{totalValueExchange} = \sum_{j=1}^{m} (\text{qty}_j \times \text{sellPrice}_j)
\]

**Refund bersih (net refund):**

\[
\text{totalRefund} = \begin{cases}
\text{totalValueReturned} & \text{jika kompensasi = refund/credit\_note} \\
\text{totalValueReturned} - \text{totalValueExchange} & \text{jika kompensasi = exchange}
\end{cases}
\]

**Interpretasi totalRefund (exchange):**

| Kondisi | Arti |
|---|---|
| \(> 0\) | Ada sisa uang untuk customer (tunai atau saldo) |
| \(= 0\) | Impas, tidak ada transaksi keuangan tambahan |
| \(< 0\) | Customer harus bayar kekurangan |

**Restok (jika barang layak jual):**

\[
\text{stok}_{baru} = \text{stok}_{lama} + (\text{qty}_{return} \times \text{conversionToBase})
\]

### Sumber Kode
- `src/app/api/customer-returns/route.ts` — perhitungan & eksekusi kompensasi
- `src/app/dashboard/sales/_hooks/use-return-form.ts` — kalkulasi sisi client

### Referensi
> Kieso et al. (2020). *Intermediate Accounting*. Chapter 14. Revenue Recognition — Sales returns reduce revenue by the selling price of returned goods.
>
> ASC 606 (FASB). *Revenue from Contracts with Customers* — Rights of Return. A right of return entitles a customer to a full or partial refund. Refund liability = Expected returns × Selling price per unit.
>
> PwC. (2023). *Rights of Return — Revenue from Contracts*. https://viewpoint.pwc.com/dt/us/en/pwc/accounting_guides/revenue_from_contrac/revenue_from_contrac_US/chapter_8_practical__US/82rights_of_return_US.html

---

## 9. Margin Varian Produk

### Deskripsi
Analisis margin per varian digunakan untuk menilai profitabilitas produk. Margin dihitung dari selisih harga jual varian dengan HPP (berdasarkan WAC dan faktor konversi).

### Rumus

**HPP per unit varian:**

\[
\text{HPP} = \text{averageCost} \times \text{conversionToBase}
\]

**Margin (nominal):**

\[
\text{margin} = \text{sellPrice} - \text{HPP}
\]

**Margin (persentase):**

\[
\text{marginPercent} = \begin{cases}
\text{round}\left(\frac{\text{margin}}{\text{sellPrice}} \times 100\right) & \text{jika sellPrice} > 0 \\
0 & \text{jika sellPrice} = 0
\end{cases}
\]

**Profitabilitas:**

\[
\text{isProfitable} = \text{margin} > 0
\]

### Sumber Kode
- `src/lib/product-utils.ts` — fungsi `calculateVariantMargin()`

### Referensi
> Horngren et al. (2015). *Cost Accounting*. Pearson. Chapter 3: Cost-Volume-Profit Analysis — Contribution Margin = Selling Price − Variable Cost per Unit.
>
> Intuit. (n.d.). *How to Calculate Gross Margin*. https://www.intuit.com/enterprise/blog/financials/why-gross-margin-key-measuring-business-performance/

---

## 10. Mutasi Saldo Pelanggan

### Deskripsi
Saldo kredit pelanggan (credit balance) berubah saat customer menggunakan saldo untuk belanja atau menerima deposit dari retur. Setiap perubahan dicatat sebagai mutasi.

### Rumus

**Penggunaan saldo saat belanja (sale):**

\[
\text{balance}_{after} = \text{balance}_{before} - \text{totalBalanceUsed}
\]

**Deposit dari retur (credit note):**

\[
\text{balance}_{after} = \text{balance}_{before} + \text{totalRefund}
\]

**Deposit dari exchange surplus:**

\[
\text{balance}_{after} = \text{balance}_{before} + \text{exchangeSurplus}
\]

### Guard Clause
- \(\text{totalBalanceUsed}\) tidak boleh melebihi \(\text{grandTotal}\) belanja.
- \(\text{totalBalanceUsed}\) tidak boleh melebihi \(\text{creditBalance}\) customer.
- Credit note hanya bisa diproses untuk customer terdaftar (memiliki ID).

### Sumber Kode
- `src/app/api/sales/route.ts` — penggunaan saldo saat transaksi
- `src/app/api/customer-returns/route.ts` — deposit dari retur

### Referensi
> Kieso et al. (2020). *Intermediate Accounting*. Chapter 14. Revenue Recognition — Customer deposits and prepayments recorded as liability accounts.
>
> Weygandt et al. (2018). *Financial Accounting*. Chapter 8: Accounting for Receivables — Credit balance adjustments for customer accounts.

---

## 11. Pembayaran Hutang (Debt Payment)

### Deskripsi
Saat customer membayar hutang (secara mandiri atau otomatis dari kembalian transaksi), sistem mencatat pembayaran dan mengupdate status hutang.

### Rumus

**Update sisa hutang:**

\[
\text{remainingAmount}_{new} = \text{remainingAmount}_{old} - \text{payAmount}
\]

**Pembayaran otomatis dari surplus kembalian:**

\[
\text{payAmount} = \min(\text{remainingAmount}_{old}, \text{surplus})
\]

\[
\text{surplus}_{new} = \text{surplus}_{old} - \text{payAmount}
\]

**Status hutang:**

\[
\text{status} = \begin{cases}
\text{"paid"} & \text{jika remainingAmount}_{new} \leq 0 \\
\text{"partial"} & \text{jika remainingAmount}_{new} > 0
\end{cases}
\]

**Efek pada penjualan terkait (saat lunas):**

\[
\text{sales.status} = \text{"completed"} \quad \text{(jika saleId terkait tersedia)}
\]

### Sumber Kode
- `src/app/api/debts/_lib/debt-service.ts` — fungsi `processDebtPayment()`
- `src/app/api/sales/route.ts` — pembayaran hutang lama otomatis dari kembalian

### Referensi
> Kieso et al. (2020). *Intermediate Accounting*. Chapter 7: Cash and Receivables — Accounts receivable reduction upon partial/full payment. Allowance method for uncollectible accounts.
>
> Weygandt et al. (2018). *Financial Accounting*. Chapter 8: Accounting for Receivables — When a customer pays, Accounts Receivable decreases and Cash increases.

---

## 12. Penyesuaian Stok Fisik

### Deskripsi
Penyesuaian stok (stock adjustment/stock opname) membandingkan stok fisik aktual dengan stok sistem, dan mencatat selisih sebagai mutasi stok.

### Rumus

**Selisih stok:**

\[
\text{diff} = \text{actualStock} - \text{currentStock}
\]

**Update stok:**

\[
\text{stok}_{baru} = \text{actualStock}
\]

**Mutasi stok:**

\[
\text{stock\_mutation} = \begin{cases}
\text{insert (type: adjustment, qty positif)} & \text{jika diff} > 0 \text{ (bertambah)} \\
\text{insert (type: adjustment, qty negatif)} & \text{jika diff} < 0 \text{ (berkurang)} \\
\text{tidak ada mutasi} & \text{jika diff} = 0
\end{cases}
\]

### Peringatan Stok Rendah (Dashboard)
Produk dianggap stok rendah jika:

\[
\text{minStock} > 0 \quad \text{dan} \quad \text{stock} < \text{minStock}
\]

Diurutkan berdasarkan rasio:

\[
\text{ratio} = \frac{\text{stock}}{\text{minStock}} \quad \text{(ascending)}
\]

### Sumber Kode
- `src/app/api/stock-adjustments/route.ts` — POST (penyesuaian stok)
- `src/app/api/dashboard/route.ts` — peringatan stok rendah

### Referensi
> Horngren et al. (2015). *Cost Accounting*. Pearson. Chapter 9: Inventory Costing — Physical inventory counts vs. book inventory, adjustment entries for shrinkage/spoilage.
>
> AICPA. (n.d.). *Inventory Observation and Counting* — Stock opname methodology dan accounting for variances.

---

## 13. Analisis Margin Laporan

### Deskripsi
Dashboard laporan menampilkan analisis margin sebagai indikator kesehatan keuangan bisnis.

### Rumus

**Margin Laba Kotor (Gross Profit Margin):**

\[
\text{GrossMargin\%} = \frac{\text{GrossProfit}}{\text{TotalSales}} \times 100\%
\]

**Margin Laba Bersih (Net Profit Margin):**

\[
\text{NetMargin\%} = \frac{\text{NetProfit}}{\text{TotalSales}} \times 100\%
\]

**Perbandingan Periode (Period-over-Period):**

\[
\text{prevTotalSales} = \sum \text{sales.totalPrice} \quad (\text{periode sebelumnya})
\]

Periode sebelumnya dihitung dengan durasi yang sama (\(\text{duration} = \text{end} - \text{start}\)), ditarik mundur tepat sebelum \(\text{startDate}\).

### Sumber Kode
- `src/app/dashboard/report/_components/financial-section.tsx` — UI analisis margin
- `src/app/api/reports/route.ts` — data agregat & perbandingan periode

### Referensi
> Brigham, E. F., & Houston, J. F. (2019). *Fundamentals of Financial Management* (15th ed.). Cengage. Chapter 4: Analysis of Financial Statements — Profitability Ratios.
>
> Wall Street Prep. (n.d.). *Gross Margin Formula*. https://www.wallstreetprep.com/knowledge/gross-margin/

---

## 14. Referensi Akademis

Berikut ringkasan referensi utama yang digunakan dalam dokumentasi rumus ini:

### Buku Teks (Textbooks)

| # | Referensi | Topik Relevan |
|---|---|---|
| 1 | Kieso, D. E., Weygandt, J. J., & Warfield, T. D. (2020). *Intermediate Accounting* (17th ed.). Wiley. | WAC, COGS, Gross Profit, Revenue Recognition, Sales Returns, Receivables |
| 2 | Horngren, C. T., Datar, S. M., & Rajan, M. V. (2015). *Cost Accounting: A Managerial Emphasis* (15th ed.). Pearson. | Cost Allocation, Pro-rata, Inventory Costing, CVP Analysis |
| 3 | Weygandt, J. J., Kimmel, P. D., & Kieso, D. E. (2018). *Financial Accounting* (11th ed.). Wiley. | Income Statement, Net Sales, Receivables, Reporting Cycle |
| 4 | Brigham, E. F., & Houston, J. F. (2019). *Fundamentals of Financial Management* (15th ed.). Cengage. | Profitability Ratios, Margin Analysis |

### Standar Akuntansi

| # | Referensi | Topik Relevan |
|---|---|---|
| 5 | FASB ASC 606. *Revenue from Contracts with Customers* | Revenue Recognition, Rights of Return, Refund Liability |
| 6 | PwC Viewpoint. *Revenue from Contracts with Customers* — Chapter 8.2: Rights of Return | Sales returns accounting, refund obligations |

### Sumber Online

| # | Referensi | Topik Relevan |
|---|---|---|
| 7 | Corporate Finance Institute. *Weighted Average Cost Method* | WAC formula dan penerapan |
| 8 | Investopedia. *Cost of Goods Sold (COGS)* | COGS definition dan calculation |
| 9 | Wall Street Prep. *Gross Margin Formula* | Gross profit margin calculation |
| 10 | Intuit. *How to Calculate Gross Margin* | Gross margin key metrics |
| 11 | SCIRP. *Operating Profit and Net Profit: Measurements of Profitability* (2021) | Net profit measurement methodology |
| 12 | Ontario Energy Board. *Cost Allocation Review* (2005) | Pro-rata expense allocation |
