import { db } from "@/lib/db";
import { products } from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  try {
    const id = Number((await params).categoryId);
    if (isNaN(id)) return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });

    const [res] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.categoryId, id));
    const count = Number(res?.count ?? 0);

    return NextResponse.json({ success: true, data: { hasRelations: count > 0, relations: [{ label: "Produk", count }] } });
  } catch (e) { return handleApiError(e); }
}
