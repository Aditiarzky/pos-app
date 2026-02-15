import { customers } from "@/drizzle/schema";
import { db } from "@/lib/db";
import {
  formatMeta,
  getSearchAndOrderBasic,
  parsePagination,
} from "@/lib/query-helper";
import { validateCustomerData } from "@/lib/validations/customer";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET
export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const { searchFilter, searchOrder } = getSearchAndOrderBasic(
      params.search,
      params.order,
      params.orderBy,
      customers.name,
    );

    const [customersData, totalRes] = await Promise.all([
      db.query.customers.findMany({
        where: and(eq(customers.isActive, true), searchFilter),
        orderBy: searchOrder,
        limit: params.limit,
        offset: params.offset,
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(and(eq(customers.isActive, true), searchFilter)),
    ]);

    const totalCount = Number(totalRes[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: customersData,
      meta: formatMeta(totalCount, params.page, params.limit),
    });
  } catch (error) {
    console.error("fetch customers error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customers" },
      { status: 500 },
    );
  }
}

// POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateCustomerData(body);

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

    const [customer] = await db
      .insert(customers)
      .values(validation.data)
      .returning();

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: customer,
      message: "Customer created successfully",
    });
  } catch (error) {
    console.error("create customer error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create customer" },
      { status: 500 },
    );
  }
}
