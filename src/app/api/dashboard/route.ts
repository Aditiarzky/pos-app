import { NextResponse } from "next/server";
import { and, asc, desc, eq, gte, lte, not, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, debts, products, saleItems, sales } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";

const getMonthRange = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return { start, end };
};

export async function GET() {
  try {
    const now = new Date();
    const { start: currentMonthStart, end: currentMonthEnd } =
      getMonthRange(now);

    const previousMonthRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const { start: previousMonthStart, end: previousMonthEnd } =
      getMonthRange(previousMonthRef);

    const trendStart = new Date();
    trendStart.setDate(now.getDate() - 29);
    trendStart.setHours(0, 0, 0, 0);

    const validSalesFilter = and(
      not(sales.isArchived),
      not(eq(sales.status, "cancelled")),
      not(eq(sales.status, "refunded")),
    );

    const currentSalesFilter = and(
      validSalesFilter,
      gte(sales.createdAt, currentMonthStart),
      lte(sales.createdAt, currentMonthEnd),
    );

    const previousSalesFilter = and(
      validSalesFilter,
      gte(sales.createdAt, previousMonthStart),
      lte(sales.createdAt, previousMonthEnd),
    );

    const activeDebtFilter = and(
      eq(debts.isActive, true),
      sql`${debts.deletedAt} is null`,
      not(eq(debts.status, "paid")),
      not(eq(debts.status, "cancelled")),
    );

    const [
      currentSales,
      previousSales,
      currentProfit,
      previousProfit,
      currentTransactions,
      previousTransactions,
      activeDebt,
      previousDebt,
      salesTrend,
      lowStockProducts,
      unpaidDebts,
    ] = await Promise.all([
      db
        .select({
          totalSales: sql<string>`coalesce(sum(${sales.totalPrice}), 0)`,
        })
        .from(sales)
        .where(currentSalesFilter),
      db
        .select({
          totalSales: sql<string>`coalesce(sum(${sales.totalPrice}), 0)`,
        })
        .from(sales)
        .where(previousSalesFilter),
      db
        .select({
          totalProfit: sql<string>`coalesce(sum(${saleItems.subtotal} - (${saleItems.costAtSale} * ${saleItems.qty} * ${saleItems.unitFactorAtSale})), 0)`,
        })
        .from(saleItems)
        .innerJoin(sales, eq(sales.id, saleItems.saleId))
        .where(currentSalesFilter),
      db
        .select({
          totalProfit: sql<string>`coalesce(sum(${saleItems.subtotal} - (${saleItems.costAtSale} * ${saleItems.qty} * ${saleItems.unitFactorAtSale})), 0)`,
        })
        .from(saleItems)
        .innerJoin(sales, eq(sales.id, saleItems.saleId))
        .where(previousSalesFilter),
      db
        .select({
          totalTransactions: sql<number>`count(*)`,
        })
        .from(sales)
        .where(currentSalesFilter),
      db
        .select({
          totalTransactions: sql<number>`count(*)`,
        })
        .from(sales)
        .where(previousSalesFilter),
      db
        .select({
          totalDebt: sql<string>`coalesce(sum(${debts.remainingAmount}), 0)`,
        })
        .from(debts)
        .where(activeDebtFilter),
      db
        .select({
          totalDebt: sql<string>`coalesce(sum(${debts.remainingAmount}), 0)`,
        })
        .from(debts)
        .where(
          and(
            activeDebtFilter,
            gte(debts.createdAt, previousMonthStart),
            lte(debts.createdAt, previousMonthEnd),
          ),
        ),
      db
        .select({
          date: sql<string>`to_char(${sales.createdAt}, 'YYYY-MM-DD')`,
          totalSales: sql<string>`coalesce(sum(${sales.totalPrice}), 0)`,
        })
        .from(sales)
        .where(
          and(
            validSalesFilter,
            gte(sales.createdAt, trendStart),
            lte(sales.createdAt, now),
          ),
        )
        .groupBy(sql`to_char(${sales.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(asc(sql`to_char(${sales.createdAt}, 'YYYY-MM-DD')`)),
      db
        .select({
          productId: products.id,
          productName: products.name,
          stock: products.stock,
          minStock: products.minStock,
          image: products.image,
        })
        .from(products)
        .where(
          and(
            eq(products.isActive, true),
            sql`${products.deletedAt} is null`,
            sql`${products.minStock} > 0`,
            sql`${products.stock} < ${products.minStock}`,
          ),
        )
        .orderBy(
          asc(
            sql`${products.stock}::numeric / nullif(${products.minStock}::numeric, 0)`,
          ),
        )
        .limit(5),
      db
        .select({
          debtId: debts.id,
          customerName: customers.name,
          remainingAmount: debts.remainingAmount,
          ageDays: sql<number>`extract(day from now() - ${debts.createdAt})::int`,
        })
        .from(debts)
        .innerJoin(customers, eq(customers.id, debts.customerId))
        .where(activeDebtFilter)
        .orderBy(desc(debts.createdAt))
        .limit(10),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalSalesMonth: Number(currentSales[0]?.totalSales ?? 0),
          prevTotalSalesMonth: Number(previousSales[0]?.totalSales ?? 0),
          totalProfitMonth: Number(currentProfit[0]?.totalProfit ?? 0),
          prevTotalProfitMonth: Number(previousProfit[0]?.totalProfit ?? 0),
          totalTransactionsMonth: Number(
            currentTransactions[0]?.totalTransactions ?? 0,
          ),
          prevTotalTransactionsMonth: Number(
            previousTransactions[0]?.totalTransactions ?? 0,
          ),
          totalActiveDebt: Number(activeDebt[0]?.totalDebt ?? 0),
          prevTotalActiveDebt: Number(previousDebt[0]?.totalDebt ?? 0),
        },
        salesTrend: salesTrend.map((item) => ({
          date: item.date,
          totalSales: Number(item.totalSales ?? 0),
        })),
        alerts: {
          lowStockProducts: lowStockProducts.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            stock: Number(item.stock ?? 0),
            minStock: Number(item.minStock ?? 0),
            image: item.image,
          })),
          unpaidDebts: unpaidDebts.map((item) => ({
            debtId: item.debtId,
            customerName: item.customerName,
            remainingAmount: Number(item.remainingAmount ?? 0),
            ageDays: Number(item.ageDays ?? 0),
          })),
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
