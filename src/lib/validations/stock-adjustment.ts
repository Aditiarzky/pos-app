import { products } from "@/drizzle/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const baseInsertSchema = createInsertSchema(products);
export const stockAdjustmentSchema = z.object({
  actualStock: baseInsertSchema.shape.stock.refine(
    (v) => Number(v) >= 0,
    "Stok tidak boleh negatif",
  ),
  reason: z.string().min(1, "Alasan wajib diisi").optional(),
});

export const variantAdjustmentSchema = z.object({
  variants: z.array(
    z.object({
      variantId: z.number(),
      qty: z.coerce.number().nonnegative("Jumlah tidak boleh negatif"),
    }),
  ),
  userId: z.number(),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type VariantAdjustmentInput = z.infer<typeof variantAdjustmentSchema>;
