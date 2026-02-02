import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "@/drizzle/schema";

const insertSchema = createInsertSchema(users);

export const createUserSchema = insertSchema.extend({
  password: insertSchema.shape.password
    .min(6, "Password minimal 6 karakter")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password harus mengandung huruf besar, kecil, dan angka",
    ),
  email: insertSchema.shape.email.email("Email tidak valid"),
  name: insertSchema.shape.name.min(1, "Nama wajib diisi"),
  roles: z
    .array(z.enum(["admin toko", "admin sistem"]))
    .min(1, "Minimal pilih satu role"),
});

export const updateUserSchema = insertSchema.extend({
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password harus mengandung huruf besar, kecil, dan angka",
    )
    .optional()
    .or(z.literal("")),
  roles: z
    .array(z.enum(["admin toko", "admin sistem"]))
    .min(1, "Minimal pilih satu role")
    .optional(),
});

export const userFormSchema = createSelectSchema(users).extend({
  password: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z
      .string()
      .min(6, "Password baru minimal 6 karakter")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password harus mengandung huruf besar, kecil, dan angka",
      ),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password baru dan konfirmasi tidak cocok",
    path: ["confirmPassword"],
  });

// Types
export type CreateUserInputType = z.infer<typeof createUserSchema>;
export type UpdateUserInputType = z.infer<typeof updateUserSchema>;
export type UserFormDataType = z.infer<typeof userFormSchema>;
export type LoginInputType = z.infer<typeof loginSchema>;
export type ChangePasswordInputType = z.infer<typeof changePasswordSchema>;

// Validation middleware
export const validateUserData = (data: unknown) => {
  return createUserSchema.safeParse(data);
};

export const validateUpdateUserData = (data: unknown) => {
  return updateUserSchema.safeParse(data);
};
