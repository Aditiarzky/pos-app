import { db } from "@/lib/db";
import { sales, customerReturns, debts } from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> },
) {
  try {
    const id = Number((await params).customerId);
    if (isNaN(id)) return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });

    const [[salesRes], [retRes], [debtRes]] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(sales).where(eq(sales.customerId, id)),
      db.select({ count: sql<number>`count(*)` }).from(customerReturns).where(eq(customerReturns.customerId, id)),
      db.select({ count: sql<number>`count(*)` }).from(debts).where(eq(debts.customerId, id)),
    ]);

    const salesCount = Number(salesRes?.count ?? 0);
    const retCount = Number(retRes?.count ?? 0);
    const debtCount = Number(debtRes?.count ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        hasRelations: salesCount > 0 || retCount > 0 || debtCount > 0,
        relations: [
          { label: "Transaksi Penjualan", count: salesCount },
          { label: "Retur Pelanggan", count: retCount },
          { label: "Hutang", count: debtCount },
        ],
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
