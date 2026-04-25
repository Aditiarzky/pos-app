import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sales, customers, customerBalanceMutations, debts } from "@/drizzle/schema";
import { eq, and, not, sql } from "drizzle-orm";
import {
  verifyPakasirTransaction,
} from "@/lib/pakasir";
import { processDebtPayment } from "../debts/_lib/debt-service";

/**
 * POST /api/pakasir-verify
 * 
 * Endpoint untuk memverifikasi status pembayaran QRIS langsung ke API Pakasir.
 * Digunakan sebagai fallback jika webhook tidak sampai (misal di localhost).
 */
export async function POST(request: NextRequest) {
  try {
    const { saleId } = await request.json();

    if (!saleId) {
      return NextResponse.json({ success: false, error: "saleId is required" }, { status: 400 });
    }

    // 1. Ambil data sale dari database
    const existingSale = await db.query.sales.findFirst({
      where: and(
        eq(sales.id, Number(saleId)),
        not(sales.isArchived)
      ),
      with: {
        user: { columns: { id: true, name: true } },
        customer: { columns: { id: true, name: true } },
        items: {
          with: {
            product: { columns: { id: true, name: true } },
            productVariant: { columns: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    if (!existingSale) {
      return NextResponse.json({ success: false, error: "Sale not found" }, { status: 404 });
    }

    // 2. Jika sudah completed, langsung return sukses
    if (existingSale.status === "completed") {
      return NextResponse.json({ success: true, data: existingSale });
    }

    if (!existingSale.qrisOrderId) {
      return NextResponse.json({ success: false, error: "Not a QRIS transaction" }, { status: 400 });
    }

    // 3. Hitung expected amount
    const expectedAmount = Number(existingSale.totalPrice) - Number(existingSale.totalBalanceUsed);

    // 4. Tanya ke Pakasir langsung (Active Verification)
    let verification;
    try {
      verification = await verifyPakasirTransaction(existingSale.qrisOrderId, expectedAmount);
    } catch (verifyError) {
      console.error("[Pakasir Verify] Pakasir API error:", verifyError);
      return NextResponse.json({ success: false, error: "Failed to verify with Pakasir" }, { status: 502 });
    }

    // 5. Cek apakah status di Pakasir sudah completed
    if (verification.transaction?.status !== "completed") {
      return NextResponse.json({ 
        success: true, 
        data: existingSale, 
        message: "Payment still pending in Pakasir" 
      });
    }

    // 6. Update database (Logika yang sama dengan webhook)
    const paidAmount = verification.transaction.amount;
    const netTotal = expectedAmount;
    const surplus = paidAmount - netTotal;

    await db.transaction(async (tx) => {
      await tx
        .update(sales)
        .set({
          status: "completed",
          totalPaid: netTotal.toFixed(2),
          totalReturn: "0",
        })
        .where(eq(sales.id, existingSale.id));

      if (surplus > 0 && existingSale.customerId) {
        const activeDebts = await tx.query.debts.findMany({
          where: and(
            eq(debts.customerId, existingSale.customerId),
            not(eq(debts.status, "paid")),
            eq(debts.isActive, true),
          ),
          orderBy: (debts, { asc }) => [asc(debts.createdAt)],
        });

        let remainingSurplus = surplus;
        for (const debt of activeDebts) {
          if (remainingSurplus <= 0) break;
          const currentRemaining = Number(debt.remainingAmount);
          const payAmount = Math.min(currentRemaining, remainingSurplus);

          await processDebtPayment(
            tx,
            debt.id,
            payAmount,
            `Dibayar otomatis dari QRIS ${existingSale.invoiceNumber} (Auto Verify)`,
          );
          remainingSurplus -= payAmount;
        }

        if (remainingSurplus > 0) {
          const customerData = await tx.query.customers.findFirst({
            where: eq(customers.id, existingSale.customerId),
          });

          if (customerData) {
            const balanceBefore = Number(customerData.creditBalance);
            const balanceAfter = balanceBefore + remainingSurplus;

            await tx
              .update(customers)
              .set({
                creditBalance: sql`${customers.creditBalance} + ${remainingSurplus.toFixed(2)}`,
              })
              .where(eq(customers.id, existingSale.customerId));

            await tx.insert(customerBalanceMutations).values({
              customerId: existingSale.customerId,
              amount: remainingSurplus.toFixed(2),
              balanceBefore: balanceBefore.toFixed(2),
              balanceAfter: balanceAfter.toFixed(2),
              type: "qris_surplus",
              referenceId: existingSale.id,
              note: `Sisa QRIS dari ${existingSale.invoiceNumber} (Auto Verify)`,
            });
          }
        }
      }
    });

    // 7. Ambil ulang data sale yang sudah terupdate
    const updatedSale = await db.query.sales.findFirst({
      where: eq(sales.id, existingSale.id),
      with: {
         customer: true,
         user: { columns: { id: true, name: true } },
      }
    });

    console.log(`[Pakasir Verify] Sale ${existingSale.qrisOrderId} successfully verified and completed`);
    return NextResponse.json({ success: true, data: updatedSale });
  } catch (error) {
    console.error("[Pakasir Verify] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
