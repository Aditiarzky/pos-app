import {
  customerExchangeItems,
  customerReturnItems,
  customerReturns,
} from "@/drizzle/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const baseInsertCustomerReturnSchema =
  createInsertSchema(customerReturns);
export const baseInsertCustomerReturnItemSchema =
  createInsertSchema(customerReturnItems);

export const customerReturnItemInputSchema = createInsertSchema(
  customerReturnItems,
)
  .omit({
    id: true,
    returnId: true,
    priceAtReturn: true,
    unitFactorAtReturn: true,
    userId: true,
  })
  .extend({
    qty: z.coerce.number().positive("Qty must be positive"),
    productId: z.number().int(),
    variantId: z.number().int(),
    returnedToStock: z.boolean().default(false).optional(),
    reason: z.string().optional().nullable(),
  });

export const customerExchangeItemInputSchema = createInsertSchema(
  customerExchangeItems,
)
  .omit({
    id: true,
    returnId: true,
    priceAtExchange: true,
    unitFactorAtExchange: true,
  })
  .extend({
    qty: z.coerce.number().positive("Qty must be positive"),
    productId: z.number().int(),
    variantId: z.number().int(),
  });

export const insertCustomerReturnSchema = z.object({
  saleId: z.number().int(),
  customerId: z.number().int().nullable().optional(),
  compensationType: z.enum(["refund", "credit_note", "exchange"]),
  userId: z.number().int(),
  items: z
    .array(customerReturnItemInputSchema)
    .min(1, "At least one item is required"),
  exchangeItems: z.array(customerExchangeItemInputSchema).optional(),
  // These are optional because server can generate/calculate them
  returnNumber: z.string().optional(),
  totalRefund: z.coerce.number().min(0).optional(),
});

export type insertCustomerReturnType = z.infer<
  typeof insertCustomerReturnSchema
>;

export type insertCustomerReturnItemType = z.infer<
  typeof customerReturnItemInputSchema
>;

export type insertCustomerExchangeItemType = z.infer<
  typeof customerExchangeItemInputSchema
>;

export const validateInsertCustomerReturnData = async (data: unknown) => {
  return await insertCustomerReturnSchema.parseAsync(data);
};
