import {
  customerExchangeItems,
  customerReturnItems,
  customerReturns,
  sales,
  users,
} from "@/drizzle/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "../db";
import { eq } from "drizzle-orm";

const baseInsertCustomerReturnSchema = createInsertSchema(customerReturns);

const customerReturnItemInputSchema = createInsertSchema(customerReturnItems)
  .omit({
    id: true,
    returnId: true,
    priceAtSale: true, // will be fetched from original sale item
  })
  .extend({
    qty: z.coerce.number().positive("Qty must be positive"),
    productId: z.number().int(),
    variantId: z.number().int(),
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

export const validateInsertCustomerReturnData = async (data: unknown) => {
  return await insertCustomerReturnSchema
    .superRefine(async (val, ctx) => {
      const sale = await db.query.sales.findFirst({
        where: eq(sales.id, val.saleId),
      });
      if (!sale) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Sale not found",
          path: ["saleId"],
        });
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, val.userId),
      });

      if (!user) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "User not found",
          path: ["userId"],
        });
      }

      if (val.compensationType === "exchange") {
        if (!val.exchangeItems || val.exchangeItems.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Exchange items are required for exchange compensation",
            path: ["exchangeItems"],
          });
        }
      }
    })
    .parseAsync(data);
};
