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
  })
);

export const unitsRelations = relations(schema.units, ({ many }) => ({
  products: many(schema.products),
}));

export const categoriesRelations = relations(schema.categories, ({ many }) => ({
  products: many(schema.products),
}));

export const productVariantsRelations = relations(
  schema.productVariants,
  ({ one }) => ({
    product: one(schema.products, {
      fields: [schema.productVariants.productId],
      references: [schema.products.id],
    }),
    unit: one(schema.units, {
      fields: [schema.productVariants.unitId],
      references: [schema.units.id],
    }),
  })
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
  })
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
  })
);
