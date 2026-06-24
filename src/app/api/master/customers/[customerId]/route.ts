import {
  customerBalanceMutations,
  customers,
  debts,
  sales,
} from "@/drizzle/schema";
import { db } from "@/lib/db";
import { validateCustomerUpdateData } from "@/lib/validations/customer";
import { verifySession } from "@/lib/auth";
import { and, desc, eq, not, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> },
) {
  try {
    const customerId = parseInt((await params).customerId);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { success: false, error: "Invalid customer ID" },
        { status: 400 },
      );
    }

    const customer = await db.query.customers.findFirst({
      where: and(eq(customers.id, customerId), eq(customers.isActive, true)),
      with: {
        debts: {
          where: and(not(eq(debts.status, "paid")), eq(debts.isActive, true)),
          columns: {
            remainingAmount: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 },
      );
    }

    // Fetch stats and mutations
    const [stats, mutations] = await Promise.all([
      db
        .select({
          totalSales: sql<number>`count(${sales.id})`,
        })
        .from(sales)
        .where(
          and(eq(sales.customerId, customerId), eq(sales.status, "completed")),
        ),
      db.query.customerBalanceMutations.findMany({
        where: eq(customerBalanceMutations.customerId, customerId),
        orderBy: [desc(customerBalanceMutations.createdAt)],
        limit: 50, // Limit for detail view
      }),
    ]);

    const totalDebt = customer.debts.reduce(
      (acc, debt) => acc + Number(debt.remainingAmount),
      0,
    );

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        totalDebt,
        totalSales: Number(stats[0]?.totalSales || 0),
        mutations,
      },
    });
  } catch (error) {
    console.error("fetch customer detail error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customer detail" },
      { status: 500 },
    );
  }
}

// PUT
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> },
) {
  try {
    const customerId = parseInt((await params).customerId);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { success: false, error: "Invalid unit ID" },
        { status: 400 },
      );
    }

    const body = await request.json();

    const validation = validateCustomerUpdateData(body);

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
      .update(customers)
      .set(validation.data)
      .where(eq(customers.id, customerId))
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
      message: "Customer updated successfully",
    });
  } catch (error) {
    console.error("update customer error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update customer" },
      { status: 500 },
    );
  }
}

// DELETE
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> },
) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!session.roles.includes("admin sistem")) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin Sistem role required" }, { status: 403 });
    }

    const { customerId: rawId } = await params;
    const customerId = Number(rawId);
    if (isNaN(customerId)) return NextResponse.json({ success: false, error: "Invalid customer ID" }, { status: 400 });

    await db.delete(customers).where(eq(customers.id, customerId));

    return NextResponse.json({ success: true, message: "Customer berhasil dihapus" });
  } catch (error) {
    console.error("Delete customer error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
