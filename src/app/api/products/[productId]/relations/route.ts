import { db } from "@/lib/db";
import { purchaseItems, saleItems, customerReturnItems, productVariants } from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const id = Number((await params).productId);
    if (isNaN(id)) return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });

    const [[varRes], [piRes], [siRes], [riRes]] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(productVariants).where(eq(productVariants.productId, id)),
      db.select({ count: sql<number>`count(*)` }).from(purchaseItems).where(eq(purchaseItems.productId, id)),
      db.select({ count: sql<number>`count(*)` }).from(saleItems).where(eq(saleItems.productId, id)),
      db.select({ count: sql<number>`count(*)` }).from(customerReturnItems).where(eq(customerReturnItems.productId, id)),
    ]);

    const varCount = Number(varRes?.count ?? 0);
    const piCount = Number(piRes?.count ?? 0);
    const siCount = Number(siRes?.count ?? 0);
    const riCount = Number(riRes?.count ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        hasRelations: piCount > 0 || siCount > 0 || riCount > 0,
        relations: [
          { label: "Varian", count: varCount },
          { label: "Item Pembelian", count: piCount },
          { label: "Item Penjualan", count: siCount },
          { label: "Item Retur", count: riCount },
        ],
      },
    });
  } catch (e) { return handleApiError(e); }
}
