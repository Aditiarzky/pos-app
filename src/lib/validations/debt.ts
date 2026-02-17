import { z } from "zod";

export const payDebtSchema = z.object({
  amount: z.coerce.number().positive("Jumlah pembayaran harus positif"),
  paymentDate: z.coerce.date().default(() => new Date()),
  note: z.string().optional(),
});

export const getDebtsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).default(10),
  customerId: z.coerce.number().optional(),
  status: z.enum(["unpaid", "partial", "paid", "active"]).optional(),
  search: z.string().optional(),
});

export type PayDebtData = z.infer<typeof payDebtSchema>;
export type GetDebtsQuery = z.infer<typeof getDebtsSchema>;
