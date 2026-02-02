import { purchaseItems, purchaseOrders } from "@/drizzle/schema";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

const baseInsertPurchaseOrderSchema = createInsertSchema(purchaseOrders);

const purchaseItemInputSchema = createInsertSchema(purchaseItems)
  .omit({
    id: true,
    purchaseId: true,
    subtotal: true,
    costBefore: true,
  })
  .extend({
    qty: z.number().int().min(1, "Qty must be at least 1"),
    price: z.number().min(0, "Price must be non-negative"),
    productId: z.number().int(),
    variantId: z.number().int(),
  });

export type insertPurchaseItemType = z.infer<typeof purchaseItemInputSchema>;

export const insertPurchaseSchema = z.object({
  supplierId: z.number({
    error: () => ({
      message: "Supplier harus diisi",
    }),
  }),
  userId: baseInsertPurchaseOrderSchema.shape.userId,
  items: z
    .array(purchaseItemInputSchema)
    .min(1, "At least one item is required"),
});

export type insertPurchaseType = z.infer<typeof insertPurchaseSchema>;

export const updatePurchaseSchema = insertPurchaseSchema
  .extend({
    id: z.number().int(),
  })
  .partial()
  .required({ id: true });

export type UpdatePurchaseType = z.infer<typeof updatePurchaseSchema>;

// Server-side only validation
export const validateInsertPurchaseData = async (data: unknown) => {
  return await insertPurchaseSchema.parseAsync(data);
};
