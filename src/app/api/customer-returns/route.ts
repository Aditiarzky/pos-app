import { db } from "@/lib/db";
import {
  customerReturns,
  customerReturnItems,
  stockMutations,
} from "@/drizzle/schema";
import { convertToBaseUnit } from "@/lib/stock";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const result = await db.transaction(async (trx) => {
    const body = await req.json();

    const {
      saleId,
      customerName,
      items,
      totalRefund,
      compensationType,
      userId,
    } = body;

    const [ret] = await trx
      .insert(customerReturns)
      .values({
        saleId,
        customerName,
        totalRefund,
        compensationType,
        userId,
      })
      .returning();

    for (const item of items) {
      await trx.insert(customerReturnItems).values({
        returnId: ret.id,
        variantId: item.variantId,
        qty: item.qty,
        priceAtSale: item.price,
        reason: item.reason,
        returnedToStock: item.returnedToStock,
      });

      const qtyBase = await convertToBaseUnit(
        item.productId,
        item.unitId,
        item.qty
      );

      await trx.insert(stockMutations).values({
        productId: item.productId,
        variantId: item.variantId,
        type: item.returnedToStock ? "return_restock" : "waste",
        qtyBaseUnit: (item.returnedToStock ? qtyBase : -qtyBase).toString(),
        reference: `RET-${ret.id}`,
        userId,
      });
    }

    return ret;
  });

  return NextResponse.json({ success: true, return: result });
}
