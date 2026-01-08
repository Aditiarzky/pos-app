import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters long")
    .max(255, "Name must be at most 255 characters long"),
});

export type Category = z.infer<typeof categorySchema>;

export const categoryUpdateDataSchema = categorySchema.partial();

export type CategoryUpdateData = z.infer<typeof categoryUpdateDataSchema>;

export const validateCategoryData = (data: unknown) => {
  return categorySchema.safeParse(data);
};

export const validateCategoryUpdateData = (data: unknown) => {
  return categoryUpdateDataSchema.safeParse(data);
};
