import { suppliers } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { db } from "@/lib/db";
import {
  formatMeta,
  getSearchAndOrderBasic,
  parsePagination,
} from "@/lib/query-helper";
import { validateSupplierData } from "@/lib/validations/supplier";
import { and, isNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

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
        where: and(isNull(suppliers.deletedAt), searchFilter),
        orderBy: searchOrder,
        limit: params.limit,
        offset: params.offset,
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(suppliers)
        .where(and(isNull(suppliers.deletedAt), searchFilter)),
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
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (
      !session.roles.includes("admin sistem") &&
      !session.roles.includes("admin toko")
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Unauthorized role" },
        { status: 403 },
      );
    }

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
