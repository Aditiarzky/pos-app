import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stockMutations } from "@/drizzle/schema";
import { and, eq, sql } from "drizzle-orm";
import { parsePagination, formatMeta } from "@/lib/query-helper";

export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const { searchParams } = new URL(request.url);

    // Ambil Filter dari Query Params
    const productId = searchParams.get("productId");
    const variantId = searchParams.get("variantId");
    const type = searchParams.get("type"); // misal: 'purchase', 'sale', 'exchange', dll.

    // Inisialisasi Filter
    let filters = [];

    if (productId) {
      filters.push(eq(stockMutations.productId, Number(productId)));
    }
    if (variantId) {
      filters.push(eq(stockMutations.variantId, Number(variantId)));
    }
    if (type) {
      // @ts-ignore - Menangani type enum dari string
      filters.push(eq(stockMutations.type, type));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    // Eksekusi Query secara Parallel
    const [mutationsData, totalRes] = await Promise.all([
      db.query.stockMutations.findMany({
        where: whereClause,
        with: {
          product: {
            columns: {
              id: true,
              name: true,
              sku: true,
            },
          },
          productVariant: {
            columns: {
              id: true,
              name: true,
            },
          },
          user: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
        // Default urutan mutasi terbaru di atas
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        limit: params.limit,
        offset: params.offset,
      }),

      db
        .select({ count: sql<number>`count(*)` })
        .from(stockMutations)
        .where(whereClause),
    ]);

    const totalCount = Number(totalRes[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: mutationsData,
      meta: formatMeta(totalCount, params.page, params.limit),
    });
  } catch (error) {
    console.error("Error fetching stock mutations:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
