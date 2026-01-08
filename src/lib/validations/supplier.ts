import { z } from "zod";

export const supplierSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be at most 255 characters long"),
  address: z
    .string()
    .max(255, "Address must be at most 255 characters long")
    .optional(),
  phone: z
    .string()
    .max(255, "Phone must be at most 255 characters long")
    .optional(),
});

export type SupplierData = z.infer<typeof supplierSchema>;

export const supplierUpdateSchema = supplierSchema.partial();

export type SupplierUpdateData = z.infer<typeof supplierUpdateSchema>;

export const validateSupplierData = (data: unknown) => {
  return supplierSchema.safeParse(data);
};

export const validateSupplierUpdateData = (data: unknown) => {
  return supplierUpdateSchema.safeParse(data);
};
