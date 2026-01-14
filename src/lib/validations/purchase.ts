import {
  purchaseItems,
  purchaseOrders,
  suppliers,
  users,
} from "@/drizzle/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { db } from "../db";
import { eq } from "drizzle-orm";

const baseInsertPurchaseOrderSchema = createInsertSchema(purchaseOrders);
const baseUpdatePurchaseOrderSchema = createUpdateSchema(purchaseOrders);

const baseInsertPurchaseItemSchema = createInsertSchema(purchaseItems);
const baseUpdatePurchaseItemSchema = createUpdateSchema(purchaseItems);

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

export const updatePurchaseSchema = z.object({
  supplierId: baseUpdatePurchaseOrderSchema.shape.supplierId,
  userId: baseUpdatePurchaseOrderSchema.shape.userId,
  items: z
    .array(purchaseItemInputSchema.partial())
    .min(1, "At least one item is required"),
});

export type insertPurchaseType = z.infer<typeof insertPurchaseSchema>;
export type updatePurchaseType = z.infer<typeof updatePurchaseSchema>;

export const validateInsertPurchaseData = async (data: unknown) => {
  return await insertPurchaseSchema
    .superRefine(async (val, ctx) => {
      // Cek Supplier
      const supplier = await db.query.suppliers.findFirst({
        where: eq(suppliers.id, val.supplierId),
      });
      if (!supplier) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Supplier tidak terdaftar di database",
          path: ["supplierId"],
        });
      }

      // Cek User
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

export const validateUpdatePurchaseData = (data: unknown) => {
  return updatePurchaseSchema.safeParse(data);
};
