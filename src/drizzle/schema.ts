import { sql, SQL } from "drizzle-orm";
import * as p from "drizzle-orm/pg-core";

// Enum

export const stockMutationType = p.pgEnum("stock_mutation_type", [
  "purchase",
  "purchase_cancel",
  "sale",
  "sale_cancel",
  "return_restock",
  "return_cancel",
  "waste",
  "supplier_return",
  "adjustment",
  "exchange",
  "exchange_cancel",
]);

export const saleStatus = p.pgEnum("sale_status", [
  "pending_payment",
  "debt",
  "completed",
  "refunded",
  "cancelled",
]);

export const paymentMethod = p.pgEnum("payment_method", [
  "cash",
  "qris",
]);

export const debtStatusEnum = p.pgEnum("debt_status", [
  "unpaid",
  "partial",
  "paid",
  "cancelled",
]);

export const compensationType = p.pgEnum("compensation_type", [
  "exchange",
  "credit_note",
  "refund",
]);

export const surplusStrategyType = p.pgEnum("surplus_strategy_type", [
  "cash",
  "credit_balance",
]);

export const userRole = p.pgEnum("user_role", ["admin toko", "admin sistem"]);
export const passwordResetStatus = p.pgEnum("password_reset_status", [
  "pending",
  "completed",
  "rejected",
]);

// ── Enums untuk biaya operasional & pajak ─────────────────────────────────────

export const costPeriod = p.pgEnum("cost_period", [
  "daily", // harian  → dinormalisasi × jumlah hari
  "weekly", // mingguan → dinormalisasi × (jumlah hari / 7)
  "monthly", // bulanan  → dinormalisasi × (jumlah hari / 30)
  "yearly", // tahunan  → dinormalisasi × (jumlah hari / 365)
  "one_time", // sekali bayar → langsung masuk penuh ke periode yang dipilih
]);

export const costCategory = p.pgEnum("cost_category", [
  "utilities", // Listrik, Air, Internet
  "salary", // Gaji karyawan
  "rent", // Sewa tempat
  "logistics", // Ongkos kirim, bensin
  "marketing", // Iklan, promosi
  "maintenance", // Perbaikan, peralatan
  "other", // Lain-lain
]);

export const taxAppliesTo = p.pgEnum("tax_applies_to", [
  "revenue", // Dihitung dari omset (contoh: PPh Final 0.5% dari omset)
  "gross_profit", // Dihitung dari laba kotor (contoh: PPh Badan)
]);

export const taxType = p.pgEnum("tax_type", [
  "percentage", // % dari basis (revenue atau gross_profit)
  "fixed", // Nominal tetap per periode (bukan persentase)
]);

// ── Tables: biaya operasional & konfigurasi pajak ─────────────────────────────

/**
 * Tabel biaya operasional.
 *
 * Saat menghitung laba bersih untuk suatu rentang periode (misal: 1–31 Maret),
 * setiap biaya dinormalisasi ke jumlah hari pada periode tersebut.
 *
 * Rumus normalisasi per periode:
 *   daily    → amount × jumlahHari
 *   weekly   → amount × (jumlahHari / 7)
 *   monthly  → amount × (jumlahHari / 30)
 *   yearly   → amount × (jumlahHari / 365)
 *   one_time → amount (penuh, tanpa normalisasi)
 *
 * Contoh:
 *   Listrik Rp500.000/bulan → untuk periode 15 hari = 500.000 × (15/30) = Rp250.000
 */

// Table

export const storeSettings = p.pgTable("store_settings", {
  id: p.serial("id").primaryKey(),
  storeName: p.varchar("store_name", { length: 255 }).notNull().default("Nama Toko"),
  address: p.text("address").default("Alamat Lengkap Toko"),
  phone: p.varchar("phone", { length: 50 }).default("0812-xxxx-xxxx"),
  footerMessage: p.text("footer_message").default("Terima kasih telah berbelanja!"),
  receiptNote: p.text("receipt_note").default("Barang yang sudah dibeli tidak dapat ditukar."),
  logoUrl: p.text("logo_url"),
  updatedAt: p.timestamp("updated_at").defaultNow().notNull(),
});

export const operationalCosts = p.pgTable("operational_costs", {
  id: p.serial("id").primaryKey(),

  name: p.varchar("name", { length: 150 }).notNull(),
  // Contoh: "Listrik PLN", "Gaji Pak Budi", "Sewa Ruko"

  category: costCategory("category").notNull().default("other"),

  amount: p.decimal("amount", { precision: 14, scale: 2 }).notNull(),
  // Nominal biaya untuk satu periode (sesuai field `period`)

  period: costPeriod("period").notNull().default("monthly"),
  // Satuan periode dari `amount` di atas

  effectiveFrom: p.date("effective_from").notNull(),
  // Mulai berlaku. Biaya hanya dihitung jika periode laporan >= tanggal ini.

  effectiveTo: p.date("effective_to"),
  // Akhir berlaku (null = masih aktif sampai sekarang)

  isActive: p.boolean("is_active").default(true).notNull(),

  notes: p.text("notes"),
  // Keterangan bebas, misal: "Dibayar tiap tanggal 5"

  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),

  createdBy: p
    .integer("created_by")
    .references(() => users.id, { onDelete: "set null" }),
});

/**
 * Tabel konfigurasi pajak.
 *
 * Mendukung dua jenis pajak:
 * 1. percentage + applies_to=revenue     → PPh Final (0.5% dari omset)
 * 2. percentage + applies_to=gross_profit → PPh Badan (22% dari laba kotor)
 * 3. fixed (nominal tetap per periode)   → Pajak retribusi daerah, dll.
 *
 * Urutan kalkulasi laba bersih:
 *   Laba Kotor          = Pendapatan − HPP
 *   Total Biaya Ops     = sum(operationalCosts yang dinormalisasi)
 *   Pajak dari Omset    = sum(tax where applies_to=revenue, type=percentage) × Pendapatan
 *   Pajak dari Laba     = sum(tax where applies_to=gross_profit, type=percentage) × Laba Kotor
 *   Pajak Tetap         = sum(tax where type=fixed, dinormalisasi seperti biaya ops)
 *   Laba Bersih         = Laba Kotor − Total Biaya Ops − Semua Pajak
 */
export const taxConfigs = p.pgTable("tax_configs", {
  id: p.serial("id").primaryKey(),

  name: p.varchar("name", { length: 150 }).notNull(),
  // Contoh: "PPh Final UMKM", "PPN", "Retribusi Kebersihan"

  type: taxType("type").notNull().default("percentage"),

  rate: p.decimal("rate", { precision: 6, scale: 4 }),
  // Untuk type=percentage: nilai dalam desimal. Contoh: 0.005 = 0.5%, 0.11 = 11%
  // Untuk type=fixed: null (gunakan fixedAmount)

  fixedAmount: p.decimal("fixed_amount", { precision: 14, scale: 2 }),
  // Untuk type=fixed: nominal tetap. Contoh: 50000 = Rp50.000/bulan
  // Untuk type=percentage: null

  appliesTo: taxAppliesTo("applies_to"),
  // Untuk type=percentage: wajib diisi (revenue atau gross_profit)
  // Untuk type=fixed: null (langsung dipotong dari laba kotor)

  period: costPeriod("period").default("monthly"),
  // Hanya relevan untuk type=fixed (sama dengan normalisasi biaya ops)
  // Untuk type=percentage: diabaikan (langsung dihitung dari basis)

  effectiveFrom: p.date("effective_from").notNull(),
  effectiveTo: p.date("effective_to"),
  // null = masih berlaku

  isActive: p.boolean("is_active").default(true).notNull(),

  notes: p.text("notes"),
  // Contoh: "Sesuai PP No. 23 Tahun 2018 untuk omset < 4.8M/tahun"

  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),

  createdBy: p
    .integer("created_by")
    .references(() => users.id, { onDelete: "set null" }),
});

export const users = p.pgTable(
  "users",
  {
    id: p.serial("id").primaryKey(),
    email: p.text("email").notNull(),
    name: p.text("name").notNull(),
    password: p.text("password").notNull(),
    isActive: p.boolean("is_active").default(true),
    createdAt: p.timestamp("created_at").defaultNow(),
    updatedAt: p
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: p.timestamp("deleted_at"),
    searchVector: p
      .customType<{ data: string }>({
        dataType() {
          return "tsvector";
        },
      })("search_vector")
      .generatedAlwaysAs(
        (): SQL =>
          sql`to_tsvector('indonesian', ${users.name} || ' ' || ${users.email})`,
      ),
  },
  (t) => [
    p.uniqueIndex("users_email_key").on(t.email),
    p.index("users_search_idx").using("gin", t.searchVector),
  ],
);

export const passwordResetRequests = p.pgTable("password_reset_requests", {
  id: p.serial("id").primaryKey(),
  userId: p
    .integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  email: p.text("email").notNull(),
  status: passwordResetStatus("status").default("pending").notNull(),
  requestedAt: p.timestamp("requested_at").defaultNow().notNull(),
  resolvedAt: p.timestamp("resolved_at"),
  resolvedBy: p.integer("resolved_by").references(() => users.id),
});

export const refreshTokens = p.pgTable("refresh_tokens", {
  id: p.serial("id").primaryKey(),
  token: p.text("token").notNull().unique(),
  userId: p
    .integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: p.timestamp("expires_at").notNull(),
  createdAt: p.timestamp("created_at").defaultNow(),
});

export const userRoles = p.pgTable(
  "user_roles",
  {
    userId: p
      .integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: userRole("role").notNull(),
  },
  (t) => [p.primaryKey({ columns: [t.userId, t.role] })],
);

export const categories = p.pgTable("categories", {
  id: p.serial("id").primaryKey(),
  name: p.varchar("name", { length: 100 }).notNull(),
  isActive: p.boolean("is_active").default(true),
  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: p.timestamp("deleted_at"),
});

export const units = p.pgTable("units", {
  id: p.serial("id").primaryKey(),
  name: p.varchar("name", { length: 50 }).notNull(), // kg, pcs, peti, botol
  isActive: p.boolean("is_active").default(true),
  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: p.timestamp("deleted_at"),
});

export const suppliers = p.pgTable("suppliers", {
  id: p.serial("id").primaryKey(),
  name: p.varchar("name", { length: 120 }).notNull(),
  phone: p.varchar("phone", { length: 30 }),
  email: p.varchar("email", { length: 255 }),
  address: p.text("address"),
  description: p.text("description"),
  isActive: p.boolean("is_active").default(true),
  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: p.timestamp("deleted_at"),
});

export const customers = p.pgTable("customers", {
  id: p.serial("id").primaryKey(),
  name: p.varchar("name", { length: 150 }).notNull(),
  phone: p.varchar("phone", { length: 30 }),
  address: p.text("address"),
  creditBalance: p
    .decimal("credit_balance", { precision: 12, scale: 2 })
    .default("0"),
  isActive: p.boolean("is_active").default(true),
  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: p.timestamp("deleted_at"),
});

export const products = p.pgTable(
  "products",
  {
    id: p.serial("id").primaryKey(),

    categoryId: p
      .integer("category_id")
      .references(() => categories.id, { onDelete: "cascade" }),

    sku: p.varchar("sku", { length: 50 }).notNull().unique(),
    name: p.varchar("name", { length: 150 }).notNull(),
    image: p.text("image"),

    minStock: p.decimal("min_stock", { precision: 12, scale: 3 }).default("0"),
    stock: p.decimal("stock", { precision: 12, scale: 3 }).default("0"),

    baseUnitId: p
      .integer("base_unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    // dua field ini digunakan untuk menghitung harga pokok penjualan (hpp)
    averageCost: p.decimal("average_cost", { precision: 12, scale: 4 }), // Field ini mencatat rata-rata harga beli dari semua stok yang saat ini ada di gudang.
    lastPurchaseCost: p.decimal("last_purchase_cost", {
      precision: 12,
      scale: 4,
    }), // harga beli terakhir atau yang paling baru dari pembelian supplier
    // Contoh:
    // Beli 10 pcs seharga Rp1.000. (averageCost = 1.000)
    // Beli lagi 10 pcs seharga Rp1.200.
    // averageCost baru = (10.000 + 12.000) / 20 = Rp1.100.

    searchVector: p
      .customType<{ data: string }>({
        dataType() {
          return "tsvector";
        },
      })("search_vector")
      .generatedAlwaysAs(
        (): SQL =>
          sql`to_tsvector('indonesian', ${products.name} || ' ' || ${products.sku})`,
      ), //kolom ini untuk Full-Text Search

    createdAt: p.timestamp("created_at").defaultNow(),
    updatedAt: p
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    isActive: p.boolean("is_active").default(true),
    deletedAt: p.timestamp("deleted_at"),
  },
  (t) => [p.index("products_search_idx").using("gin", t.searchVector)],
);

export const productVariants = p.pgTable("product_variants", {
  id: p.serial("id").primaryKey(),

  productId: p
    .integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),

  name: p.varchar("name", { length: 100 }).notNull(),

  sku: p.varchar("sku", { length: 60 }).notNull().unique(),

  unitId: p
    .integer("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),

  conversionToBase: p
    .decimal("conversion_to_base", { precision: 12, scale: 4 })
    .notNull(), // 1 unit = x base unit

  sellPrice: p.decimal("sell_price", { precision: 12, scale: 2 }).notNull(),
  isActive: p.boolean("is_active").default(true),

  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: p.timestamp("deleted_at"),
});

export const productBarcodes = p.pgTable("product_barcodes", {
  id: p.serial("id").primaryKey(),
  productId: p
    .integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  barcode: p.varchar("barcode", { length: 100 }).notNull().unique(),
  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const purchaseOrders = p.pgTable("purchase_orders", {
  id: p.serial("id").primaryKey(),
  orderNumber: p.varchar("order_number", { length: 60 }).unique(),
  supplierId: p
    .integer("supplier_id")
    .references(() => suppliers.id, { onDelete: "cascade" })
    .notNull(),
  total: p.decimal("total", { precision: 12, scale: 2 }),
  isArchived: p.boolean("is_archived").default(false),
  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  userId: p
    .integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  deletedAt: p.timestamp("deleted_at"),
});

export const purchaseItems = p.pgTable("purchase_items", {
  id: p.serial("id").primaryKey(),

  purchaseId: p
    .integer("purchase_id")
    .references(() => purchaseOrders.id, { onDelete: "cascade" })
    .notNull(),

  productId: p
    .integer("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),

  variantId: p
    .integer("variant_id")
    .references(() => productVariants.id, { onDelete: "cascade" })
    .notNull(),

  qty: p.decimal("qty", { precision: 12, scale: 3 }).notNull(),

  price: p.decimal("price", { precision: 12, scale: 2 }).notNull(),

  unitFactorAtPurchase: p.decimal("unit_factor_at_purchase", {
    precision: 12,
    scale: 3,
  }),

  costBefore: p.decimal("cost_before", { precision: 12, scale: 4 }).notNull(),

  subtotal: p.decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
});

export const sales = p.pgTable("sales", {
  id: p.serial("id").primaryKey(),
  invoiceNumber: p.varchar("invoice_number", { length: 60 }).notNull().unique(),
  customerId: p.integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  totalPrice: p.decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  totalPaid: p.decimal("total_paid", { precision: 12, scale: 2 }).notNull(),
  totalReturn: p.decimal("total_return", { precision: 12, scale: 2 }).notNull(),
  totalBalanceUsed: p.decimal("total_balance_used", { precision: 12, scale: 2 }).notNull(),
  status: saleStatus("status").default("completed"),
  paymentMethod: paymentMethod("payment_method").notNull().default("cash"),
  isArchived: p.boolean("is_archived").default(false),
  qrisPaymentNumber: p.text("qris_payment_number"),
  qrisExpiredAt: p.timestamp("qris_expired_at"),
  qrisOrderId: p.varchar("qris_order_id", { length: 100 }),
  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p.timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()),
  userId: p.integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  deletedAt: p.timestamp("deleted_at"),
});

export const saleItems = p.pgTable("sale_items", {
  id: p.serial("id").primaryKey(),

  saleId: p
    .integer("sale_id")
    .references(() => sales.id, { onDelete: "cascade" })
    .notNull(),

  productId: p
    .integer("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),

  variantId: p
    .integer("variant_id")
    .references(() => productVariants.id, { onDelete: "cascade" })
    .notNull(),

  qty: p.decimal("qty", { precision: 12, scale: 3 }).notNull(),

  priceAtSale: p
    .decimal("price_at_sale", { precision: 12, scale: 2 })
    .notNull(), // harga jual saat transaksi terjadi

  unitFactorAtSale: p
    .decimal("unit_factor_at_sale", { precision: 12, scale: 3 })
    .notNull(), //konversi qty ke unit terkecil dari variant

  costAtSale: p.decimal("cost_at_sale", { precision: 12, scale: 4 }).notNull(), // Menyimpan averageCost produk SAAT transaksi terjadi.

  subtotal: p.decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
});

export const debts = p.pgTable("debts", {
  id: p.serial("id").primaryKey(),
  saleId: p
    .integer("sale_id")
    .references(() => sales.id, { onDelete: "cascade" })
    .notNull(),
  customerId: p
    .integer("customer_id")
    .references(() => customers.id, { onDelete: "cascade" })
    .notNull(),

  // Total hutang awal dari transaksi ini
  originalAmount: p
    .decimal("original_amount", { precision: 12, scale: 2 })
    .notNull(),
  // Sisa yang belum dibayar (akan diupdate setiap ada cicilan)
  remainingAmount: p
    .decimal("remaining_amount", { precision: 12, scale: 2 })
    .notNull(),

  status: debtStatusEnum("status").default("unpaid").notNull(),
  isActive: p.boolean("is_active").default(true).notNull(),
  deletedAt: p.timestamp("deleted_at"),
  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const debtPayments = p.pgTable("debt_payments", {
  id: p.serial("id").primaryKey(),
  debtId: p
    .integer("debt_id")
    .references(() => debts.id, { onDelete: "cascade" })
    .notNull(),
  amountPaid: p.decimal("amount_paid", { precision: 12, scale: 2 }).notNull(),
  paymentDate: p.timestamp("payment_date").defaultNow(),
  note: p.text("note"),
});

export const supplierReturns = p.pgTable(
  "supplier_returns",
  {
    id: p.serial("id").primaryKey(),
    supplierId: p
      .integer("supplier_id")
      .references(() => suppliers.id, { onDelete: "cascade" })
      .notNull(),
    purchaseId: p
      .integer("purchase_id")
      .references(() => purchaseOrders.id, { onDelete: "cascade" })
      .notNull(),
    productId: p
      .integer("product_id")
      .references(() => products.id, { onDelete: "cascade" }),
    qty: p.decimal("qty", { precision: 12, scale: 3 }).notNull(),
    reason: p.text("reason"),
    searchVector: p
      .customType<{ data: string }>({
        dataType() {
          return "tsvector";
        },
      })("search_vector")
      .generatedAlwaysAs(
        (): SQL =>
          sql`to_tsvector('indonesian', coalesce(${supplierReturns.supplierId}::text, '') || ' ' || coalesce(${supplierReturns.reason}, ''))`,
      ),
    createdAt: p.timestamp("created_at").defaultNow(),
    updatedAt: p
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    userId: p.integer("user_id").references(() => users.id),
  },
  (t) => [p.index("supplier_returns_search_idx").using("gin", t.searchVector)],
);

export const stockMutations = p.pgTable("stock_mutations", {
  id: p.serial("id").primaryKey(),

  productId: p
    .integer("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),

  variantId: p
    .integer("variant_id")
    .references(() => productVariants.id, { onDelete: "cascade" })
    .notNull(),

  type: stockMutationType("type").notNull(),

  qtyBaseUnit: p
    .decimal("qty_base_unit", { precision: 12, scale: 4 })
    .notNull(),

  unitFactorAtMutation: p.decimal("unit_factor_at_mutation", {
    precision: 12,
    scale: 3,
  }),

  reference: p.varchar("reference", { length: 100 }),

  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),

  userId: p
    .integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
});

export const customerReturns = p.pgTable("customer_returns", {
  id: p.serial("id").primaryKey(),

  returnNumber: p.varchar("return_number", { length: 60 }).notNull().unique(),

  saleId: p
    .integer("sale_id")
    .references(() => sales.id, { onDelete: "cascade" })
    .notNull(),
  customerId: p
    .integer("customer_id")
    .references(() => customers.id, { onDelete: "cascade" }),

  totalValueReturned: p.decimal("total_value_returned", {
    precision: 12,
    scale: 2,
  }),
  totalRefund: p.decimal("total_refund", { precision: 12, scale: 2 }).notNull(),

  compensationType: compensationType("compensation_type").notNull(),

  surplusStrategy: surplusStrategyType("surplus_strategy_type"),

  isArchived: p.boolean("is_archived").default(false),

  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),

  userId: p
    .integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  deletedAt: p.timestamp("deleted_at"),
});

export const customerReturnItems = p.pgTable("customer_return_items", {
  id: p.serial("id").primaryKey(),

  returnId: p
    .integer("return_id")
    .notNull()
    .references(() => customerReturns.id, { onDelete: "cascade" })
    .notNull(),

  productId: p
    .integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),

  variantId: p
    .integer("variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "cascade" })
    .notNull(),

  qty: p.decimal("qty", { precision: 12, scale: 3 }).notNull(),

  priceAtReturn: p
    .decimal("price_at_return", { precision: 12, scale: 2 })
    .notNull(),

  unitFactorAtReturn: p
    .decimal("unit_factor_at_return", { precision: 12, scale: 3 })
    .notNull(),
  reason: p.text("reason"),

  returnedToStock: p.boolean("returned_to_stock").default(false),

  isArchived: p.boolean("is_archived").default(false),
  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),

  userId: p
    .integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
});

export const customerExchangeItems = p.pgTable("customer_exchange_items", {
  id: p.serial("id").primaryKey(),

  returnId: p
    .integer("return_id")
    .notNull()
    .references(() => customerReturns.id, { onDelete: "cascade" })
    .notNull(),

  productId: p
    .integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),

  variantId: p
    .integer("variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "cascade" })
    .notNull(),

  qty: p.decimal("qty", { precision: 12, scale: 3 }).notNull(),

  priceAtExchange: p
    .decimal("price_at_exchange", { precision: 12, scale: 2 })
    .notNull(),

  unitFactorAtExchange: p
    .decimal("unit_factor_at_exchange", { precision: 12, scale: 3 })
    .notNull(),

  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const customerBalanceMutations = p.pgTable(
  "customer_balance_mutations",
  {
    id: p.serial("id").primaryKey(),
    customerId: p.integer("customer_id").notNull(),
    amount: p.decimal("amount", { precision: 15, scale: 2 }).notNull(),
    balanceBefore: p
      .decimal("balance_before", {
        precision: 15,
        scale: 2,
      })
      .notNull(),
    balanceAfter: p
      .decimal("balance_after", { precision: 15, scale: 2 })
      .notNull(),
    type: p.text("type").notNull(),
    referenceId: p.integer("reference_id"),
    referenceType: p.text("reference_type"),
    note: p.text("note"),
    createdAt: p.timestamp("created_at").defaultNow(),
    userId: p.integer("user_id"),
  },
);

export const notificationStates = p.pgTable(
  "notification_states",
  {
    id: p.serial("id").primaryKey(),
    userId: p
      .integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationId: p.varchar("notification_id", { length: 255 }).notNull(),
    readAt: p.timestamp("read_at"),
    dismissedAt: p.timestamp("dismissed_at"),
    createdAt: p.timestamp("created_at").defaultNow().notNull(),
    updatedAt: p
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (t) => [
    p.uniqueIndex("notification_states_user_notification_uidx").on(
      t.userId,
      t.notificationId,
    ),
    p.index("notification_states_user_idx").on(t.userId),
  ],
);
