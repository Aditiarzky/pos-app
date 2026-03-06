import { customers, debts } from "@/drizzle/schema";
import { db } from "@/lib/db";
import {
  formatMeta,
  getSearchAndOrderBasic,
  parsePagination,
} from "@/lib/query-helper";
import { validateCustomerData } from "@/lib/validations/customer";
import { and, eq, not, sql } from "drizzle-orm";
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

    // Get Today boundaries for new customers count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [customersRaw, totalRes, analyticsRes] = await Promise.all([
      db.query.customers.findMany({
        where: searchFilter
          ? and(eq(customers.isActive, true), searchFilter)
          : eq(customers.isActive, true),
        with: {
          debts: {
            where: and(not(eq(debts.status, "paid")), eq(debts.isActive, true)),
            columns: {
              remainingAmount: true,
            },
          },
        },
        orderBy: searchOrder,
        limit: params.limit,
        offset: params.offset,
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(
          searchFilter
            ? and(eq(customers.isActive, true), searchFilter)
            : eq(customers.isActive, true),
        ),
      db
        .select({
          totalCustomers: sql<number>`count(${customers.id})`,
          totalBalance: sql<number>`coalesce(sum(${customers.creditBalance}), 0)`,
          newCustomersToday: sql<number>`count(case when ${customers.createdAt} >= ${today.toISOString()} then 1 end)`,
          totalDebt: sql<number>`(
            select coalesce(sum(${debts.remainingAmount}), 0)
            from ${debts}
            where ${debts.isActive} = true and ${debts.status} != 'paid'
          )`,
        })
        .from(customers)
        .where(eq(customers.isActive, true)),
    ]);

    const analytics = {
      totalCustomers: Number(analyticsRes[0]?.totalCustomers || 0),
      totalBalance: Number(analyticsRes[0]?.totalBalance || 0),
      newCustomersToday: Number(analyticsRes[0]?.newCustomersToday || 0),
      totalDebt: Number(analyticsRes[0]?.totalDebt || 0),
    };

    const customersData = customersRaw.map((customer) => {
      const totalDebt = customer.debts.reduce(
        (acc, debt) => acc + Number(debt.remainingAmount),
        0,
      );
      return {
        ...customer,
        totalDebt,
      };
    });

    const totalCount = Number(totalRes[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: customersData,
      meta: formatMeta(totalCount, params.page, params.limit),
      analytics,
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
