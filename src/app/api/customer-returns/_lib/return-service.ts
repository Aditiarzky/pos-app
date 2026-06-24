import {
  customerReturns,
  products,
  stockMutations,
  customers,
  productVariants,
  customerBalanceMutations,
  sales,
} from "@/drizzle/schema";
import { db } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export async function voidCustomerReturn(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  returnId: number,
) {
  const existingReturn = await tx.query.customerReturns.findFirst({
    where: eq(customerReturns.id, returnId),
    with: {
      items: true,
      exchangeItems: true,
      sales: true,
    },
  });

  if (!existingReturn) throw new Error("Return transaction not found");
  if (existingReturn.isArchived) return; // Skip if already voided

  // 1. Revert Stock Changes from Return Items (Barang Masuk -> Keluar lagi)
  for (const item of existingReturn.items) {
    if (item.returnedToStock) {
      const variant = await tx.query.productVariants.findFirst({
        where: eq(productVariants.id, item.variantId),
      });
      if (variant) {
        const qtyBase = Number(item.qty) * Number(variant.conversionToBase);
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${qtyBase.toFixed(3)}` })
          .where(eq(products.id, item.productId));

        await tx.insert(stockMutations).values({
          productId: item.productId,
          variantId: item.variantId,
          type: "return_cancel",
          qtyBaseUnit: (-qtyBase).toFixed(4),
          unitFactorAtMutation: variant.conversionToBase,
          reference: `VOID-${existingReturn.returnNumber}`,
          userId: existingReturn.userId,
        });
      }
    }
  }

  // 2. Revert Stock Changes from Exchange Items (Barang Keluar -> Masuk lagi)
  for (const item of existingReturn.exchangeItems) {
    const variant = await tx.query.productVariants.findFirst({
      where: eq(productVariants.id, item.variantId),
    });
    if (variant) {
      const qtyBase = Number(item.qty) * Number(variant.conversionToBase);
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} + ${qtyBase.toFixed(3)}` })
        .where(eq(products.id, item.productId));

      await tx.insert(stockMutations).values({
        productId: item.productId,
        variantId: item.variantId,
        type: "exchange_cancel",
        qtyBaseUnit: qtyBase.toFixed(4),
        unitFactorAtMutation: variant.conversionToBase,
        reference: `VOID-${existingReturn.returnNumber}`,
        userId: existingReturn.userId,
      });
    }
  }

  // 3. Revert Financial Changes (Balance)
  //
  // Kapan perlu revert saldo?
  // - credit_note  : Saldo penuh (totalRefund) sudah dipindah ke customer -> harus dikurangi
  // - exchange + credit_balance + totalRefund > 0 : Surplus sudah masuk ke saldo -> harus dikurangi
  // - refund       : Uang sudah dikembalikan tunai secara fisik -> tidak ada saldo yang perlu dibalik
  // - exchange + cash surplus / impas / tagih : Tidak ada perubahan saldo -> tidak perlu dibalik

  const refundAmount = Number(existingReturn.totalRefund);

  const shouldRevertBalance =
    existingReturn.customerId !== null &&
    refundAmount > 0 &&
    (existingReturn.compensationType === "credit_note" ||
      (existingReturn.compensationType === "exchange" &&
        existingReturn.surplusStrategy === "credit_balance"));

  if (shouldRevertBalance && existingReturn.customerId) {
    const customerData = await tx.query.customers.findFirst({
      where: eq(customers.id, existingReturn.customerId),
    });

    if (customerData) {
      const balanceBefore = Number(customerData.creditBalance);
      // Pastikan tidak minus (safety guard)
      const balanceAfter = Math.max(0, balanceBefore - refundAmount);

      await tx
        .update(customers)
        .set({ creditBalance: balanceAfter.toFixed(2) })
        .where(eq(customers.id, existingReturn.customerId));

      // Log mutasi saldo void
      await tx.insert(customerBalanceMutations).values({
        customerId: existingReturn.customerId,
        amount: (-refundAmount).toFixed(2),
        balanceBefore: balanceBefore.toFixed(2),
        balanceAfter: balanceAfter.toFixed(2),
        type:
          existingReturn.compensationType === "credit_note"
            ? "return_void"
            : "exchange_surplus_void",
        referenceId: existingReturn.id,
      });
    }
  }

  // 4. Archive the Return
  const [archived] = await tx
    .update(customerReturns)
    .set({ isArchived: true })
    .where(eq(customerReturns.id, returnId))
    .returning();

  // 5. Re-evaluate sale status: if sale was "refunded", check if it should revert
  if (existingReturn.saleId) {
    const sale = await tx.query.sales.findFirst({
      where: eq(sales.id, existingReturn.saleId),
      with: {
        items: true,
        customerReturns: {
          where: eq(customerReturns.isArchived, false),
          with: { items: true },
        },
      },
    });

    if (sale && sale.status === "refunded") {
      const stillFullyReturned = sale.items.every((saleItem) => {
        const totalReturnedQty = sale.customerReturns.reduce((sum, ret) => {
          const itemMatch = ret.items.find(
            (i) => i.variantId === saleItem.variantId,
          );
          return sum + (itemMatch ? Number(itemMatch.qty) : 0);
        }, 0);
        return totalReturnedQty >= Number(saleItem.qty);
      });

      if (!stillFullyReturned) {
        const hasDebt =
          Number(sale.totalPrice) > Number(sale.totalPaid) + Number(sale.totalBalanceUsed || 0);
        await tx
          .update(sales)
          .set({ status: hasDebt ? "pending_payment" : "completed" })
          .where(eq(sales.id, existingReturn.saleId));
      }
    }
  }

  return archived;
}
