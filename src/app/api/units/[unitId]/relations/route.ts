import { db } from "@/lib/db";
import { products, productVariants } from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ unitId: string }> },
) {
  try {
    const id = Number((await params).unitId);
    if (isNaN(id)) return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });

    const [[prodRes], [varRes]] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.baseUnitId, id)),
      db.select({ count: sql<number>`count(*)` }).from(productVariants).where(eq(productVariants.unitId, id)),
    ]);

    const prodCount = Number(prodRes?.count ?? 0);
    const varCount = Number(varRes?.count ?? 0);
    const hasRelations = prodCount > 0 || varCount > 0;

    return NextResponse.json({
      success: true,
      data: {
        hasRelations,
        relations: [
          { label: "Produk (satuan dasar)", count: prodCount },
          { label: "Varian produk", count: varCount },
        ],
      },
    });
  } catch (e) { return handleApiError(e); }
}
