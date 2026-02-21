import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { debts } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { handleApiError } from "@/lib/api-utils";
import { payDebtSchema } from "@/lib/validations/debt";
import { processDebtPayment } from "../../_lib/debt-service";

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
      return await processDebtPayment(
        tx,
        debtId,
        amount,
        note ?? "",
        new Date(paymentDate),
      );
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
