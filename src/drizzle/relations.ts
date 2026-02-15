import { relations } from "drizzle-orm";
import * as schema from "./schema";

export const productsRelations = relations(
  schema.products,
  ({ one, many }) => ({
    unit: one(schema.units, {
      fields: [schema.products.baseUnitId],
      references: [schema.units.id],
    }),
    category: one(schema.categories, {
      fields: [schema.products.categoryId],
      references: [schema.categories.id],
    }),
    variants: many(schema.productVariants),
    barcodes: many(schema.productBarcodes),
  }),
);

export const productBarcodesRelations = relations(
  schema.productBarcodes,
  ({ one }) => ({
    product: one(schema.products, {
      fields: [schema.productBarcodes.productId],
      references: [schema.products.id],
    }),
  }),
);

export const unitsRelations = relations(schema.units, ({ many }) => ({
  products: many(schema.products),
}));

export const categoriesRelations = relations(schema.categories, ({ many }) => ({
  products: many(schema.products),
}));

export const productVariantsRelations = relations(
  schema.productVariants,
  ({ one, many }) => ({
    product: one(schema.products, {
      fields: [schema.productVariants.productId],
      references: [schema.products.id],
    }),
    unit: one(schema.units, {
      fields: [schema.productVariants.unitId],
      references: [schema.units.id],
    }),
    stockMutations: many(schema.stockMutations),
    saleItems: many(schema.saleItems),
  }),
);

export const suppliersRelations = relations(schema.suppliers, ({ many }) => ({
  products: many(schema.products),
}));

export const purchaseOrdersRelations = relations(
  schema.purchaseOrders,
  ({ one, many }) => ({
    supplier: one(schema.suppliers, {
      fields: [schema.purchaseOrders.supplierId],
      references: [schema.suppliers.id],
    }),
    user: one(schema.users, {
      fields: [schema.purchaseOrders.userId],
      references: [schema.users.id],
    }),
    items: many(schema.purchaseItems),
    products: many(schema.products),
  }),
);

export const purchaseItemsRelations = relations(
  schema.purchaseItems,
  ({ one }) => ({
    purchaseOrder: one(schema.purchaseOrders, {
      fields: [schema.purchaseItems.purchaseId],
      references: [schema.purchaseOrders.id],
    }),
    product: one(schema.products, {
      fields: [schema.purchaseItems.productId],
      references: [schema.products.id],
    }),
    productVariant: one(schema.productVariants, {
      fields: [schema.purchaseItems.variantId],
      references: [schema.productVariants.id],
    }),
  }),
);

export const salesRelations = relations(schema.sales, ({ one, many }) => ({
  user: one(schema.users, {
    fields: [schema.sales.userId],
    references: [schema.users.id],
  }),
  items: many(schema.saleItems),
}));

export const saleItemsRelations = relations(schema.saleItems, ({ one }) => ({
  sale: one(schema.sales, {
    fields: [schema.saleItems.saleId],
    references: [schema.sales.id],
  }),
  product: one(schema.products, {
    fields: [schema.saleItems.productId],
    references: [schema.products.id],
  }),
  productVariant: one(schema.productVariants, {
    fields: [schema.saleItems.variantId],
    references: [schema.productVariants.id],
  }),
}));

export const customersRelations = relations(schema.customers, ({ many }) => ({
  sales: many(schema.sales),
}));

export const customerReturnsRelations = relations(
  schema.customerReturns,
  ({ one, many }) => ({
    customer: one(schema.customers, {
      fields: [schema.customerReturns.customerId],
      references: [schema.customers.id],
    }),
    user: one(schema.users, {
      fields: [schema.customerReturns.userId],
      references: [schema.users.id],
    }),
    items: many(schema.customerReturnItems),
    exchangeItems: many(schema.customerExchangeItems),
    sales: one(schema.sales, {
      fields: [schema.customerReturns.saleId],
      references: [schema.sales.id],
    }),
  }),
);

export const customerReturnItemsRelations = relations(
  schema.customerReturnItems,
  ({ one }) => ({
    customerReturn: one(schema.customerReturns, {
      fields: [schema.customerReturnItems.returnId],
      references: [schema.customerReturns.id],
    }),
    product: one(schema.products, {
      fields: [schema.customerReturnItems.productId],
      references: [schema.products.id],
    }),
    productVariant: one(schema.productVariants, {
      fields: [schema.customerReturnItems.variantId],
      references: [schema.productVariants.id],
    }),
  }),
);

export const customerExchangeItemsRelations = relations(
  schema.customerExchangeItems,
  ({ one }) => ({
    customerReturn: one(schema.customerReturns, {
      fields: [schema.customerExchangeItems.returnId],
      references: [schema.customerReturns.id],
    }),
    product: one(schema.products, {
      fields: [schema.customerExchangeItems.productId],
      references: [schema.products.id],
    }),
    productVariant: one(schema.productVariants, {
      fields: [schema.customerExchangeItems.variantId],
      references: [schema.productVariants.id],
    }),
  }),
);

export const usersRelations = relations(schema.users, ({ many }) => ({
  roles: many(schema.userRoles),
  purchaseOrders: many(schema.purchaseOrders),
  sales: many(schema.sales),
  customerReturns: many(schema.customerReturns),
  stockMutations: many(schema.stockMutations),
}));

export const userRolesRelations = relations(schema.userRoles, ({ one }) => ({
  user: one(schema.users, {
    fields: [schema.userRoles.userId],
    references: [schema.users.id],
  }),
}));

export const stockMutationsRelations = relations(
  schema.stockMutations,
  ({ one }) => ({
    product: one(schema.products, {
      fields: [schema.stockMutations.productId],
      references: [schema.products.id],
    }),
    productVariant: one(schema.productVariants, {
      fields: [schema.stockMutations.variantId],
      references: [schema.productVariants.id],
    }),
    user: one(schema.users, {
      fields: [schema.stockMutations.userId],
      references: [schema.users.id],
    }),
  }),
);
