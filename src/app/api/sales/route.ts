import { db } from "@/lib/db";
import { sales, saleItems, stockMutations } from "@/drizzle/schema";
import { convertToBaseUnit } from "@/lib/stock";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const result = await db.transaction(async (trx) => {
    const body = await req.json();
    const { invoiceNumber, items, totalPaid, userId } = body;

    const totalPrice = items.reduce((a: number, b: any) => a + b.subtotal, 0);

    const [sale] = await trx
      .insert(sales)
      .values({
        invoiceNumber,
        totalPrice: totalPrice.toString(),
        totalPaid: totalPaid.toString(),
        totalReturn: (totalPaid - totalPrice).toString(),
        userId,
      })
      .returning();

    for (const item of items) {
      await trx.insert(saleItems).values({
        saleId: sale.id,
        productId: item.productId,
        variantId: item.variantId,
        unitId: item.unitId,
        qty: item.qty.toString(),
        priceAtSale: item.price,
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
        type: "sale",
        qtyBaseUnit: (-qtyBase).toString(),
        reference: `INV-${sale.id}`,
        userId,
      });
    }

    return sale;
  });

  return NextResponse.json({ success: true, sale: result });
}
