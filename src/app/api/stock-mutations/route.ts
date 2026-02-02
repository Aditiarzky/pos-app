import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, stockMutations } from "@/drizzle/schema";
import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { formatMeta, parsePagination } from "@/lib/query-helper";
import { handleApiError } from "@/lib/api-utils";
import { StockMutationEnumType } from "@/drizzle/type";

export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const search = request.nextUrl.searchParams.get("search")?.trim() || "";
    const productId = request.nextUrl.searchParams.get("productId");
    const type = request.nextUrl.searchParams.get("type");

    const baseConditions = [];

    if (productId) {
      baseConditions.push(eq(stockMutations.productId, Number(productId)));
    }

    if (type && type !== "all") {
      baseConditions.push(
        eq(stockMutations.type, type as StockMutationEnumType),
      );
    }

    let whereClause = undefined;

    if (search) {
      const searchPattern = `%${search}%`;

      const matchingProducts = await db
        .select({ id: products.id })
        .from(products)
        .where(
          or(
            ilike(products.name, searchPattern),
            ilike(products.sku, searchPattern),
          ),
        );

      const matchingProductIds = matchingProducts.map((p) => p.id);

      const searchCondition =
        matchingProductIds.length > 0
          ? or(
              ilike(stockMutations.reference, searchPattern),
              inArray(stockMutations.productId, matchingProductIds),
            )
          : ilike(stockMutations.reference, searchPattern);
      const allConditions = [...baseConditions, searchCondition];
      whereClause =
        allConditions.length > 0 ? and(...allConditions) : undefined;
    } else {
      whereClause =
        baseConditions.length > 0 ? and(...baseConditions) : undefined;
    }

    const [countResult] = await db
      .select({ value: count() })
      .from(stockMutations)
      .where(whereClause);

    const totalCount = Number(countResult?.value || 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderByField: any = stockMutations.createdAt;
    if (params.orderBy === "qty") orderByField = stockMutations.qtyBaseUnit;
    else if (params.orderBy === "reference")
      orderByField = stockMutations.reference;
    else if (params.orderBy === "type") orderByField = stockMutations.type;

    const orderFn =
      params.order === "desc" ? desc(orderByField) : asc(orderByField);

    const data = await db.query.stockMutations.findMany({
      where: whereClause,
      limit: params.limit,
      offset: params.offset,
      orderBy: orderFn,
      columns: {
        id: true,
        type: true,
        qtyBaseUnit: true,
        reference: true,
        createdAt: true,
      },
      with: {
        product: { columns: { name: true, sku: true } },
        productVariant: {
          columns: { name: true, sku: true },
          with: { unit: { columns: { name: true } } },
        },
        user: { columns: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data,
      meta: formatMeta(totalCount, params.page, params.limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
