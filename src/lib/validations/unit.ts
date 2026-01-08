import { z } from "zod";

export const unitSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be at most 255 characters long"),
});

export type UnitData = z.infer<typeof unitSchema>;

export const unitUpdateSchema = unitSchema.partial();

export type UnitUpdateData = z.infer<typeof unitUpdateSchema>;

export const validateUnitData = (data: unknown) => {
  return unitSchema.safeParse(data);
};

export const validateUnitUpdateData = (data: unknown) => {
  return unitUpdateSchema.safeParse(data);
};
