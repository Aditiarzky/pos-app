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
  "debt",
  "completed",
  "refunded",
  "cancelled",
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

export const userRole = p.pgEnum("user_role", ["admin toko", "admin sistem"]);

// Table

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
  customerId: p
    .integer("customer_id")
    .references(() => customers.id, { onDelete: "cascade" }),
  totalPrice: p.decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  totalPaid: p.decimal("total_paid", { precision: 12, scale: 2 }).notNull(),
  totalReturn: p.decimal("total_return", { precision: 12, scale: 2 }).notNull(),
  totalBalanceUsed: p
    .decimal("total_balance_used", { precision: 12, scale: 2 })
    .notNull(),
  status: saleStatus("status").default("completed"),
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

  totalRefund: p.decimal("total_refund", { precision: 12, scale: 2 }).notNull(),

  compensationType: compensationType("compensation_type").notNull(),

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
