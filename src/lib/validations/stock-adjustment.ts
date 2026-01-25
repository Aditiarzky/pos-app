import { products } from "@/drizzle/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const baseInsertSchema = createInsertSchema(products);
export const stockAdjustmentSchema = z.object({
  actualStock: baseInsertSchema.shape.stock.refine(
    (v) => Number(v) >= 0,
    "Stok tidak boleh negatif",
  ),
  reason: z.string().min(1, "Alasan wajib diisi"),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
