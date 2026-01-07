import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be at most 255 characters long"),
});

export type Category = z.infer<typeof categorySchema>;

export const validateCategoryData = (data: unknown) => {
  return categorySchema.safeParse(data);
};
