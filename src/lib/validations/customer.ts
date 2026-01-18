import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { customers } from "@/drizzle/schema";

const insertSchema = createInsertSchema(customers);

export const customerSchema = insertSchema.extend({
  name: insertSchema.shape.name
    .min(1, "Name is required")
    .max(255, "Name must be at most 255 characters long"),
});

export type CustomerData = z.infer<typeof customerSchema>;

export const customerUpdateSchema = customerSchema
  .omit({ id: true })
  .partial()
  .extend({
    name: insertSchema.shape.name
      .min(1, "Name is required")
      .max(255, "Name must be at most 255 characters long"),
  });

export type CustomerUpdateData = z.infer<typeof customerUpdateSchema>;

export const validateCustomerData = (data: unknown) => {
  return customerSchema.safeParse(data);
};

export const validateCustomerUpdateData = (data: unknown) => {
  return customerUpdateSchema.safeParse(data);
};
