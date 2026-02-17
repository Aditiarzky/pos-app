import {
  customerExchangeItems,
  customerReturnItems,
  customerReturns,
  sales,
  users,
} from "@/drizzle/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const baseInsertCustomerReturnSchema = createInsertSchema(customerReturns);
const baseInsertCustomerReturnItemSchema =
  createInsertSchema(customerReturnItems);

const customerReturnItemInputSchema = createInsertSchema(customerReturnItems)
  .omit({
    id: true,
    returnId: true,
  })
  .extend({
    qty: z.coerce.number().positive("Qty must be positive"),
    productId: z.number().int(),
    variantId: z.number().int(),
    returnedToStock: baseInsertCustomerReturnItemSchema.shape.returnedToStock,
  });

const customerExchangeItemInputSchema = createInsertSchema(
  customerExchangeItems,
)
  .omit({
    id: true,
    returnId: true,
  })
  .extend({
    qty: z.coerce.number().positive("Qty must be positive"),
    productId: z.number().int(),
    variantId: z.number().int(),
  });

export const insertCustomerReturnSchema = z.object({
  returnNumber: baseInsertCustomerReturnSchema.shape.returnNumber,
  saleId: baseInsertCustomerReturnSchema.shape.saleId,
  customerId: baseInsertCustomerReturnSchema.shape.customerId,
  totalRefund: z.coerce.number().min(0),
  compensationType: baseInsertCustomerReturnSchema.shape.compensationType,
  userId: baseInsertCustomerReturnSchema.shape.userId,
  items: z
    .array(customerReturnItemInputSchema)
    .min(1, "At least one item is required"),
  exchangeItems: z.array(customerExchangeItemInputSchema).optional(),
});

export type insertCustomerReturnType = z.infer<
  typeof insertCustomerReturnSchema
>;

export type insertCustomerReturnItemType = Omit<
  z.infer<typeof customerReturnItemInputSchema>,
  "productId" | "variantId"
> & {
  productId: number;
  variantId: number;
};

export type insertCustomerExchangeItemType = Omit<
  z.infer<typeof customerExchangeItemInputSchema>,
  "productId" | "variantId"
> & {
  productId: number;
  variantId: number;
};

export const validateInsertCustomerReturnData = async (data: unknown) => {
  return await insertCustomerReturnSchema.parseAsync(data);
};
