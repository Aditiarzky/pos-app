import { db } from "@/lib/db";
import {
  purchaseOrders,
  purchaseItems,
  stockMutations,
} from "@/drizzle/schema";
import { convertToBaseUnit } from "@/lib/stock";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const tx = await db.transaction(async (trx) => {
    const body = await req.json();

    const { supplierId, items, userId } = body;

    const total = items.reduce((a: number, b: any) => a + b.subtotal, 0);

    const [purchase] = await trx
      .insert(purchaseOrders)
      .values({
        supplierId,
        total,
        userId,
      })
      .returning();

    for (const item of items) {
      await trx.insert(purchaseItems).values({
        purchaseId: purchase.id,
        productId: item.productId,
        variantId: item.variantId,
        unitId: item.unitId,
        qty: item.qty,
        price: item.price,
        subtotal: item.subtotal,
      });

      const qtyBase = await convertToBaseUnit(
        item.productId,
        item.unitId,
        item.qty
      );

      await trx.insert(stockMutations).values({
        productId: item.productId,
        variantId: item.variantId,
        type: "purchase",
        qtyBaseUnit: qtyBase.toString(),
        reference: `PO-${purchase.id}`,
        userId,
      });
    }

    return purchase;
  });

  return NextResponse.json({ success: true, purchase: tx });
}
