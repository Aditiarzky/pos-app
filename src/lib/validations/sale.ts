import { saleItems } from "@/drizzle/schema";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

const saleItemInputSchema = createInsertSchema(saleItems)
  .omit({
    id: true,
    saleId: true,
    subtotal: true,
    priceAtSale: true,
    costAtSale: true,
    unitFactorAtSale: true,
  })
  .extend({
    qty: z.coerce.number().positive("Qty must be positive"),
    productId: z.number().int(),
    variantId: z.number().int(),
  });

export const insertSaleSchema = z
  .object({
    totalPaid: z.coerce.number().nonnegative("Total paid must be non-negative"),
    userId: z.number().min(1, "Tidak ada user yang login"),
    customerId: z.number().min(1, "Id customer harus positif").optional(),
    totalBalanceUsed: z.coerce
      .number()
      .nonnegative("Total saldo harus positif")
      .default(0),
    items: z.array(saleItemInputSchema).min(1, "At least one item is required"),
    isDebt: z.boolean().default(false),
    shouldPayOldDebt: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (!data.customerId && data.totalBalanceUsed > 0) {
        return false;
      }
      return true;
    },
    {
      message: "Guest tidak boleh menggunakan saldo",
      path: ["totalBalanceUsed"],
    },
  );

export type insertSaleType = z.infer<typeof insertSaleSchema>;

export const validateInsertSaleData = async (data: unknown) => {
  return await insertSaleSchema.parseAsync(data);
};
