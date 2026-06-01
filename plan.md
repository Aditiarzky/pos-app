# Plan: Penyesuaian Alur Transaksi & Penghapusan Aksi Hapus

## 1. Tujuan

Menghilangkan aksi hapus pada riwayat transaksi (baik Sales maupun Retur) demi menjaga integritas data sesuai prinsip database. Selain itu, mengubah flow penyimpanan transaksi dengan menambahkan skema status 'PENDING' pada tahap nota untuk meminimalisasi kesalahan (human error).

## 2. Ruang Lingkup Perubahan

### A. Penghapusan Aksi Hapus pada Riwayat Transaksi

1. **Frontend (UI/UX)**
   - Menghilangkan tombol/aksi "Hapus" pada halaman riwayat transaksi Penjualan (Sales).
   - Menghilangkan tombol/aksi "Hapus" pada halaman riwayat transaksi Retur (Return).
2. **Backend (API/Database)**
   - Menghapus endpoint API untuk _Delete/Soft Delete_ transaksi Sales dan Return.
   - Menghapus logika penghapusan _cascade_ yang menyertai delete (jika ada) karena data harus bersifat imutable (Write-Once-Read-Many untuk record historis).

### B. Perubahan Alur (Workflow) Transaksi (Sales & Retur)

1. **Fase Awal (Proses Transaksi)**
   - Saat kasir/user mengklik "Proses Transaksi", data dikirim ke backend dan langsung disimpan di database.
   - Status awal dari transaksi tersebut di-set menjadi `PENDING`.
2. **Fase Nota / Struk**
   - Setelah proses penyimpanan awal berhasil, tampilkan modal/halaman _Nota Pembayaran_ di layar.
   - Pada modal Nota ini, tambahkan dua aksi utama:
     - **"Tandai Transaksi Selesai"**: Menegaskan bahwa transaksi valid dan proses serah terima pembayaran/barang sudah benar.
     - **"Batalkan Transaksi"**: Membatalkan transaksi ini jika ternyata ada kesalahan atau pembeli membatalkan pesanan.
3. **Fase Akhir (Penyelesaian)**
   - Jika ditekan **"Tandai Transaksi Selesai"**, status transaksi di-update dari `PENDING` menjadi `COMPLETED`.
   - Jika ditekan **"BatalkanTransaksi"**, status transaksi di-update menjadi `CANCELLED`.
   - Logika penyesuaian stok (pemotongan stok) dan finansial perlu disinkronkan dengan status ini.
4. **Fase Penanganan Transaksi Tertunda (Pending di Daftar Riwayat)**
   - Jika pengguna menutup modal nota sebelum menentukan hasil akhir (status transaksi masih `PENDING`), maka transaksi tersebut tetap tercatat di sistem sebagai `PENDING`.
   - Pada halaman tabel Daftar/Riwayat Transaksi (List), harus disediakan mekanisme berupa opsi aksi (Action Menu) untuk menyelesaikannya secara manual: **"Tandai Selesai"** atau **"Batal"**.

## 3. Langkah Implementasi (Tugas)

### Backend (API & Schema)

- [ ] Ubah tipe atau enum status transaksi pada _Database Schema_ (misalnya Prisma schema) agar mengakomodasi status `PENDING`, `COMPLETED`, `CANCELLED`.
- [ ] Update operasi _Create Transaction_ (Ganti default status menjadi `PENDING`).
- [ ] Buat Endpoint/Service baru: _Update Transaction Status_ yang bisa mengubah PENDING menjadi COMPLETED atau CANCELLED, lengkap dengan penerapan logika stok (potong/kembalikan stok jika batal).
- [ ] Hapus/non-aktifkan endpoint yang melayani _DELETE_ transaksi.
- [ ] Lakukan penyesuaian yang sama untuk fungsi _Return_ (Retur).

### Frontend (UI & Integrasi)

- [ ] Hilangkan opsi "Delete" dari daftar transaksi tabel riwayat (Sales & Return).
- [ ] Ubah _flow_ Checkout: Begitu checkout ditekan -> submit backend -> terima response (status = PENDING).
- [ ] Ubah desain Nota (Receipt Component): tambahkan button **"Selesai"** (Warna Sukses/Primary) dan button **"Batal"** (Warna Merah/Destructive).
- [ ] Tambahkan pemanggilan API _Update Status_ pada kedua tombol tersebut. Saat diproses sukses, tutup atau perbarui display nota.
- [ ] Render badge status transaksi (`PENDING` - kuning/abu, `COMPLETED` - hijau, `CANCELLED` - merah) di halaman tabel riwayat agar jelas bagi admin.
- [ ] Tambahkan opsi aksi "Tandai Selesai" dan "Batal" pada _Action Menu_ di baris tabel riwayat (List) **KHUSUS** untuk data yang masih berstatus `PENDING`.

## 4. Validasi & Pengujian

1. **Integritas Stok & Laporan**: Pastikan transaksi `CANCELLED` atau `PENDING` tidak ikut terhitung secara salah dalam laporan pendapatan dan tidak membuat persediaan stok menjadi negatif.
2. **Keamanan Historis**: Transaksi yang sudah masuk (walau BATAL) tetap tersimpan sebagai `CANCELLED`. Sama sekali tidak ada record yang lenyap dari database.
3. **Lock Modals**: Pastikan saat status `PENDING`, pengguna tidak bisa sembarangan kabur dari popup struk sebelum menyelesaikan atau membatalkan secara eksplisit (atau jika mereka me-refresh browser, setidaknya riwayat mencatatnya sebagai `PENDING` - perlu dipikirkan fallback-nya).
