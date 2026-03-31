import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sales, customers, customerBalanceMutations, debts } from "@/drizzle/schema";
import { eq, and, not, sql } from "drizzle-orm";
import {
  PakasirWebhookPayload,
  verifyPakasirTransaction,
} from "@/lib/pakasir";
import { processDebtPayment } from "../debts/_lib/debt-service";

/**
 * POST /api/pakasir-webhook
 *
 * Endpoint ini menerima notifikasi dari Pakasir ketika customer berhasil membayar via QRIS.
 * Daftarkan URL ini di dashboard Pakasir: https://domain-kamu.com/api/pakasir-webhook
 *
 * Flow:
 * 1. Terima payload dari Pakasir
 * 2. Verifikasi project slug
 * 3. Double-check ke API Pakasir (jangan percaya webhook mentah)
 * 4. Update status sale menjadi "completed"
 * 5. Update totalPaid di sale
 */
export async function POST(request: NextRequest) {
  try {
    const body: PakasirWebhookPayload = await request.json();
    const { order_id, amount, status, project } = body;

    // 1. Validasi project slug
    if (project !== process.env.PAKASIR_PROJECT) {
      console.warn(`[Pakasir Webhook] Invalid project: ${project}`);
      return NextResponse.json(
        { error: "Invalid project" },
        { status: 400 },
      );
    }

    // 2. Hanya proses status "completed"
    if (status !== "completed") {
      return NextResponse.json({ ok: true, message: "Status ignored" });
    }

    // 3. Double-check ke API Pakasir untuk keamanan
    let verification;
    try {
      verification = await verifyPakasirTransaction(order_id, amount);
    } catch (verifyError) {
      console.error("[Pakasir Webhook] Verification failed:", verifyError);
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 400 },
      );
    }

    if (verification.transaction?.status !== "completed") {
      console.warn(
        `[Pakasir Webhook] Transaction ${order_id} not completed in Pakasir system`,
      );
      return NextResponse.json(
        { error: "Transaction not completed" },
        { status: 400 },
      );
    }

    // 4. Cari sale berdasarkan qrisOrderId (= invoiceNumber yang kita kirim ke Pakasir)
    const existingSale = await db.query.sales.findFirst({
      where: and(
        eq(sales.qrisOrderId, order_id),
        not(sales.isArchived),
      ),
      with: {
        customer: true,
      },
    });

    if (!existingSale) {
      console.warn(`[Pakasir Webhook] Sale not found for order_id: ${order_id}`);
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 },
      );
    }

    // 5. Idempotency: skip jika sudah completed
    if (existingSale.status === "completed") {
      console.log(`[Pakasir Webhook] Sale ${order_id} already completed, skipping`);
      return NextResponse.json({ ok: true, message: "Already completed" });
    }

    // 6. Validasi amount: amount dari Pakasir harus >= totalPrice - totalBalanceUsed
    const expectedAmount =
      Number(existingSale.totalPrice) - Number(existingSale.totalBalanceUsed);

    if (amount < Math.round(expectedAmount)) {
      console.warn(
        `[Pakasir Webhook] Amount mismatch for ${order_id}: expected ${expectedAmount}, got ${amount}`,
      );
      return NextResponse.json(
        { error: "Amount mismatch" },
        { status: 400 },
      );
    }

    // 7. Update sale: status -> completed, totalPaid, totalReturn
    const paidAmount = amount; // amount dari Pakasir (sudah termasuk fee, tapi kita pakai totalPrice)
    const netTotal = expectedAmount;
    const surplus = paidAmount - netTotal;

    await db.transaction(async (tx) => {
      await tx
        .update(sales)
        .set({
          status: "completed",
          totalPaid: netTotal.toFixed(2), // catat sebesar harga sebenarnya
          totalReturn: "0",               // QRIS tidak ada kembalian fisik
        })
        .where(eq(sales.id, existingSale.id));

      // 8. Jika ada surplus dan customer terdaftar, proses bayar hutang lama
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
            `Dibayar otomatis dari QRIS ${existingSale.invoiceNumber}`,
          );

          remainingSurplus -= payAmount;
        }

        // Sisa surplus setelah bayar hutang -> masuk credit balance customer
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
              note: `Sisa QRIS dari ${existingSale.invoiceNumber}`,
            });
          }
        }
      }
    });

    console.log(`[Pakasir Webhook] Sale ${order_id} successfully completed`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Pakasir Webhook] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
