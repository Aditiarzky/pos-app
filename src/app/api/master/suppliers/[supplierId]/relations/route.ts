import { db } from "@/lib/db";
import { purchaseOrders, supplierReturns } from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> },
) {
  try {
    const id = Number((await params).supplierId);
    if (isNaN(id)) return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });

    const [[poRes], [srRes]] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(purchaseOrders).where(eq(purchaseOrders.supplierId, id)),
      db.select({ count: sql<number>`count(*)` }).from(supplierReturns).where(eq(supplierReturns.supplierId, id)),
    ]);

    const poCount = Number(poRes?.count ?? 0);
    const srCount = Number(srRes?.count ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        hasRelations: poCount > 0 || srCount > 0,
        relations: [
          { label: "Purchase Order", count: poCount },
          { label: "Retur Supplier", count: srCount },
        ],
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
