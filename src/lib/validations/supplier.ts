import { z } from "zod";

export const supplierSchema = z.object({
  name: z
    .string()
    .min(1, "Nama supplier harus diisi")
    .max(255, "Nama supplier maksimal 255 karakter"),
  phone: z
    .string()
    .max(255, "Nomor telepon maksimal 255 karakter")
    .optional(),
  email: z
    .string()
    .email("Format email tidak valid")
    .max(255, "Email maksimal 255 karakter")
    .optional(),
  address: z
    .string()
    .max(500, "Alamat maksimal 500 karakter")
    .optional(),
  description: z
    .string()
    .max(1000, "Deskripsi maksimal 1000 karakter")
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
