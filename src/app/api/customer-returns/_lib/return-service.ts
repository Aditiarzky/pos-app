import {
  customerReturns,
  products,
  stockMutations,
  customers,
  productVariants,
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
          reference: `VOID-${existingReturn.returnNumber} (VOID-${existingReturn.sales.invoiceNumber})`,
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
        reference: `VOID-RET-${existingReturn.returnNumber} (VOID-${existingReturn.sales.invoiceNumber})`,
        userId: existingReturn.userId,
      });
    }
  }

  // 3. Revert Financial Changes (Credit Note)
  if (
    existingReturn.compensationType === "credit_note" &&
    existingReturn.customerId
  ) {
    const refundAmount = Number(existingReturn.totalRefund);
    await tx
      .update(customers)
      .set({
        creditBalance: sql`${customers.creditBalance} - ${refundAmount.toFixed(2)}`,
      })
      .where(eq(customers.id, existingReturn.customerId));
  }

  // 4. Archive the Return
  return await tx
    .update(customerReturns)
    .set({ isArchived: true })
    .where(eq(customerReturns.id, returnId))
    .returning();
}
