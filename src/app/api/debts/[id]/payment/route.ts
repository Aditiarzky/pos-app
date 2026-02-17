import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { debts, debtPayments, sales } from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { handleApiError } from "@/lib/api-utils";
import { payDebtSchema } from "@/lib/validations/debt";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const debtId = Number((await params).id);
    if (isNaN(debtId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validation = payDebtSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const { amount, paymentDate, note } = validation.data;

    const debt = await db.query.debts.findFirst({
      where: eq(debts.id, debtId),
    });

    if (!debt) {
      return NextResponse.json(
        { success: false, error: "Debt record not found" },
        { status: 404 },
      );
    }

    if (Number(debt.remainingAmount) <= 0) {
      return NextResponse.json(
        { success: false, error: "Hutang sudah lunas" },
        { status: 400 },
      );
    }

    if (amount > Number(debt.remainingAmount)) {
      return NextResponse.json(
        {
          success: false,
          error: "Jumlah pembayaran melebihi sisa hutang",
        },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      // 1. Record Payment
      const [payment] = await tx
        .insert(debtPayments)
        .values({
          debtId,
          amountPaid: amount.toString(),
          paymentDate: new Date(paymentDate), // valid date object
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

      // 3. Check for Full Payment
      if (newRemaining <= 0) {
        // Mark debt as paid
        await tx
          .update(debts)
          .set({ status: "paid" })
          .where(eq(debts.id, debtId));

        // Mark associated sale as completed
        await tx
          .update(sales)
          .set({ status: "completed" })
          .where(eq(sales.id, debt.saleId));
      } else {
        // Mark debt as partial if not already
        if (debt.status === "unpaid") {
          await tx
            .update(debts)
            .set({ status: "partial" })
            .where(eq(debts.id, debtId));
        }
      }

      return { payment, newRemaining };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
