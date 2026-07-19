import { db } from "@/lib/db";
import {
  purchaseOrders,
  sales,
  stockMutations,
  customerReturns,
} from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { verifySession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifySession();
    if (!session || !session.roles.includes("admin sistem")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const id = Number((await params).id);
    if (isNaN(id))
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 },
      );

    const [[poRes], [saleRes], [smRes], [crRes]] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(purchaseOrders)
        .where(eq(purchaseOrders.userId, id)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(sales)
        .where(eq(sales.userId, id)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(stockMutations)
        .where(eq(stockMutations.userId, id)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customerReturns)
        .where(eq(customerReturns.userId, id)),
    ]);

    const poCount = Number(poRes?.count ?? 0);
    const saleCount = Number(saleRes?.count ?? 0);
    const smCount = Number(smRes?.count ?? 0);
    const crCount = Number(crRes?.count ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        hasRelations:
          poCount > 0 || saleCount > 0 || smCount > 0 || crCount > 0,
        relations: [
          { label: "Pembelian", count: poCount },
          { label: "Penjualan", count: saleCount },
          { label: "Mutasi Stok", count: smCount },
          { label: "Retur", count: crCount },
        ],
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
