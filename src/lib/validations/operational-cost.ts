import z from "zod";

export const operationalCostSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(150),
  category: z.enum([
    "utilities",
    "salary",
    "rent",
    "logistics",
    "marketing",
    "maintenance",
    "other",
  ]),
  amount: z
    .number().min(0.01, "Nominal harus lebih dari 0"),
  period: z.enum(["daily", "weekly", "monthly", "yearly", "one_time"]),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal: YYYY-MM-DD"),
  effectiveTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal: YYYY-MM-DD")
    .nullable()
    .optional(),
  isActive: z.boolean().optional().default(true),
  notes: z.string().nullable().optional(),
  createdBy: z.number().int().optional(),
});

export const updateOperationalCostSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  category: z
    .enum(["utilities", "salary", "rent", "logistics", "marketing", "maintenance", "other"])
    .optional(),
  amount: z.number().positive().optional(),
  period: z.enum(["daily", "weekly", "monthly", "yearly", "one_time"]).optional(),
  effectiveFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  effectiveTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

export type OperationalCostType = z.infer<typeof operationalCostSchema>;
export type UpdateOperationalCostType = z.infer<typeof updateOperationalCostSchema>;


export const validateOperationalCost = (data: unknown) =>
  operationalCostSchema.safeParse(data);
export const validateUpdateOperationalCost = (data: unknown) =>
  updateOperationalCostSchema.safeParse(data);
