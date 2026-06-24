import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, not, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products, purchaseOrders, saleItems, sales } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import {
  MS_DAY,
  normalizeTimezone,
  getLocalMidnightUtc,
} from "@/lib/timezone";
import { calculateNetProfit } from "@/lib/net-profit-helper";

type ReportType = "overview" | "sales" | "purchase";

// ── Helpers ────────────────────────────────────────────────────────────────────

// Format Date → "YYYY-MM-DD" di timezone target (untuk SQL date literal)
const toLocalDateStr = (date: Date, timezone: string): string => {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of f.formatToParts(date)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
};

// ── Timezone-aware date grouping ──────────────────────────────────────────────
// to_char(col, 'YYYY-MM-DD') memformat timestamp dalam session timezone DB.
// Ini konsisten dengan filter yang juga cast ke ::date (session timezone).
const localDateExpr = (col: import("drizzle-orm").SQL) =>
  sql<string>`to_char(${col}, 'YYYY-MM-DD')`;

// ── Date range parsing ──────────────────────────────────────────────────────────
// Mengembalikan date STRING (YYYY-MM-DD) untuk SQL ::date cast, dan juga
// Date object (untuk hitung durasi & previous period).
//
// BUG FIX: Neon/pg driver serialize Date pakai LOCAL time methods (bukan UTC).
// Akibatnya perbandingan timestamp != session timezone DB.
// Solusi: gunakan SQL `col::date >= 'YYYY-MM-DD'::date` agar kedua sisi
// diinterpretasi dalam session timezone yang SAMA (konsisten dengan to_char).
const parseDateRange = (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const reqStartDate = searchParams.get("startDate");
  const reqEndDate = searchParams.get("endDate");
  const timezone = normalizeTimezone(searchParams.get("timezone") ?? undefined);

  const todayMidnight = getLocalMidnightUtc(timezone);
  const dayMs = MS_DAY;

  let startStr: string;
  let endStr: string;

  if (reqStartDate && reqEndDate) {
    startStr = reqStartDate;
    endStr = reqEndDate;
  } else {
    // Default: bulan ini (dari tanggal 1 sampai hari ini)
    const f = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const parts = Object.fromEntries(
      f.formatToParts(todayMidnight)
        .filter((p) => p.type !== "literal")
        .map((p) => [p.type, p.value]),
    );
    const year = parts.year;
    const month = parts.month.padStart(2, "0");
    const day = Number(parts.day);
    startStr = `${year}-${month}-01`;
    endStr = `${year}-${month}-${String(day).padStart(2, "0")}`;
  }

  // Date objects untuk hitung durasi & previous period
  const [sY, sM, sD] = startStr.split("-").map(Number);
  const [eY, eM, eD] = endStr.split("-").map(Number);
  const start = new Date(sY, sM - 1, sD);
  const end = new Date(eY, eM - 1, eD);
  const durationMs = end.getTime() - start.getTime() + dayMs; // inclusive

  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - (durationMs - dayMs));

  // Format previous period dates ke timezone target
  const prevStartStr = toLocalDateStr(prevStart, timezone);
  const prevEndStr = toLocalDateStr(prevEnd, timezone);

  return { startStr, endStr, prevStartStr, prevEndStr, timezone };
};

const parseType = (request: NextRequest): ReportType => {
  const reportType = request.nextUrl.searchParams.get("type");
  if (reportType === "sales" || reportType === "purchase") return reportType;
  return "overview";
};

export async function GET(request: NextRequest) {
  try {
    const { startStr, endStr, prevStartStr, prevEndStr, timezone } = parseDateRange(request);
    const type = parseType(request);

    // Date objects for calculateNetProfit (range days calculation)
    const [sY, sM, sD] = startStr.split("-").map(Number);
    const [eY, eM, eD] = endStr.split("-").map(Number);
    const start = new Date(sY, sM - 1, sD);
    const end = new Date(eY, eM - 1, eD);

    // ── SQL date filter ─────────────────────────────────────────────────────────
    // Gunakan ::date cast agar perbandingan konsisten dengan to_char() yang
    // dipakai di daily chart. Kedua sisi diinterpretasi dalam session timezone
    // DB yang sama, sehingga data hari ini tidak bergeser ke kemarin.
    const salesFilter = and(
      not(sales.isArchived),
      not(eq(sales.status, "cancelled")),
      not(eq(sales.status, "refunded")),
      sql`${sales.createdAt}::date >= ${startStr}::date`,
      sql`${sales.createdAt}::date <= ${endStr}::date`,
    );

    const prevSalesFilter = and(
      not(sales.isArchived),
      not(eq(sales.status, "cancelled")),
      not(eq(sales.status, "refunded")),
      sql`${sales.createdAt}::date >= ${prevStartStr}::date`,
      sql`${sales.createdAt}::date <= ${prevEndStr}::date`,
    );

    const purchaseFilter = and(
      not(purchaseOrders.isArchived),
      sql`${purchaseOrders.createdAt}::date >= ${startStr}::date`,
      sql`${purchaseOrders.createdAt}::date <= ${endStr}::date`,
    );

    const prevPurchaseFilter = and(
      not(purchaseOrders.isArchived),
      sql`${purchaseOrders.createdAt}::date >= ${prevStartStr}::date`,
      sql`${purchaseOrders.createdAt}::date <= ${prevEndStr}::date`,
    );

    const dailySalesFilter = and(
      not(sales.isArchived),
      not(eq(sales.status, "cancelled")),
      not(eq(sales.status, "refunded")),
      sql`${sales.createdAt}::date >= ${prevStartStr}::date`,
      sql`${sales.createdAt}::date <= ${endStr}::date`,
    );

    const dailyPurchaseFilter = and(
      not(purchaseOrders.isArchived),
      sql`${purchaseOrders.createdAt}::date >= ${prevStartStr}::date`,
      sql`${purchaseOrders.createdAt}::date <= ${endStr}::date`,
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
            date: localDateExpr(sql`${sales.createdAt}`),
            totalSales: sql<string>`coalesce(sum(${sales.totalPrice}), 0)`,
            totalTransactions: sql<number>`count(*)`,
          })
          .from(sales)
          .where(dailySalesFilter)
          .groupBy(localDateExpr(sql`${sales.createdAt}`))
          .orderBy(localDateExpr(sql`${sales.createdAt}`)),
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
        filter: { startDate: startStr, endDate: endStr },
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
              date: localDateExpr(sql`${purchaseOrders.createdAt}`),
              totalPurchases: sql<string>`coalesce(sum(${purchaseOrders.total}), 0)`,
              totalTransactions: sql<number>`count(*)`,
            })
            .from(purchaseOrders)
            .where(dailyPurchaseFilter)
            .groupBy(localDateExpr(sql`${purchaseOrders.createdAt}`))
            .orderBy(localDateExpr(sql`${purchaseOrders.createdAt}`)),
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
        filter: { startDate: startStr, endDate: endStr },
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
          date: localDateExpr(sql`${sales.createdAt}`),
          totalSales: sql<string>`coalesce(sum(${sales.totalPrice}), 0)`,
        })
        .from(sales)
        .where(dailySalesFilter)
        .groupBy(localDateExpr(sql`${sales.createdAt}`))
        .orderBy(localDateExpr(sql`${sales.createdAt}`)),
      db
        .select({
          date: localDateExpr(sql`${purchaseOrders.createdAt}`),
          totalPurchases: sql<string>`coalesce(sum(${purchaseOrders.total}), 0)`,
        })
        .from(purchaseOrders)
        .where(dailyPurchaseFilter)
        .groupBy(localDateExpr(sql`${purchaseOrders.createdAt}`))
        .orderBy(localDateExpr(sql`${purchaseOrders.createdAt}`)),
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
      filter: { startDate: startStr, endDate: endStr },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
