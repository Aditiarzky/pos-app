import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { products } from "@/drizzle/schema";

const baseInsertSchema = createInsertSchema(products);
const baseUpdateSchema = createUpdateSchema(products);

export const insertProductSchema = baseInsertSchema
  .extend({
    sku: baseInsertSchema.shape.sku.min(
      3,
      "SKU must be at least 3 characters long",
    ),
    name: baseInsertSchema.shape.name.min(
      3,
      "Name must be at least 3 characters long",
    ),
    minStock: baseInsertSchema.shape.minStock.default("0"),
    stock: baseInsertSchema.shape.stock.default("0"),
    averageCost: baseInsertSchema.shape.averageCost.optional().nullable(),
    lastPurchaseCost: baseInsertSchema.shape.lastPurchaseCost
      .optional()
      .nullable(),
    categoryId: baseInsertSchema.shape.categoryId.optional().nullable(),
    baseUnitId: baseInsertSchema.shape.baseUnitId,
    image: baseInsertSchema.shape.image.optional().nullable(),
    barcodes: z.array(z.string()).optional(),
  })
  .strip();

export const updateProductSchema = baseUpdateSchema;

export const selectProductSchema = createSelectSchema(products);

export type InsertProductInputType = z.infer<typeof insertProductSchema>;
export type UpdateProductInputType = z.infer<typeof updateProductSchema>;
export type SelectProductDataType = z.infer<typeof selectProductSchema>;

export const validateProductData = (data: unknown) => {
  return insertProductSchema.safeParse(data);
};

export const validateUpdateProductData = (data: unknown) => {
  return updateProductSchema.safeParse(data);
};
