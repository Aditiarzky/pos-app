# Dokumentasi Perhitungan Laporan dan Dashboard

Dokumen ini mencatat cara perhitungan metrik utama yang digunakan di halaman dashboard dan laporan, berangkat dari kueri SQL di `src/app/api/dashboard/route.ts` dan `src/app/api/reports/route.ts`.

## Catatan umum

- **Rentang tanggal** default adalah awal sampai akhir bulan berjalan (UTC) jika `startDate` / `endDate` tidak disertakan.
- **Perbandingan periode sebelumnya** dihitung dengan rentang waktu yang sama tapi ditarik mundur (`duration` yang sama, mulai tepat sebelum `startDate` saat ini).
- **Filter penjualan** selalu mengecualikan `sales.isArchived`, `sales.status` yang `cancelled` atau `refunded`.
- **Filter pembelian** mengecualikan `purchaseOrders.isArchived`.
- **Perhitungan laba bersih** berasal dari `saleItems.subtotal` dikurangi `costAtSale * qty * unitFactorAtSale` untuk tiap item yang bergabung dengan baris `sales` yang valid.
- **Omset** secara konsisten merujuk ke agregat `totalSales` (`SUM(sales.totalPrice)`) dan dipakai sebagai label utama untuk angka penjualan dalam UI.

## Dashboard

### Ringkasan bulanan

- `totalSalesMonth` (omset bulan berjalan): `SUM(sales.totalPrice)` untuk faktur yang valid dalam bulan berjalan.
- `prevTotalSalesMonth` (omset bulan sebelumnya): `SUM(sales.totalPrice)` untuk status yang sama dalam bulan sebelumnya.
- `totalProfitMonth` / `prevTotalProfitMonth`: agregasi `SUM(saleItems.subtotal - (saleItems.costAtSale * saleItems.qty * saleItems.unitFactorAtSale))` sesuai rentang bulan berjalan / sebelumnya.
- `totalTransactionsMonth` / `prevTotalTransactionsMonth`: `COUNT(*)` baris `sales` dengan filter yang sama.
- `totalActiveDebt`: `SUM(debts.remainingAmount)` untuk hutang aktif (`isActive = true`, `deletedAt` null, status bukan `paid`/`cancelled`).
- `prevTotalActiveDebt`: nilai serupa tetapi dibatasi pada hutang yang dibuat sepanjang bulan sebelumnya.

### Tren omset 30 hari

- Ambang waktu `now - 29 hari`, digroup per tanggal (`to_char(sales.createdAt, 'YYYY-MM-DD')`).
- `totalSales` (omset harian): `SUM(sales.totalPrice)` per tanggal, hanya untuk penjualan valid (tidak terarsip, bukan cancelled/refunded).

### Peringatan

- **Produk stok rendah**: produk aktif (`isActive = true`, `deletedAt` null) dengan `minStock > 0` dan `stock < minStock`, diurutkan berdasarkan rasio `stock / minStock` terkecil, dibatasi 5 baris.
- **Hutang belum lunas**: 10 hutang aktif terbaru yang masih memiliki `remainingAmount`, menampilkan usia dalam hari (`extract(day from now() - debts.createdAt)::int`).

## Laporan (`report` API)

### Overview (default)

- `totalSales` (omset periode): `SUM(sales.totalPrice)` dengan filter penjualan di atas.
- `totalPurchases`: `SUM(purchaseOrders.total)` untuk pembelian yang tidak diarsipkan dalam rentang waktu.
- `totalProfit`: formula laba bersih yang sama dari `saleItems`.
- `totalSalesTransactions` / `totalPurchaseTransactions`: `COUNT(*)` masing-masing tabel.
- `totalTransactions`: jumlah transaksi penjualan dan pembelian.
- Komparasi: `prevTotalSales`, `prevTotalPurchases`, `prevTotalProfit`, `prevTotalTransactions` adalah agregat dengan filter pada periode sebelumnya.
- `topProducts`: lima produk teratas berdasarkan jumlah `saleItems.qty` (descending), dengan `revenue = SUM(saleItems.subtotal)` untuk rentang waktu saat ini.
- `daily`: gabungan data harian omset dan pembelian berdasarkan tanggal (`to_char(...)`). Jika tanggal hanya muncul di salah satu sisi, sisi lainnya diisi nol agar data lengkap untuk visualisasi.

### Sales (type=sales)

- Ringkasan serupa dengan bagian overview, tapi terbatas pada omset (penjualan).
- `topProducts`: diurutkan sama seperti di overview, tetapi hanya menampilkan 10 produk.
- `daily`: `SUM(sales.totalPrice)` dan `COUNT(*)` per tanggal untuk omset penjualan saja.

### Purchase (type=purchase)

- `totalPurchases`: `SUM(purchaseOrders.total)` dengan filter rentang.
- `totalTransactions`: `COUNT(*)` transaksi pembelian.
- `daily`: agregasi harian `SUM(purchaseOrders.total)` dan `COUNT(*)`.
- `prevTotalPurchases` / `prevTotalTransactions`: agregat pembelian untuk periode sebelumnya.

## Catatan implementasi

- Semua angka agregat yang direturn oleh API di-pase ke `Number(...)` sebelum dikirim ke klien agar konsisten (lihat bagian akhir `GET` di masing-masing route).
- Perhitungan laba bersih diasumsikan sinkron dengan harga jual final (`saleItems.subtotal`) dikurangi seluruh biaya unit pada saat transaksi (`costAtSale * qty * unitFactorAtSale`).
