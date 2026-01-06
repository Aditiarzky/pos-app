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

export const userRole = p.pgEnum("user_role", ["user", "admin"]);

// Table

export const users = p.pgTable(
  "Users",
  {
    id: p.serial("id").primaryKey(),
    email: p.text().notNull(),
    name: p.text().notNull(),
    password: p.text().notNull(),
    role: userRole("role").default("user"),
    createdAt: p.timestamp("created_at").defaultNow(),
    updatedAt: p.timestamp("updated_at").defaultNow(),
  },
  (table) => [
    p
      .uniqueIndex("User_email_key")
      .using("btree", table.email.asc().nullsLast().op("text_ops")),
  ]
);

export const categories = p.pgTable("categories", {
  id: p.serial("id").primaryKey(),
  name: p.varchar("name", { length: 100 }).notNull(),
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
  minStock: p.integer("min_stock").default(0),
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

  buyPrice: p.decimal("buy_price", { precision: 12, scale: 2 }).notNull(),
  sellPrice: p.decimal("sell_price", { precision: 12, scale: 2 }).notNull(),

  stock: p.integer("stock").notNull().default(0),

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
  variantId: p.integer("variant_id").references(() => productVariants.id),
  qty: p.integer("qty").notNull(),
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
  variantId: p.integer("variant_id").references(() => productVariants.id),
  qty: p.integer("qty").notNull(),
  priceAtSale: p
    .decimal("price_at_sale", { precision: 12, scale: 2 })
    .notNull(),
  subtotal: p.decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
});

export const supplierReturns = p.pgTable("supplier_returns", {
  id: p.serial("id").primaryKey(),
  supplierId: p.integer("supplier_id").references(() => suppliers.id),
  variantId: p.integer("variant_id").references(() => productVariants.id),
  qty: p.integer("qty").notNull(),
  reason: p.text("reason"),
  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p.timestamp("updated_at").defaultNow(),
  userId: p.integer("user_id").references(() => users.id),
});

export const stockMutations = p.pgTable("stock_mutations", {
  id: p.serial("id").primaryKey(),
  variantId: p.integer("variant_id").references(() => productVariants.id),
  type: stockMutationType("type").notNull(),
  qty: p.integer("qty").notNull(),
  reference: p.varchar("reference", { length: 100 }),
  createdAt: p.timestamp("created_at").defaultNow(),
  updatedAt: p.timestamp("updated_at").defaultNow(),
  userId: p.integer("user_id").references(() => users.id),
});
