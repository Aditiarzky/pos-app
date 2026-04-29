Task Breakdown:

Task 1: Schema — tabel product_audit_logs + migration

- Objective: Definisikan tabel audit log di schema Drizzle dengan enum action dan index yang tepat
- Implementation:
  - Tambah productAuditAction enum: create | update | delete | hard_delete | restore | stock_adjustment
  - Tambah tabel productAuditLogs di src/drizzle/schema.ts dengan kolom di atas
  - Index: (product_id), (user_id), (created_at DESC)
  - product_id pakai ON DELETE SET NULL — agar log tetap ada meski produk hard-deleted
  - Export type di src/drizzle/type.ts
  - Buat src/drizzle/0004_product_audit_logs.sql

- Test: tsc --noEmit tidak ada error
- Demo: Schema compile, migration SQL siap dijalankan

Task 2: Helper diffProduct() dan recordProductAudit()

- Objective: Fungsi diff yang efisien (map by id, no deep compare) dan helper insert audit log
- Implementation:
  - Buat src/app/api/products/\_lib/audit.ts
  - diffProduct(before, after) → ChangeEntry[]:
    - Bandingkan field skalar: name, categoryId, minStock, isActive, image — strict equality !==
    - Variants: build Map<id, variant> dari before, loop after — bandingkan sellPrice per id; detect variant baru (id tidak ada di before map)
    - Barcodes: Set dari before barcodes, Set dari after barcodes — diff dengan set operations
    - Return array kosong jika tidak ada perubahan
  - recordProductAudit(tx, { productId, userId, action, changes, snapshot? }):
    - Skip insert jika action === 'update' dan changes.length === 0
    - Insert ke productAuditLogs
  - Label map Indonesia: { name: 'Nama Produk', categoryId: 'Kategori', minStock: 'Stok Minimum', isActive: 'Status Aktif', image: 'Gambar' }

- Test: Unit test di src/**tests**/lib/product-audit.test.ts:
  - diffProduct dengan tidak ada perubahan → []
  - diffProduct dengan harga variant berubah → 1 entry
  - diffProduct dengan barcode ditambah → 1 entry
  - diffProduct dengan beberapa field berubah → N entries

- Demo: Test lulus, helper siap dipanggil

Task 3: Integrasi ke semua route handler produk

- Objective: Setiap mutasi produk otomatis mencatat audit log
- Implementation:
  - POST /api/products (create): panggil recordProductAudit dengan action='create', changes=null setelah insert
  - PUT /api/products/[productId] (update): ambil before (product + variants + barcodes) sebelum update, hitung diff, panggil recordProductAudit di dalam transaction yang sama — userId dari verifySession()
  - DELETE /api/products/[productId] (soft delete): action='delete', changes=null
  - POST /api/trash/force-delete (hard delete, untuk produk): action='hard_delete', snapshot={name, sku, categoryId} — ambil data sebelum delete
  - POST /api/trash/restore (restore produk): action='restore', changes=null
  - PATCH /api/products/[productId] (stock adjustment): action='stock_adjustment', changes=[{field:'stock', label:'Stok', oldValue, newValue}]
  - Semua route handler sudah perlu verifySession() — tambahkan jika belum ada, return 401 jika tidak ada session

- Test: Hit setiap endpoint, verifikasi baris di product_audit_logs terisi dengan benar
- Demo: Setiap operasi produk menghasilkan audit log yang tepat; update tanpa perubahan tidak menghasilkan baris baru

Task 4: API GET /api/products/[productId]/audit-logs

- Objective: Endpoint history per produk, accessible oleh semua role yang login
- Implementation:
  - Buat src/app/api/products/[productId]/audit-logs/route.ts
  - verifySession() → 401 jika tidak ada session (semua role yang login boleh akses)
  - Query productAuditLogs WHERE productId = :id, ORDER BY createdAt DESC
  - Join ke users untuk name
  - Pagination: page, limit (default 20)
  - Response: { data: [...], meta: { page, limit, total, totalPages } }

- Test: 401 tanpa session; 200 dengan session valid; pagination berfungsi
- Demo: GET /api/products/1/audit-logs mengembalikan list dengan nama user, action, changes, timestamp

Task 5: API GET /api/products/audit-logs (global, admin sistem)

- Objective: Endpoint audit log lintas semua produk, hanya untuk admin sistem
- Implementation:
  - Buat src/app/api/products/audit-logs/route.ts
  - verifySession() → 401 jika tidak ada session; cek roles.includes('admin sistem') → 403 jika bukan
  - Support filter query params: productId, userId, action, dateFrom, dateTo, page, limit
  - Join ke products (ambil name, sku) dan users (ambil name)
  - Untuk baris hard_delete di mana productId null: tampilkan nama dari snapshot.name

- Test: 403 untuk admin toko; 200 untuk admin sistem; filter action=delete berfungsi
- Demo: Endpoint mengembalikan audit log global dengan semua filter berfungsi

Task 6: Komponen ProductAuditLogTab di detail produk

- Objective: Tab "Riwayat" di halaman detail produk untuk semua role
- Implementation:
  - Buat src/app/dashboard/products/\_components/product-audit-log-tab.tsx
  - Fetch dari endpoint Task 4 menggunakan React Query (useQuery)
  - Tampilkan setiap entry sebagai card/row: timestamp (format dd MMM yyyy HH:mm), nama user, action badge (warna berbeda per action), dan list diff
  - Format diff readable: untuk field harga → formatRupiah(oldValue) → formatRupiah(newValue); untuk field lain → "nilai lama" → "nilai baru"; untuk isActive → "Aktif" → "Nonaktif"
  - Jika changes null (create/delete/restore): tampilkan hanya action label
  - Integrasikan tab ke product-card.tsx — tambah tab "Riwayat" di samping tab yang sudah ada

- Test: Buka detail produk setelah melakukan edit → tab Riwayat menampilkan perubahan dengan format yang benar
- Demo: Tab "Riwayat" menampilkan history lengkap dengan diff terbaca, badge action berwarna, dan pagination

Task 7: Halaman global /dashboard/products/audit-log (admin sistem)

- Objective: Halaman khusus admin sistem untuk melihat semua perubahan produk
- Implementation:
  - Buat src/app/dashboard/products/audit-log/page.tsx
  - Wrap dengan RoleGuard (komponen yang sudah ada) untuk role admin sistem
  - Filter UI: search nama produk, dropdown action type, date range picker
  - Tabel kolom: Waktu, Produk (link ke detail), User, Action, Ringkasan perubahan (max 2 item diff, sisanya "+N lainnya")
  - Untuk hard-deleted product: tampilkan nama dari snapshot.name dengan badge "Dihapus Permanen"
  - Tambah link menu di src/components/app-sidebar.tsx di bawah section Produk, hanya tampil untuk admin sistem

- Test: Login admin toko → RoleGuard menampilkan AccessDenied; login admin sistem → halaman tampil dengan data
- Demo: Halaman /dashboard/products/audit-log menampilkan semua audit log, filter berfungsi, hanya bisa diakses admin sistem, link di sidebar muncul sesuai role
