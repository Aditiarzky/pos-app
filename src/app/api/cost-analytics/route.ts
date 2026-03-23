import { NextResponse } from "next/server";
import { operationalCosts, taxConfigs } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { db } from "@/lib/db";

type CostCategory =
  | "utilities"
  | "salary"
  | "rent"
  | "logistics"
  | "marketing"
  | "maintenance"
  | "other";

type CostPeriod = "daily" | "weekly" | "monthly" | "yearly" | "one_time";
type TaxAppliesTo = "revenue" | "gross_profit";
type TaxType = "percentage" | "fixed";

const toYmd = (value: unknown): string | null => {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value);
  // Assume already in YYYY-MM-DD or ISO-like
  return s.length >= 10 ? s.slice(0, 10) : s;
};

const parseAmount = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

// Normalize recurring amounts to a monthly estimate (30-day month).
// `one_time` is excluded from monthly estimate and tracked separately.
const normalizeToMonthly = (amount: number, period: CostPeriod | null): number => {
  switch (period) {
    case "daily":
      return amount * 30;
    case "weekly":
      return amount * (30 / 7);
    case "monthly":
      return amount;
    case "yearly":
      return amount * (30 / 365);
    case "one_time":
      return 0;
    default:
      return amount;
  }
};

const isCurrentlyEffective = (effectiveFrom: string | null, effectiveTo: string | null, today: string) => {
  if (!effectiveFrom) return false;
  // Lexicographic compare works for YYYY-MM-DD
  if (effectiveFrom > today) return false;
  if (effectiveTo && effectiveTo < today) return false;
  return true;
};

const isExpiringWithinDays = (effectiveTo: string | null, today: string, future: string) => {
  if (!effectiveTo) return false;
  return effectiveTo >= today && effectiveTo <= future;
};

const addDaysYmd = (ymd: string, days: number) => {
  const d = new Date(`${ymd}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const next30 = addDaysYmd(today, 30);

    // Pull only needed columns; aggregate in JS for flexibility.
    const [costRows, taxRows] = await Promise.all([
      db
        .select({
          category: operationalCosts.category,
          amount: operationalCosts.amount,
          period: operationalCosts.period,
          isActive: operationalCosts.isActive,
          effectiveFrom: operationalCosts.effectiveFrom,
          effectiveTo: operationalCosts.effectiveTo,
        })
        .from(operationalCosts),
      db
        .select({
          type: taxConfigs.type,
          fixedAmount: taxConfigs.fixedAmount,
          rate: taxConfigs.rate,
          appliesTo: taxConfigs.appliesTo,
          period: taxConfigs.period,
          isActive: taxConfigs.isActive,
          effectiveFrom: taxConfigs.effectiveFrom,
          effectiveTo: taxConfigs.effectiveTo,
        })
        .from(taxConfigs),
    ]);

    let operationalActiveCount = 0;
    let operationalInactiveCount = 0;
    let operationalMonthlyEstimate = 0;
    let operationalOneTimeCount = 0;
    let operationalOneTimeTotal = 0;
    let operationalExpiringNext30 = 0;

    const categoryMonthly: Record<CostCategory, number> = {
      utilities: 0,
      salary: 0,
      rent: 0,
      logistics: 0,
      marketing: 0,
      maintenance: 0,
      other: 0,
    };

    for (const row of costRows) {
      const effectiveFrom = toYmd(row.effectiveFrom);
      const effectiveTo = toYmd(row.effectiveTo);
      const period = row.period as CostPeriod;
      const category = row.category as CostCategory;

      const activeNow =
        row.isActive === true && isCurrentlyEffective(effectiveFrom, effectiveTo, today);

      if (activeNow) {
        operationalActiveCount += 1;
        if (isExpiringWithinDays(effectiveTo, today, next30)) operationalExpiringNext30 += 1;

        const amount = parseAmount(row.amount);
        if (period === "one_time") {
          operationalOneTimeCount += 1;
          operationalOneTimeTotal += amount;
        } else {
          const monthly = normalizeToMonthly(amount, period);
          operationalMonthlyEstimate += monthly;
          categoryMonthly[category] += monthly;
        }
      } else if (row.isActive === false) {
        operationalInactiveCount += 1;
      }
    }

    const topCategories = (Object.entries(categoryMonthly) as Array<[CostCategory, number]>)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, monthlyEstimate]) => ({ category, monthlyEstimate }));

    let taxActiveCount = 0;
    let taxInactiveCount = 0;
    let taxActiveFixedCount = 0;
    let taxActivePercentageCount = 0;
    let taxFixedMonthlyEstimate = 0;
    let taxExpiringNext30 = 0;
    const taxPercentageAppliesTo: Record<TaxAppliesTo, number> = {
      revenue: 0,
      gross_profit: 0,
    };

    for (const row of taxRows) {
      const effectiveFrom = toYmd(row.effectiveFrom);
      const effectiveTo = toYmd(row.effectiveTo);
      const activeNow =
        row.isActive === true && isCurrentlyEffective(effectiveFrom, effectiveTo, today);

      if (activeNow) {
        taxActiveCount += 1;
        if (isExpiringWithinDays(effectiveTo, today, next30)) taxExpiringNext30 += 1;

        const type = row.type as TaxType;
        if (type === "fixed") {
          taxActiveFixedCount += 1;
          const amount = parseAmount(row.fixedAmount);
          const period = (row.period as CostPeriod | null) ?? "monthly";
          taxFixedMonthlyEstimate += normalizeToMonthly(amount, period);
        } else if (type === "percentage") {
          taxActivePercentageCount += 1;
          const applies = row.appliesTo as TaxAppliesTo | null;
          if (applies === "revenue" || applies === "gross_profit") {
            taxPercentageAppliesTo[applies] += 1;
          }
        }
      } else if (row.isActive === false) {
        taxInactiveCount += 1;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        asOfDate: today,
        operational: {
          activeCount: operationalActiveCount,
          inactiveCount: operationalInactiveCount,
          activeMonthlyEstimate: Math.round(operationalMonthlyEstimate),
          activeOneTimeCount: operationalOneTimeCount,
          activeOneTimeTotal: Math.round(operationalOneTimeTotal),
          expiringNext30DaysCount: operationalExpiringNext30,
          topCategories,
        },
        tax: {
          activeCount: taxActiveCount,
          inactiveCount: taxInactiveCount,
          activeFixedCount: taxActiveFixedCount,
          activeFixedMonthlyEstimate: Math.round(taxFixedMonthlyEstimate),
          activePercentageCount: taxActivePercentageCount,
          percentageAppliesToCount: taxPercentageAppliesTo,
          expiringNext30DaysCount: taxExpiringNext30,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
