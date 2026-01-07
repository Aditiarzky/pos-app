import * as p from "drizzle-orm/pg-core";

// Enum

export const stockMutationType = p.pgEnum("stock_mutation_type", [
  "purchase",
  "sale",
  "return_restock",
  "waste",
  "supplier_return",
  "adjustment",
]);

export const saleStatus = p.pgEnum("sale_status", ["completed", "refunded"]);

export const compensationType = p.pgEnum("compensation_type", [
  "exchange",
  "credit_note",
  "refund",
]);

export const userRole = p.pgEnum("user_role", ["user", "admin"]);

// Table

export const users = p.pgTable(
  "users",
  {
    id: p.serial("id").primaryKey(),
    email: p.text("email").notNull(),
    name: p.text("name").notNull(),
    password: p.text("password").notNull(),
    role: userRole("role").default("user"),
    createdAt: p.timestamp("created_at").defaultNow(),
    updatedAt: p.timestamp("updated_at").defaultNow(),
  },
  (t) => [p.uniqueIndex("users_email_key").on(t.email)]
);

export const categories = p.pgTable("categories", {
  id: p.serial("id").primaryKey(),
  name: p.varchar("name", { length: 100 }).notNull(),
  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p.timestamp("updated_at").defaultNow(),
});

export const units = p.pgTable("units", {
  id: p.serial("id").primaryKey(),
  name: p.varchar("name", { length: 50 }).notNull(), // kg, pcs, peti, botol
  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p.timestamp("updated_at").defaultNow(),
});

export const suppliers = p.pgTable("suppliers", {
  id: p.serial("id").primaryKey(),
  name: p.varchar("name", { length: 120 }).notNull(),
  phone: p.varchar("phone", { length: 30 }),
  address: p.text("address"),
  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p.timestamp("updated_at").defaultNow(),
});

export const products = p.pgTable("products", {
  id: p.serial("id").primaryKey(),

  categoryId: p.integer("category_id").references(() => categories.id),

  sku: p.varchar("sku", { length: 50 }).notNull().unique(),
  name: p.varchar("name", { length: 150 }).notNull(),
  image: p.text("image"),

  minStock: p.decimal("min_stock", { precision: 12, scale: 3 }).default("0"),
  stock: p.decimal("stock", { precision: 12, scale: 3 }).default("0"),

  baseUnitId: p
    .integer("base_unit_id")
    .notNull()
    .references(() => units.id),
  // dua field ini digunakan untuk menghitung harga beli barang (hpp)
  averageCost: p.decimal("average_cost", { precision: 12, scale: 4 }), // Field ini mencatat rata-rata harga beli dari semua stok yang saat ini ada di gudang.
  lastPurchaseCost: p.decimal("last_purchase_cost", {
    precision: 12,
    scale: 4,
  }), // harga beli terakhir atau yang paling baru dari pembelian supplier
  // Contoh:
  // Beli 10 pcs seharga Rp1.000. (averageCost = 1.000)
  // Beli lagi 10 pcs seharga Rp1.200.
  // averageCost baru = (10.000 + 12.000) / 20 = Rp1.100.

  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p.timestamp("updated_at").defaultNow(),
});

export const productVariants = p.pgTable("product_variants", {
  id: p.serial("id").primaryKey(),

  productId: p
    .integer("product_id")
    .notNull()
    .references(() => products.id),

  name: p.varchar("name", { length: 100 }).notNull(),

  sku: p.varchar("sku", { length: 60 }).notNull().unique(),

  unitId: p
    .integer("unit_id")
    .notNull()
    .references(() => units.id),

  conversionToBase: p
    .decimal("conversion_to_base", { precision: 12, scale: 4 })
    .notNull(), // 1 unit = x base unit

  sellPrice: p.decimal("sell_price", { precision: 12, scale: 2 }).notNull(),
  isArchived: p.boolean("is_archived").default(false),

  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p.timestamp("updated_at").defaultNow(),
});

export const productBarcodes = p.pgTable("product_barcodes", {
  id: p.serial("id").primaryKey(),
  variantId: p
    .integer("variant_id")
    .notNull()
    .references(() => productVariants.id),
  barcode: p.varchar("barcode", { length: 100 }).notNull().unique(),
  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p.timestamp("updated_at").defaultNow(),
});

export const purchaseOrders = p.pgTable("purchase_orders", {
  id: p.serial("id").primaryKey(),
  supplierId: p.integer("supplier_id").references(() => suppliers.id),
  total: p.decimal("total", { precision: 12, scale: 2 }),
  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p.timestamp("updated_at").defaultNow(),
  userId: p.integer("user_id").references(() => users.id),
});

export const purchaseItems = p.pgTable("purchase_items", {
  id: p.serial("id").primaryKey(),

  purchaseId: p.integer("purchase_id").references(() => purchaseOrders.id),

  productId: p.integer("product_id").references(() => products.id),

  variantId: p.integer("variant_id").references(() => productVariants.id),

  unitId: p.integer("unit_id").references(() => units.id),

  qty: p.decimal("qty", { precision: 12, scale: 3 }).notNull(),

  price: p.decimal("price", { precision: 12, scale: 2 }).notNull(),

  subtotal: p.decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
});

export const sales = p.pgTable("sales", {
  id: p.serial("id").primaryKey(),
  invoiceNumber: p.varchar("invoice_number", { length: 60 }).notNull().unique(),
  totalPrice: p.decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  totalPaid: p.decimal("total_paid", { precision: 12, scale: 2 }).notNull(),
  totalReturn: p.decimal("total_return", { precision: 12, scale: 2 }).notNull(),
  status: saleStatus("status").default("completed"),
  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p.timestamp("updated_at").defaultNow(),
  userId: p.integer("user_id").references(() => users.id),
});

export const saleItems = p.pgTable("sale_items", {
  id: p.serial("id").primaryKey(),

  saleId: p.integer("sale_id").references(() => sales.id),

  productId: p.integer("product_id").references(() => products.id),

  variantId: p.integer("variant_id").references(() => productVariants.id),

  unitId: p.integer("unit_id").references(() => units.id),

  qty: p.decimal("qty", { precision: 12, scale: 3 }).notNull(),

  priceAtSale: p
    .decimal("price_at_sale", { precision: 12, scale: 2 })
    .notNull(),

  subtotal: p.decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
});

export const supplierReturns = p.pgTable("supplier_returns", {
  id: p.serial("id").primaryKey(),
  supplierId: p.integer("supplier_id").references(() => suppliers.id),
  productId: p.integer("product_id").references(() => products.id),
  qty: p.decimal("qty", { precision: 12, scale: 3 }).notNull(),
  reason: p.text("reason"),
  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p.timestamp("updated_at").defaultNow(),
  userId: p.integer("user_id").references(() => users.id),
});

export const stockMutations = p.pgTable("stock_mutations", {
  id: p.serial("id").primaryKey(),

  productId: p.integer("product_id").references(() => products.id),

  variantId: p.integer("variant_id").references(() => productVariants.id),

  type: stockMutationType("type").notNull(),

  qtyBaseUnit: p
    .decimal("qty_base_unit", { precision: 12, scale: 4 })
    .notNull(),

  reference: p.varchar("reference", { length: 100 }),

  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p.timestamp("updated_at").defaultNow(),

  userId: p.integer("user_id").references(() => users.id),
});

export const customerReturns = p.pgTable("customer_returns", {
  id: p.serial("id").primaryKey(),

  saleId: p.integer("sale_id").references(() => sales.id), // opsional tapi disarankan
  customerName: p.varchar("customer_name", { length: 150 }),

  totalRefund: p.decimal("total_refund", { precision: 12, scale: 2 }).notNull(),

  compensationType: compensationType("compensation_type").notNull(),

  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p.timestamp("updated_at").defaultNow(),

  userId: p.integer("user_id").references(() => users.id),
});

export const customerReturnItems = p.pgTable("customer_return_items", {
  id: p.serial("id").primaryKey(),

  returnId: p
    .integer("return_id")
    .notNull()
    .references(() => customerReturns.id),

  variantId: p
    .integer("variant_id")
    .notNull()
    .references(() => productVariants.id),

  qty: p.decimal("qty", { precision: 12, scale: 3 }).notNull(),

  priceAtSale: p
    .decimal("price_at_sale", { precision: 12, scale: 2 })
    .notNull(),

  reason: p.text("reason"),

  returnedToStock: p.boolean("returned_to_stock").default(false),
});
