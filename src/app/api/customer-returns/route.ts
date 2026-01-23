import { customerReturns } from "@/drizzle/schema";
import { db } from "@/lib/db";
import {
  formatMeta,
  getSearchAndOrderBasic,
  parsePagination,
} from "@/lib/query-helper";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET all customer-returns with search
export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const { searchFilter, searchOrder } = getSearchAndOrderBasic(
      params.search,
      params.order,
      params.orderBy,
      customerReturns.returnNumber
    );

    const [customerReturnsData, totalRes] = await Promise.all([
      db.query.customerReturns.findMany({
        where: and(eq(customerReturns.isArchived, false), searchFilter),
        orderBy: searchOrder,
        limit: params.limit,
        offset: params.offset,
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customerReturns)
        .where(and(eq(customerReturns.isArchived, false), searchFilter)),
    ]);

    const totalCount = Number(totalRes[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: customerReturnsData,
      meta: formatMeta(totalCount, params.page, params.limit),
    });
  } catch (error) {
    console.error("fetch customer-returns error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customer-returns" },
      { status: 500 }
    );
  }
}
