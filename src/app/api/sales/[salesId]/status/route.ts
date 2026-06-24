import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { and, eq, sql } from "drizzle-orm";
import {
  sales,
  saleItems,
  products,
  stockMutations,
  productVariants,
  customers,
  debts,
  customerBalanceMutations,
} from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { voidCustomerReturn } from "../../../customer-returns/_lib/return-service";
import { processDebtPayment } from "../../../debts/_lib/debt-service";

// PATCH /api/sales/[salesId]/status
// body: { action: "complete" | "cancel", userId: number }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ salesId: string }> },
) {
  try {
    const { salesId } = await params;
    const saleId = Number(salesId);
    if (isNaN(saleId)) {
      return NextResponse.json({ success: false, error: "ID tidak valid" }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body as { action: "complete" | "cancel" };

    if (action !== "complete" && action !== "cancel") {
      return NextResponse.json({ success: false, error: "Action tidak valid" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      const existingSale = await tx.query.sales.findFirst({
        where: eq(sales.id, saleId),
        with: { customerReturns: true },
      });

      if (!existingSale) throw new Error("Penjualan tidak ditemukan");
      if (existingSale.isArchived) throw new Error("Penjualan sudah dibatalkan");
      if (existingSale.status !== "pending_payment") {
        throw new Error("Hanya transaksi berstatus PENDING yang dapat diubah");
      }

      if (action === "complete") {
        // Tentukan status akhir berdasarkan apakah ada hutang
        const existingDebt = await tx.query.debts.findFirst({
          where: eq(debts.saleId, saleId),
        });
        const finalStatus = existingDebt ? "debt" : "completed";

        const [updated] = await tx
          .update(sales)
          .set({ status: finalStatus })
          .where(eq(sales.id, saleId))
          .returning();
        return updated;
      }

      // action === "cancel": revert stok, batalkan hutang, void returns
      const items = await tx.select().from(saleItems).where(eq(saleItems.saleId, saleId));

      for (const item of items) {
        const variantData = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, item.variantId),
        });
        if (variantData) {
          const qtyToRevert = Number(item.qty) * Number(variantData.conversionToBase);
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} + ${qtyToRevert.toFixed(3)}`, updatedAt: new Date() })
            .where(eq(products.id, item.productId));

          await tx.insert(stockMutations).values({
            productId: item.productId,
            variantId: item.variantId,
            type: "sale_cancel",
            qtyBaseUnit: qtyToRevert.toFixed(4),
            unitFactorAtMutation: variantData.conversionToBase,
            reference: `VOID-${existingSale.invoiceNumber}`,
            userId: existingSale.userId,
          });
        }
      }

      // Kembalikan saldo customer jika digunakan
      if (existingSale.customerId && Number(existingSale.totalBalanceUsed) > 0) {
        const customerBefore = await tx.query.customers.findFirst({
          where: eq(customers.id, existingSale.customerId),
        });
        const balanceBefore = Number(customerBefore?.creditBalance ?? 0);
        const balanceAfter = balanceBefore + Number(existingSale.totalBalanceUsed);

        await tx
          .update(customers)
          .set({ creditBalance: sql`${customers.creditBalance} + ${Number(existingSale.totalBalanceUsed).toFixed(2)}` })
          .where(eq(customers.id, existingSale.customerId));

        await tx.insert(customerBalanceMutations).values({
          customerId: existingSale.customerId,
          amount: Number(existingSale.totalBalanceUsed).toFixed(2),
          balanceBefore: balanceBefore.toFixed(2),
          balanceAfter: balanceAfter.toFixed(2),
          type: "sale_cancel_refund",
          referenceId: saleId,
        });
      }

      // Batalkan hutang jika ada
      const existingDebt = await tx.query.debts.findFirst({ where: eq(debts.saleId, saleId) });
      if (existingDebt) {
        await tx
          .update(debts)
          .set({ isActive: false, status: "cancelled" })
          .where(eq(debts.id, existingDebt.id));
      }

      // Void customer returns jika ada
      if (existingSale.customerReturns?.length > 0) {
        for (const ret of existingSale.customerReturns) {
          if (!ret.isArchived) await voidCustomerReturn(tx, ret.id);
        }
      }

      const [cancelled] = await tx
        .update(sales)
        .set({ isArchived: true, status: "cancelled" })
        .where(eq(sales.id, saleId))
        .returning();
      return cancelled;
    });

    return NextResponse.json({
      success: true,
      message: action === "complete" ? "Transaksi berhasil diselesaikan" : "Transaksi berhasil dibatalkan",
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
