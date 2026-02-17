import { suppliers } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { db } from "@/lib/db";
import {
  formatMeta,
  getSearchAndOrderBasic,
  parsePagination,
} from "@/lib/query-helper";
import { validateSupplierData } from "@/lib/validations/supplier";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET
export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const { searchFilter, searchOrder } = getSearchAndOrderBasic(
      params.search,
      params.order,
      params.orderBy,
      suppliers.name,
    );

    const [suppliersData, totalRes] = await Promise.all([
      db.query.suppliers.findMany({
        where: and(eq(suppliers.isActive, true), searchFilter),
        orderBy: searchOrder,
        limit: params.limit,
        offset: params.offset,
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(suppliers)
        .where(and(eq(suppliers.isActive, true), searchFilter)),
    ]);

    const totalCount = Number(totalRes[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: suppliersData,
      meta: formatMeta(totalCount, params.page, params.limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateSupplierData(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.format() || "Unknown error",
        },
        { status: 400 },
      );
    }

    const [supplier] = await db
      .insert(suppliers)
      .values(validation.data)
      .returning();

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: supplier,
      message: "Supplier created successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
