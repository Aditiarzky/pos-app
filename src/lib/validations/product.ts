import {
  createInsertSchema,
  createUpdateSchema,
  createSelectSchema,
} from "drizzle-zod";
import { z } from "zod";
import { products, productVariants } from "@/drizzle/schema";

const baseVariantInsert = createInsertSchema(productVariants);

export const productVariantSchema = baseVariantInsert
  .extend({
    id: baseVariantInsert.shape.id.optional(),
    productId: baseVariantInsert.shape.productId.optional(),
    name: baseVariantInsert.shape.name.min(1, "Nama variant harus diisi"),
    sku: baseVariantInsert.shape.sku.min(3, "SKU harus diisi"),
    sellPrice: baseVariantInsert.shape.sellPrice.refine(
      (v) => Number(v) >= 1,
      "Harga jual harus lebih dari 1",
    ),
    conversionToBase: baseVariantInsert.shape.conversionToBase.refine(
      (v) => Number(v) >= 1,
      "Konversi ke satuan dasar harus lebih dari 1",
    ),
    unitId: baseVariantInsert.shape.unitId,
  })
  .strip();

const baseInsertSchema = createInsertSchema(products);

export const insertProductSchema = baseInsertSchema
  .extend({
    sku: baseInsertSchema.shape.sku.min(3, "SKU harus diisi"),
    name: baseInsertSchema.shape.name.min(3, "Nama harus diisi"),
    minStock: baseInsertSchema.shape.minStock
      .default("0")
      .refine((v) => Number(v) >= 0, "Stok minimum tidak boleh negatif"),
    stock: baseInsertSchema.shape.stock
      .default("0")
      .refine((v) => Number(v) >= 0, "Stok tidak boleh negatif"),
    baseUnitId: z.number({
      error: () => ({
        message: "Satuan dasar harus diisi",
      }),
    }),
    barcodes: z.array(z.object({ barcode: z.string() })).optional(),
    variants: z.array(productVariantSchema).optional(),
  })
  .strip();

export const updateProductSchema = insertProductSchema.partial().extend({
  barcodes: z.array(z.object({ barcode: z.string() })).optional(),
  variants: z.array(productVariantSchema).optional(),
});

export type InsertProductInputType = z.infer<typeof insertProductSchema>;
export type UpdateProductInputType = z.infer<typeof updateProductSchema>;
export type ProductVariantInputType = z.infer<typeof productVariantSchema>;
export type InsertProductBarcodeInputType = z.infer<
  typeof insertProductSchema.shape.barcodes
>;

export const validateProductData = (data: unknown) =>
  insertProductSchema.safeParse(data);
export const validateUpdateProductData = (data: unknown) =>
  updateProductSchema.safeParse(data);
