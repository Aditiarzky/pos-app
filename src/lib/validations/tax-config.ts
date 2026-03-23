import z from "zod";

export const taxConfigSchema = z
  .object({
    name: z.string().min(1, "Nama pajak wajib diisi").max(150),
    type: z.enum(["percentage", "fixed"]),
    rate: z.number().min(0).max(1).nullable().optional(),
    // rate dalam desimal: 0.005 = 0.5%, 0.11 = 11%
    fixedAmount: z.number().positive().nullable().optional(),
    appliesTo: z.enum(["revenue", "gross_profit"]).nullable().optional(),
    period: z
      .enum(["daily", "weekly", "monthly", "yearly", "one_time"])
      .optional()
      .default("monthly"),
    effectiveFrom: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal: YYYY-MM-DD"),
    effectiveTo: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
    isActive: z.boolean().optional().default(true),
    notes: z.string().nullable().optional(),
    createdBy: z.number().int().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "percentage") {
      if (data.rate == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Rate wajib diisi untuk pajak persentase",
          path: ["rate"],
        });
      }
      if (data.appliesTo == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Basis perhitungan (appliesTo) wajib diisi untuk pajak persentase",
          path: ["appliesTo"],
        });
      }
    }
    if (data.type === "fixed") {
      if (data.fixedAmount == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nominal tetap wajib diisi untuk pajak tetap",
          path: ["fixedAmount"],
        });
      }
    }
  });

export const updateTaxConfigSchema = z
  .object({
    name: z.string().min(1).max(150).optional(),
    type: z.enum(["percentage", "fixed"]).optional(),
    rate: z.number().min(0).max(1).nullable().optional(),
    fixedAmount: z.number().positive().nullable().optional(),
    appliesTo: z.enum(["revenue", "gross_profit"]).nullable().optional(),
    period: z
      .enum(["daily", "weekly", "monthly", "yearly", "one_time"])
      .optional(),
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
  })
  .superRefine((data, ctx) => {
    // Validasi hanya jika type ikut diubah
    if (data.type === "percentage" && data.rate === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rate tidak boleh null untuk pajak persentase",
        path: ["rate"],
      });
    }
    if (data.type === "fixed" && data.fixedAmount === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nominal tidak boleh null untuk pajak tetap",
        path: ["fixedAmount"],
      });
    }
  });

export type TaxConfigType = z.infer<typeof taxConfigSchema>;
export type UpdateTaxConfigType = z.infer<typeof updateTaxConfigSchema>;

export const validateTaxConfig = (data: unknown) =>
  taxConfigSchema.safeParse(data);
export const validateUpdateTaxConfig = (data: unknown) =>
  updateTaxConfigSchema.safeParse(data);
