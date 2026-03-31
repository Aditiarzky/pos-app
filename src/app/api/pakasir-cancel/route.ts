import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  sales,
  saleItems,
  products,
  stockMutations,
  productVariants,
  customers,
  customerBalanceMutations,
} from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { cancelPakasirTransaction } from "@/lib/pakasir";
import { handleApiError } from "@/lib/api-utils";

/**
 * POST /api/pakasir-cancel
 *
 * Membatalkan transaksi QRIS yang masih pending_payment:
 * 1. Call Pakasir transactioncancel API (sesuai docs C.5)
 * 2. Kembalikan stok produk
 * 3. Kembalikan saldo customer jika ada
 * 4. Set sale status → "cancelled"
 *
 * Body: { saleId: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const saleId = Number(body.saleId);

    if (!saleId || isNaN(saleId)) {
      return NextResponse.json(
        { success: false, error: "saleId tidak valid" },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      // 1. Ambil data sale
      const sale = await tx.query.sales.findFirst({
        where: eq(sales.id, saleId),
      });

      if (!sale) {
        throw new Error("Sale tidak ditemukan");
      }

      if (sale.isArchived) {
        throw new Error("Sale sudah dibatalkan sebelumnya");
      }

      if (sale.status !== "pending_payment") {
        throw new Error(
          `Hanya transaksi berstatus "pending_payment" yang bisa dibatalkan lewat sini. ` +
          `Status saat ini: "${sale.status}"`,
        );
      }

      // 2. Call Pakasir cancel API — fire and forget, tidak throw kalau gagal
      // (transaksi di sisi kita tetap dibatalkan meskipun Pakasir error)
      if (sale.qrisOrderId) {
        const netAmount =
          Number(sale.totalPrice) - Number(sale.totalBalanceUsed ?? 0);

        try {
          await cancelPakasirTransaction(sale.qrisOrderId, netAmount);
        } catch (pakasirErr) {
          // Log saja, jangan throw — cancel di DB tetap jalan
          console.warn(
            `[pakasir-cancel] Pakasir cancel API gagal untuk ${sale.qrisOrderId}:`,
            pakasirErr,
          );
        }
      }

      // 3. Kembalikan stok untuk setiap item
      const items = await tx
        .select()
        .from(saleItems)
        .where(eq(saleItems.saleId, saleId));

      for (const item of items) {
        const variantData = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, item.variantId),
        });

        if (variantData) {
          const qtyToRevert =
            Number(item.qty) * Number(variantData.conversionToBase);

          // Kembalikan stok
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${qtyToRevert.toFixed(3)}`,
            })
            .where(eq(products.id, item.productId));

          // Catat mutasi stok pembatalan
          await tx.insert(stockMutations).values({
            productId: item.productId,
            variantId: item.variantId,
            type: "sale_cancel",
            qtyBaseUnit: qtyToRevert.toFixed(4),
            unitFactorAtMutation: variantData.conversionToBase,
            reference: `VOID-${sale.invoiceNumber}`,
            userId: sale.userId,
          });
        }
      }

      // 4. Kembalikan saldo customer jika ada yang dipakai
      const balanceUsed = Number(sale.totalBalanceUsed ?? 0);
      if (sale.customerId && balanceUsed > 0) {
        const customerData = await tx.query.customers.findFirst({
          where: eq(customers.id, sale.customerId),
        });

        if (customerData) {
          const balanceBefore = Number(customerData.creditBalance);
          const balanceAfter = balanceBefore + balanceUsed;

          await tx
            .update(customers)
            .set({
              creditBalance: sql`${customers.creditBalance} + ${balanceUsed.toFixed(2)}`,
            })
            .where(eq(customers.id, sale.customerId));

          await tx.insert(customerBalanceMutations).values({
            customerId: sale.customerId,
            amount: balanceUsed.toFixed(2),
            balanceBefore: balanceBefore.toFixed(2),
            balanceAfter: balanceAfter.toFixed(2),
            type: "qris_cancel_refund",
            referenceId: sale.id,
            note: `Saldo dikembalikan dari pembatalan QRIS ${sale.invoiceNumber}`,
          });
        }
      }

      // 5. Archive dan cancel sale
      const [cancelled] = await tx
        .update(sales)
        .set({
          isArchived: true,
          status: "cancelled",
          deletedAt: new Date(),
        })
        .where(eq(sales.id, saleId))
        .returning();

      return cancelled;
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi QRIS berhasil dibatalkan",
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
