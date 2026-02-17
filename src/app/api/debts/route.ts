import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { debts, customers, sales } from "@/drizzle/schema";
import { and, eq, sql, desc, ne, ilike, or } from "drizzle-orm";
import { parsePagination, formatMeta } from "@/lib/query-helper";
import { handleApiError } from "@/lib/api-utils";
import { DebtStatusEnumType } from "@/drizzle/type";

export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Build filters
    const filters = [
      customerId ? eq(debts.customerId, Number(customerId)) : undefined,
      eq(debts.isActive, true), // Only active/not cancelled debts
      status
        ? status === "active"
          ? and(ne(debts.status, "paid"), ne(debts.status, "cancelled"))
          : eq(debts.status, status as DebtStatusEnumType)
        : undefined,
    ].filter(Boolean);

    // Add search filter if present
    if (search) {
      filters.push(
        or(
          ilike(sales.invoiceNumber, `%${search}%`),
          ilike(customers.name, `%${search}%`),
        )!,
      );
    }

    const query = db
      .select({
        id: debts.id,
        saleId: debts.saleId,
        customerId: debts.customerId,
        originalAmount: debts.originalAmount,
        remainingAmount: debts.remainingAmount,
        status: debts.status,
        isActive: debts.isActive,
        deletedAt: debts.deletedAt,
        createdAt: debts.createdAt,
        updatedAt: debts.updatedAt,
        customer: {
          id: customers.id,
          name: customers.name,
        },
        sale: {
          id: sales.id,
          invoiceNumber: sales.invoiceNumber,
          createdAt: sales.createdAt,
        },
      })
      .from(debts)
      .innerJoin(sales, eq(debts.saleId, sales.id))
      .innerJoin(customers, eq(debts.customerId, customers.id))
      .where(and(...filters))
      .orderBy(desc(debts.createdAt))
      .limit(params.limit)
      .offset(params.offset);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(debts)
      .innerJoin(sales, eq(debts.saleId, sales.id))
      .innerJoin(customers, eq(debts.customerId, customers.id))
      .where(and(...filters));

    const [debtsData, totalRes] = await Promise.all([query, countQuery]);

    const totalCount = Number(totalRes[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: debtsData,
      meta: formatMeta(totalCount, params.page, params.limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
