import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, lte, not, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products, purchaseOrders, saleItems, sales } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import {
  normalizeTimezone,
  getLocalMidnightUtc,
  getUtcFromLocalDate,
} from "@/lib/timezone";
import { calculateNetProfit } from "@/lib/net-profit-helper";

type ReportType = "overview" | "sales" | "purchase";

// ── Timezone-aware date grouping ──────────────────────────────────────────────
// Bug lama: to_char(col, 'YYYY-MM-DD') pakai timezone server (UTC).
// Fix: konversi ke timezone lokal user sebelum format.
//
// PENTING: PostgreSQL AT TIME ZONE tidak bisa menerima parameter binding ($1).
// Harus di-interpolate sebagai string literal langsung ke query.
// Pakai sql.raw() — aman karena timezone sudah divalidasi oleh normalizeTimezone()
// yang hanya menerima string dari Intl.DateTimeFormat (tidak dari user input bebas).
const localDateExpr = (col: import("drizzle-orm").SQL, timezone: string) =>
  sql<string>`to_char(${col} AT TIME ZONE 'UTC' AT TIME ZONE ${sql.raw(`'${timezone}'`)}, 'YYYY-MM-DD')`;

const parseDateRange = (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const timezone = normalizeTimezone(searchParams.get("timezone") ?? undefined);

  if (startDate && endDate) {
    const start = getUtcFromLocalDate(startDate, "00:00:00.000", timezone);
    const end = getUtcFromLocalDate(endDate, "23:59:59.999", timezone);
    return { start, end, startDate, endDate, timezone };
  }

  const todayMidnight = getLocalMidnightUtc(timezone);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(todayMidnight)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );

  const year = Number(parts.year);
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  const firstDayStr = `${year}-${month}-01`;
  const todayStr = `${year}-${month}-${day}`;

  const start = getUtcFromLocalDate(firstDayStr, "00:00:00.000", timezone);
  const end = getUtcFromLocalDate(todayStr, "23:59:59.999", timezone);

  return { start, end, startDate: firstDayStr, endDate: todayStr, timezone };
};

const parseType = (request: NextRequest): ReportType => {
  const reportType = request.nextUrl.searchParams.get("type");
  if (reportType === "sales" || reportType === "purchase") return reportType;
  return "overview";
};

export async function GET(request: NextRequest) {
  try {
    const { start, end, startDate, endDate, timezone } = parseDateRange(request);
    const type = parseType(request);

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

    const dailySalesFilter = and(
      not(sales.isArchived),
      not(eq(sales.status, "cancelled")),
      not(eq(sales.status, "refunded")),
      gte(sales.createdAt, prevStart),
      lte(sales.createdAt, end),
    );

    const dailyPurchaseFilter = and(
      not(purchaseOrders.isArchived),
      gte(purchaseOrders.createdAt, prevStart),
      lte(purchaseOrders.createdAt, end),
    );

    const getSalesTotals = (filter: ReturnType<typeof and>) =>
      db
        .select({
          totalSales: sql<string>`coalesce(sum(${sales.totalPrice}), 0)`,
          totalTransactions: sql<number>`count(*)`,
        })
        .from(sales)
        .where(filter);

    const getSalesGrossProfit = (filter: ReturnType<typeof and>) =>
      db
        .select({
          grossProfit: sql<string>`coalesce(sum(
            ${saleItems.subtotal} - (${saleItems.costAtSale} * ${saleItems.qty} * ${saleItems.unitFactorAtSale})
          ), 0)`,
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

    // ── Sales type ────────────────────────────────────────────────────────────
    if (type === "sales") {
      const [
        salesBaseTotals,
        salesGrossProfit,
        prevSalesBaseTotals,
        prevSalesGrossProfit,
        topProducts,
        topCategories,
        dailySales,
      ] = await Promise.all([
        getSalesTotals(salesFilter),
        getSalesGrossProfit(salesFilter),
        getSalesTotals(prevSalesFilter),
        getSalesGrossProfit(prevSalesFilter),
        db
          .select({
            productId: products.id,
            productName: products.name,
            qtySold: sql<string>`coalesce(sum(${saleItems.qty}), 0)`,
            revenue: sql<string>`coalesce(sum(${saleItems.subtotal}), 0)`,
            grossProfit: sql<string>`coalesce(sum(
              ${saleItems.subtotal} - (${saleItems.costAtSale} * ${saleItems.qty} * ${saleItems.unitFactorAtSale})
            ), 0)`,
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
            categoryId: categories.id,
            categoryName: categories.name,
            qtySold: sql<string>`coalesce(sum(${saleItems.qty}), 0)`,
            revenue: sql<string>`coalesce(sum(${saleItems.subtotal}), 0)`,
            grossProfit: sql<string>`coalesce(sum(
              ${saleItems.subtotal} - (${saleItems.costAtSale} * ${saleItems.qty} * ${saleItems.unitFactorAtSale})
            ), 0)`,
          })
          .from(saleItems)
          .innerJoin(sales, eq(sales.id, saleItems.saleId))
          .innerJoin(products, eq(products.id, saleItems.productId))
          .innerJoin(categories, eq(categories.id, products.categoryId))
          .where(salesFilter)
          .groupBy(categories.id, categories.name)
          .orderBy(desc(sql`sum(${saleItems.qty})`))
          .limit(10),
        db
          .select({
            date: localDateExpr(sql`${sales.createdAt}`, timezone),
            totalSales: sql<string>`coalesce(sum(${sales.totalPrice}), 0)`,
            totalTransactions: sql<number>`count(*)`,
          })
          .from(sales)
          .where(dailySalesFilter)
          .groupBy(localDateExpr(sql`${sales.createdAt}`, timezone))
          .orderBy(localDateExpr(sql`${sales.createdAt}`, timezone)),
      ]);

      const revenue = Number(salesBaseTotals[0]?.totalSales || 0);
      const grossProfit = Number(salesGrossProfit[0]?.grossProfit || 0);
      const netProfitData = await calculateNetProfit(grossProfit, revenue, start, end);

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalSales: revenue,
            totalTransactions: Number(salesBaseTotals[0]?.totalTransactions || 0),
            grossProfit,
            netProfit: netProfitData.netProfit,
            totalOperationalCost: netProfitData.totalOperationalCost,
            totalTax: netProfitData.totalTax,
            prevTotalSales: Number(prevSalesBaseTotals[0]?.totalSales || 0),
            prevTotalTransactions: Number(prevSalesBaseTotals[0]?.totalTransactions || 0),
            prevGrossProfit: Number(prevSalesGrossProfit[0]?.grossProfit || 0),
          },
          netProfitBreakdown: netProfitData.breakdown,
          topProducts: topProducts.map((item) => ({
            ...item,
            qtySold: Number(item.qtySold || 0),
            revenue: Number(item.revenue || 0),
            grossProfit: Number(item.grossProfit || 0),
          })),
          topCategories: topCategories.map((item) => ({
            ...item,
            qtySold: Number(item.qtySold || 0),
            revenue: Number(item.revenue || 0),
            grossProfit: Number(item.grossProfit || 0),
          })),
          daily: dailySales,
        },
        filter: { startDate, endDate },
      });
    }

    // ── Purchase type ─────────────────────────────────────────────────────────
    if (type === "purchase") {
      const [purchaseTotals, prevPurchaseTotals, dailyPurchases] =
        await Promise.all([
          getPurchaseTotals(purchaseFilter),
          getPurchaseTotals(prevPurchaseFilter),
          db
            .select({
              date: localDateExpr(sql`${purchaseOrders.createdAt}`, timezone),
              totalPurchases: sql<string>`coalesce(sum(${purchaseOrders.total}), 0)`,
              totalTransactions: sql<number>`count(*)`,
            })
            .from(purchaseOrders)
            .where(dailyPurchaseFilter)
            .groupBy(localDateExpr(sql`${purchaseOrders.createdAt}`, timezone))
            .orderBy(localDateExpr(sql`${purchaseOrders.createdAt}`, timezone)),
        ]);

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalPurchases: Number(purchaseTotals[0]?.totalPurchases || 0),
            totalTransactions: Number(purchaseTotals[0]?.totalTransactions || 0),
            prevTotalPurchases: Number(prevPurchaseTotals[0]?.totalPurchases || 0),
            prevTotalTransactions: Number(prevPurchaseTotals[0]?.totalTransactions || 0),
          },
          daily: dailyPurchases,
        },
        filter: { startDate, endDate },
      });
    }

    // ── Overview type ─────────────────────────────────────────────────────────
    const [
      salesBaseTotals,
      salesGrossProfit,
      purchaseTotals,
      prevSalesBaseTotals,
      prevSalesGrossProfit,
      prevPurchaseTotals,
      topProducts,
      topCategories,
      dailySales,
      dailyPurchases,
    ] = await Promise.all([
      getSalesTotals(salesFilter),
      getSalesGrossProfit(salesFilter),
      getPurchaseTotals(purchaseFilter),
      getSalesTotals(prevSalesFilter),
      getSalesGrossProfit(prevSalesFilter),
      getPurchaseTotals(prevPurchaseFilter),
      db
        .select({
          productId: products.id,
          productName: products.name,
          qtySold: sql<string>`coalesce(sum(${saleItems.qty}), 0)`,
          revenue: sql<string>`coalesce(sum(${saleItems.subtotal}), 0)`,
          grossProfit: sql<string>`coalesce(sum(
            ${saleItems.subtotal} - (${saleItems.costAtSale} * ${saleItems.qty} * ${saleItems.unitFactorAtSale})
          ), 0)`,
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
          categoryId: categories.id,
          categoryName: categories.name,
          qtySold: sql<string>`coalesce(sum(${saleItems.qty}), 0)`,
          revenue: sql<string>`coalesce(sum(${saleItems.subtotal}), 0)`,
          grossProfit: sql<string>`coalesce(sum(
            ${saleItems.subtotal} - (${saleItems.costAtSale} * ${saleItems.qty} * ${saleItems.unitFactorAtSale})
          ), 0)`,
        })
        .from(saleItems)
        .innerJoin(sales, eq(sales.id, saleItems.saleId))
        .innerJoin(products, eq(products.id, saleItems.productId))
        .innerJoin(categories, eq(categories.id, products.categoryId))
        .where(salesFilter)
        .groupBy(categories.id, categories.name)
        .orderBy(desc(sql`sum(${saleItems.qty})`))
        .limit(5),
      db
        .select({
          date: localDateExpr(sql`${sales.createdAt}`, timezone),
          totalSales: sql<string>`coalesce(sum(${sales.totalPrice}), 0)`,
        })
        .from(sales)
        .where(dailySalesFilter)
        .groupBy(localDateExpr(sql`${sales.createdAt}`, timezone))
        .orderBy(localDateExpr(sql`${sales.createdAt}`, timezone)),
      db
        .select({
          date: localDateExpr(sql`${purchaseOrders.createdAt}`, timezone),
          totalPurchases: sql<string>`coalesce(sum(${purchaseOrders.total}), 0)`,
        })
        .from(purchaseOrders)
        .where(dailyPurchaseFilter)
        .groupBy(localDateExpr(sql`${purchaseOrders.createdAt}`, timezone))
        .orderBy(localDateExpr(sql`${purchaseOrders.createdAt}`, timezone)),
    ]);

    const revenue = Number(salesBaseTotals[0]?.totalSales || 0);
    const grossProfit = Number(salesGrossProfit[0]?.grossProfit || 0);
    const totalPurchases = Number(purchaseTotals[0]?.totalPurchases || 0);

    const netProfitData = await calculateNetProfit(grossProfit, revenue, start, end);

    const summary = {
      totalSales: revenue,
      totalPurchases,
      totalSalesTransactions: Number(salesBaseTotals[0]?.totalTransactions || 0),
      totalPurchaseTransactions: Number(purchaseTotals[0]?.totalTransactions || 0),
      totalTransactions:
        Number(salesBaseTotals[0]?.totalTransactions || 0) +
        Number(purchaseTotals[0]?.totalTransactions || 0),
      netCashFlow: revenue - totalPurchases,
      grossProfit,
      netProfit: netProfitData.netProfit,
      totalOperationalCost: netProfitData.totalOperationalCost,
      totalTax: netProfitData.totalTax,
      prevTotalSales: Number(prevSalesBaseTotals[0]?.totalSales || 0),
      prevTotalPurchases: Number(prevPurchaseTotals[0]?.totalPurchases || 0),
      prevGrossProfit: Number(prevSalesGrossProfit[0]?.grossProfit || 0),
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
        netProfitBreakdown: netProfitData.breakdown,
        topProducts: topProducts.map((item) => ({
          ...item,
          qtySold: Number(item.qtySold || 0),
          revenue: Number(item.revenue || 0),
          grossProfit: Number(item.grossProfit || 0),
        })),
        topCategories: topCategories.map((item) => ({
          ...item,
          qtySold: Number(item.qtySold || 0),
          revenue: Number(item.revenue || 0),
          grossProfit: Number(item.grossProfit || 0),
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
