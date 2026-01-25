import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  products,
  productVariants,
  stockMutations,
  users,
} from "@/drizzle/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { formatMeta, parsePagination } from "@/lib/query-helper";
import { handleApiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const search = request.nextUrl.searchParams.get("search");
    const productId = request.nextUrl.searchParams.get("productId");
    const type = request.nextUrl.searchParams.get("type");

    let whereClause = undefined;
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`),
          ilike(stockMutations.reference, `%${search}%`),
        ),
      );
    }

    if (productId) {
      conditions.push(eq(stockMutations.productId, Number(productId)));
    }

    if (type && type !== "all") {
      conditions.push(eq(stockMutations.type, type as any));
    }

    if (conditions.length > 0) {
      whereClause = and(...conditions);
    }

    const { limit, offset } = params;

    // Get Total Count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(stockMutations)
      .leftJoin(products, eq(stockMutations.productId, products.id))
      .where(whereClause);
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get Data
    const data = await db
      .select({
        id: stockMutations.id,
        type: stockMutations.type,
        qty: stockMutations.qtyBaseUnit,
        reference: stockMutations.reference,
        createdAt: stockMutations.createdAt,
        product: {
          name: products.name,
          sku: products.sku,
        },
        variant: {
          name: productVariants.name,
          sku: productVariants.sku,
        },
        user: {
          name: users.name,
        },
      })
      .from(stockMutations)
      .leftJoin(products, eq(stockMutations.productId, products.id))
      .leftJoin(
        productVariants,
        eq(stockMutations.variantId, productVariants.id),
      )
      .leftJoin(users, eq(stockMutations.userId, users.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(stockMutations.createdAt));

    return NextResponse.json({
      success: true,
      data,
      meta: formatMeta(totalCount, params.page, params.limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
