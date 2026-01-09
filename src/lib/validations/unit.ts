import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { units } from "@/drizzle/schema";

const insertSchema = createInsertSchema(units);

export const unitSchema = insertSchema.extend({
  name: insertSchema.shape.name
    .min(1, "Name is required")
    .max(255, "Name must be at most 255 characters long"),
});

export type UnitData = z.infer<typeof unitSchema>;

export const unitUpdateSchema = unitSchema
  .omit({ id: true })
  .partial()
  .extend({
    name: insertSchema.shape.name
      .min(1, "Name is required")
      .max(255, "Name must be at most 255 characters long"),
  });

export type UnitUpdateData = z.infer<typeof unitUpdateSchema>;

export const validateUnitData = (data: unknown) => {
  return unitSchema.safeParse(data);
};

export const validateUnitUpdateData = (data: unknown) => {
  return unitUpdateSchema.safeParse(data);
};
