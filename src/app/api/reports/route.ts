import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, lte, not, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, purchaseOrders, saleItems, sales } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";

type ReportType = "overview" | "sales" | "purchase";

const parseDateRange = (request: NextRequest) => {
  const startDate = request.nextUrl.searchParams.get("startDate");
  const endDate = request.nextUrl.searchParams.get("endDate");

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  const start = startDate
    ? new Date(`${startDate}T00:00:00.000Z`)
    : defaultStart;
  const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : defaultEnd;

  return {
    start,
    end,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};

const parseType = (request: NextRequest): ReportType => {
  const reportType = request.nextUrl.searchParams.get("type");
  if (reportType === "sales" || reportType === "purchase") return reportType;
  return "overview";
};

export async function GET(request: NextRequest) {
  try {
    const { start, end, startDate, endDate } = parseDateRange(request);
    const type = parseType(request);

    // Calculate previous period for comparison
    const durationMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    const salesFilter = and(
      not(sales.isArchived),
      not(eq(sales.status, "cancelled")),
      not(eq(sales.status, "refunded")),
      gte(sales.createdAt, start),
      lte(sales.createdAt, end),
    );

    const prevSalesFilter = and(
      not(sales.isArchived),
      not(eq(sales.status, "cancelled")),
      not(eq(sales.status, "refunded")),
      gte(sales.createdAt, prevStart),
      lte(sales.createdAt, prevEnd),
    );

    const purchaseFilter = and(
      not(purchaseOrders.isArchived),
      gte(purchaseOrders.createdAt, start),
      lte(purchaseOrders.createdAt, end),
    );

    const prevPurchaseFilter = and(
      not(purchaseOrders.isArchived),
      gte(purchaseOrders.createdAt, prevStart),
      lte(purchaseOrders.createdAt, prevEnd),
    );

    // Helper to build aggregate queries
    const getSalesTotals = (filter: ReturnType<typeof and>) =>
      db
        .select({
          totalSales: sql<string>`coalesce(sum(${sales.totalPrice}), 0)`,
          totalTransactions: sql<number>`count(*)`,
        })
        .from(sales)
        .where(filter);

    const getSalesProfit = (filter: ReturnType<typeof and>) =>
      db
        .select({
          totalProfit: sql<string>`coalesce(sum(${saleItems.subtotal} - (${saleItems.costAtSale} * ${saleItems.qty} * ${saleItems.unitFactorAtSale})), 0)`,
        })
        .from(saleItems)
        .innerJoin(sales, eq(sales.id, saleItems.saleId))
        .where(filter);

    const getPurchaseTotals = (filter: ReturnType<typeof and>) =>
      db
        .select({
          totalPurchases: sql<string>`coalesce(sum(${purchaseOrders.total}), 0)`,
          totalTransactions: sql<number>`count(*)`,
        })
        .from(purchaseOrders)
        .where(filter);

    if (type === "sales") {
      const [
        salesBaseTotals,
        salesProfit,
        prevSalesBaseTotals,
        prevSalesProfit,
        topProducts,
        dailySales,
      ] = await Promise.all([
        getSalesTotals(salesFilter),
        getSalesProfit(salesFilter),
        getSalesTotals(prevSalesFilter),
        getSalesProfit(prevSalesFilter),
        db
          .select({
            productId: products.id,
            productName: products.name,
            qtySold: sql<string>`coalesce(sum(${saleItems.qty}), 0)`,
            revenue: sql<string>`coalesce(sum(${saleItems.subtotal}), 0)`,
          })
          .from(saleItems)
          .innerJoin(sales, eq(sales.id, saleItems.saleId))
          .innerJoin(products, eq(products.id, saleItems.productId))
          .where(salesFilter)
          .groupBy(products.id, products.name)
          .orderBy(desc(sql`sum(${saleItems.qty})`))
          .limit(10),
        db
          .select({
            date: sql<string>`to_char(${sales.createdAt}, 'YYYY-MM-DD')`,
            totalSales: sql<string>`coalesce(sum(${sales.totalPrice}), 0)`,
            totalTransactions: sql<number>`count(*)`,
          })
          .from(sales)
          .where(salesFilter)
          .groupBy(sql`to_char(${sales.createdAt}, 'YYYY-MM-DD')`)
          .orderBy(sql`to_char(${sales.createdAt}, 'YYYY-MM-DD') asc`),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalSales: Number(salesBaseTotals[0]?.totalSales || 0),
            totalTransactions: Number(
              salesBaseTotals[0]?.totalTransactions || 0,
            ),
            totalProfit: Number(salesProfit[0]?.totalProfit || 0),
            prevTotalSales: Number(prevSalesBaseTotals[0]?.totalSales || 0),
            prevTotalTransactions: Number(
              prevSalesBaseTotals[0]?.totalTransactions || 0,
            ),
            prevTotalProfit: Number(prevSalesProfit[0]?.totalProfit || 0),
          },
          topProducts,
          daily: dailySales,
        },
        filter: { startDate, endDate },
      });
    }

    if (type === "purchase") {
      const [purchaseTotals, prevPurchaseTotals, dailyPurchases] =
        await Promise.all([
          getPurchaseTotals(purchaseFilter),
          getPurchaseTotals(prevPurchaseFilter),
          db
            .select({
              date: sql<string>`to_char(${purchaseOrders.createdAt}, 'YYYY-MM-DD')`,
              totalPurchases: sql<string>`coalesce(sum(${purchaseOrders.total}), 0)`,
              totalTransactions: sql<number>`count(*)`,
            })
            .from(purchaseOrders)
            .where(purchaseFilter)
            .groupBy(sql`to_char(${purchaseOrders.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(
              sql`to_char(${purchaseOrders.createdAt}, 'YYYY-MM-DD') asc`,
            ),
        ]);

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            ...purchaseTotals[0],
            prevTotalPurchases: Number(
              prevPurchaseTotals[0]?.totalPurchases || 0,
            ),
            prevTotalTransactions: Number(
              prevPurchaseTotals[0]?.totalTransactions || 0,
            ),
          },
          daily: dailyPurchases,
        },
        filter: { startDate, endDate },
      });
    }

    const [
      salesBaseTotals,
      salesProfit,
      purchaseTotals,
      prevSalesBaseTotals,
      prevSalesProfit,
      prevPurchaseTotals,
      topProducts,
      dailySales,
      dailyPurchases,
    ] = await Promise.all([
      getSalesTotals(salesFilter),
      getSalesProfit(salesFilter),
      getPurchaseTotals(purchaseFilter),
      getSalesTotals(prevSalesFilter),
      getSalesProfit(prevSalesFilter),
      getPurchaseTotals(prevPurchaseFilter),
      db
        .select({
          productId: products.id,
          productName: products.name,
          qtySold: sql<string>`coalesce(sum(${saleItems.qty}), 0)`,
          revenue: sql<string>`coalesce(sum(${saleItems.subtotal}), 0)`,
        })
        .from(saleItems)
        .innerJoin(sales, eq(sales.id, saleItems.saleId))
        .innerJoin(products, eq(products.id, saleItems.productId))
        .where(salesFilter)
        .groupBy(products.id, products.name)
        .orderBy(desc(sql`sum(${saleItems.qty})`))
        .limit(5),
      db
        .select({
          date: sql<string>`to_char(${sales.createdAt}, 'YYYY-MM-DD')`,
          totalSales: sql<string>`coalesce(sum(${sales.totalPrice}), 0)`,
        })
        .from(sales)
        .where(salesFilter)
        .groupBy(sql`to_char(${sales.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${sales.createdAt}, 'YYYY-MM-DD') asc`),
      db
        .select({
          date: sql<string>`to_char(${purchaseOrders.createdAt}, 'YYYY-MM-DD')`,
          totalPurchases: sql<string>`coalesce(sum(${purchaseOrders.total}), 0)`,
        })
        .from(purchaseOrders)
        .where(purchaseFilter)
        .groupBy(sql`to_char(${purchaseOrders.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${purchaseOrders.createdAt}, 'YYYY-MM-DD') asc`),
    ]);

    const summary = {
      totalSales: Number(salesBaseTotals[0]?.totalSales || 0),
      totalPurchases: Number(purchaseTotals[0]?.totalPurchases || 0),
      totalProfit: Number(salesProfit[0]?.totalProfit || 0),
      totalSalesTransactions: Number(
        salesBaseTotals[0]?.totalTransactions || 0,
      ),
      totalPurchaseTransactions: Number(
        purchaseTotals[0]?.totalTransactions || 0,
      ),
      totalTransactions:
        Number(salesBaseTotals[0]?.totalTransactions || 0) +
        Number(purchaseTotals[0]?.totalTransactions || 0),

      // Comparison data
      prevTotalSales: Number(prevSalesBaseTotals[0]?.totalSales || 0),
      prevTotalPurchases: Number(prevPurchaseTotals[0]?.totalPurchases || 0),
      prevTotalProfit: Number(prevSalesProfit[0]?.totalProfit || 0),
      prevTotalTransactions:
        Number(prevSalesBaseTotals[0]?.totalTransactions || 0) +
        Number(prevPurchaseTotals[0]?.totalTransactions || 0),
    };

    const dailyMap = new Map<
      string,
      { date: string; totalSales: number; totalPurchases: number }
    >();

    for (const row of dailySales) {
      dailyMap.set(row.date, {
        date: row.date,
        totalSales: Number(row.totalSales || 0),
        totalPurchases: 0,
      });
    }

    for (const row of dailyPurchases) {
      const existing = dailyMap.get(row.date);
      if (existing) {
        existing.totalPurchases = Number(row.totalPurchases || 0);
      } else {
        dailyMap.set(row.date, {
          date: row.date,
          totalSales: 0,
          totalPurchases: Number(row.totalPurchases || 0),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        topProducts: topProducts.map((item) => ({
          ...item,
          qtySold: Number(item.qtySold || 0),
          revenue: Number(item.revenue || 0),
        })),
        daily: [...dailyMap.values()].sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
      },
      filter: { startDate, endDate },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
