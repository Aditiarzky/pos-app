import { debts, debtPayments, sales } from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";

export async function processDebtPayment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  debtId: number,
  amount: number,
  note: string,
  paymentDate: Date = new Date(),
) {
  // 1. Record Payment
  const [payment] = await tx
    .insert(debtPayments)
    .values({
      debtId,
      amountPaid: amount.toFixed(2),
      paymentDate,
      note,
    })
    .returning();

  // 2. Update Debt Remaining Amount
  const [updatedDebt] = await tx
    .update(debts)
    .set({
      remainingAmount: sql`${debts.remainingAmount} - ${amount.toFixed(2)}`,
    })
    .where(eq(debts.id, debtId))
    .returning();

  const newRemaining = Number(updatedDebt.remainingAmount);

  // 3. Update Status Hutang & Penjualan Terkait
  if (newRemaining <= 0) {
    await tx.update(debts).set({ status: "paid" }).where(eq(debts.id, debtId));

    // Pastikan debt.saleId tersedia (ambil data debt jika perlu atau masukkan sebagai param)
    if (updatedDebt.saleId) {
      await tx
        .update(sales)
        .set({ status: "completed" })
        .where(eq(sales.id, updatedDebt.saleId));
    }
  } else {
    await tx
      .update(debts)
      .set({ status: "partial" })
      .where(eq(debts.id, debtId));
  }

  return { payment, newRemaining };
}
