import { purchaseItems, purchaseOrders } from "@/drizzle/schema";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

const baseInsertPurchaseOrderSchema = createInsertSchema(purchaseOrders);

const purchaseItemInputSchema = createInsertSchema(purchaseItems)
  .omit({
    id: true,
    purchaseId: true,
    subtotal: true,
  })
  .extend({
    qty: z.coerce.number().positive("Qty must be positive"),
    price: z.coerce.number().nonnegative("Price must be non-negative"),
    productId: z.number().int(),
    variantId: z.number().int(),
  });

export const insertPurchaseSchema = z.object({
  supplierId: baseInsertPurchaseOrderSchema.shape.supplierId,
  userId: baseInsertPurchaseOrderSchema.shape.userId,
  items: z
    .array(purchaseItemInputSchema.omit({ costBefore: true }))
    .min(1, "At least one item is required"),
});

export type insertPurchaseType = z.infer<typeof insertPurchaseSchema>;

// Server-side only validation
export const validateInsertPurchaseData = async (data: unknown) => {
  return await insertPurchaseSchema.parseAsync(data);
};
