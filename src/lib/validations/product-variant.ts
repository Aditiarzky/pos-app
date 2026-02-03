import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { productVariants } from "@/drizzle/schema";

const baseInsertSchema = createInsertSchema(productVariants);
const baseUpdateSchema = createUpdateSchema(productVariants);

export const insertProductVariantSchema = baseInsertSchema
  .extend({
    name: baseInsertSchema.shape.name.min(
      3,
      "Name must be at least 3 characters long",
    ),
    sku: baseInsertSchema.shape.sku.min(
      3,
      "SKU must be at least 3 characters long",
    ),
    sellPrice: z.coerce
      .string()
      .refine((v) => Number(v) >= 0, "Sell price must be at least 0"),
    conversionToBase: z.coerce
      .string()
      .refine((v) => Number(v) >= 0, "Conversion to base must be at least 0"),
  })
  .strip();
export const updateProductVariantSchema = baseUpdateSchema.extend({
  name: baseInsertSchema.shape.name
    .min(3, "Name must be at least 3 characters long")
    .optional(),
  sku: baseInsertSchema.shape.sku
    .min(3, "SKU must be at least 3 characters long")
    .optional(),
  sellPrice: z.coerce
    .string()
    .refine((v) => Number(v) >= 0, "Sell price must be at least 0")
    .optional(),
  conversionToBase: z.coerce
    .string()
    .refine((v) => Number(v) >= 0, "Conversion to base must be at least 0")
    .optional(),
});
export const selectProductVariantSchema = createSelectSchema(productVariants);

export type InsertProductVariantInputType = z.infer<
  typeof insertProductVariantSchema
>;
export type UpdateProductVariantInputType = z.infer<
  typeof updateProductVariantSchema
>;
export type SelectProductVariantDataType = z.infer<
  typeof selectProductVariantSchema
>;

export const validateProductVariantData = (data: unknown) => {
  return insertProductVariantSchema.safeParse(data);
};

export const validateUpdateProductVariantData = (data: unknown) => {
  return updateProductVariantSchema.safeParse(data);
};
