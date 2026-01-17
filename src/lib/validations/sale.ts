import { saleItems, sales, suppliers, users } from "@/drizzle/schema";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { db } from "../db";
import { eq } from "drizzle-orm";

const baseInsertSaleOrderSchema = createInsertSchema(sales);

const saleItemInputSchema = createInsertSchema(saleItems)
  .omit({
    id: true,
    saleId: true,
    subtotal: true,
    priceAtSale: true,
    costAtSale: true,
  })
  .extend({
    qty: z.coerce.number().positive("Qty must be positive"),
    productId: z.number().int(),
    variantId: z.number().int(),
  });

export const insertSaleSchema = z.object({
  totalPaid: baseInsertSaleOrderSchema.shape.totalPaid,
  userId: baseInsertSaleOrderSchema.shape.userId,
  items: z.array(saleItemInputSchema).min(1, "At least one item is required"),
});

export type insertSaleType = z.infer<typeof insertSaleSchema>;

export const validateInsertSaleData = async (data: unknown) => {
  return await insertSaleSchema
    .superRefine(async (val, ctx) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, val.userId),
      });
      if (!user) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "User tidak terdaftar di database",
          path: ["userId"],
        });
      }
    })
    .parseAsync(data);
};
