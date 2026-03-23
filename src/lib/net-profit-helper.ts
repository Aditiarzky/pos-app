/* eslint-disable @typescript-eslint/no-explicit-any */
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { operationalCosts, taxConfigs } from "@/drizzle/schema";

/**
 * Normalisasi biaya/pajak tetap ke jumlah hari periode laporan.
 */
const normalizeToRange = (amount: number, period: string, rangeDays: number): number => {
  switch (period) {
    case "daily": return amount * rangeDays;
    case "weekly": return amount * (rangeDays / 7);
    case "monthly": return amount * (rangeDays / 30);
    case "yearly": return amount * (rangeDays / 365);
    case "one_time": return amount;
    default: return amount;
  }
};

export type NetProfitResult = {
  grossProfit: number;
  totalOperationalCost: number;
  totalTax: number;
  netProfit: number;
  breakdown: {
    operationalCosts: Array<{
      id: number;
      name: string;
      category: string;
      period: string;
      originalAmount: number;
      normalizedAmount: number;
    }>;
    taxes: Array<{
      id: number;
      name: string;
      type: string;
      appliesTo: string | null;
      rate: number | null;
      fixedAmount: number | null;
      amount: number;
    }>;
  };
};

/**
 * Hitung laba bersih untuk periode laporan tertentu.
 *
 * Urutan kalkulasi:
 *   Laba Kotor     = grossProfit (sudah dihitung dari saleItems)
 *   Biaya Ops      = Σ biaya aktif, dinormalisasi ke jumlah hari periode
 *   Pajak % Omset  = Σ rate × revenue       (applies_to = revenue)
 *   Pajak % Laba   = Σ rate × grossProfit   (applies_to = gross_profit)
 *   Pajak Tetap    = Σ fixedAmount, dinormalisasi
 *   Laba Bersih    = Laba Kotor − Biaya Ops − Semua Pajak
 *
 * @param grossProfit - Laba kotor (pendapatan - HPP)
 * @param revenue     - Total pendapatan (omset)
 * @param startDate   - Awal periode laporan
 * @param endDate     - Akhir periode laporan
 */
export const calculateNetProfit = async (
  grossProfit: number,
  revenue: number,
  startDate: Date,
  endDate: Date,
): Promise<NetProfitResult> => {
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);

  // Jumlah hari periode laporan (minimal 1)
  const rangeDays = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );

  // Filter: aktif dan effectiveFrom <= endDate dan (effectiveTo IS NULL atau effectiveTo >= startDate)
  const activeFilter = (effectiveFromCol: any, effectiveToCol: any, isActiveCol: any) =>
    and(
      eq(isActiveCol, true),
      sql`${effectiveFromCol} <= ${endStr}`,
      sql`(${effectiveToCol} IS NULL OR ${effectiveToCol} >= ${startStr})`,
    );

  const [activeCosts, activeTaxes] = await Promise.all([
    db.query.operationalCosts.findMany({
      where: activeFilter(
        operationalCosts.effectiveFrom,
        operationalCosts.effectiveTo,
        operationalCosts.isActive,
      ),
    }),
    db.query.taxConfigs.findMany({
      where: activeFilter(
        taxConfigs.effectiveFrom,
        taxConfigs.effectiveTo,
        taxConfigs.isActive,
      ),
    }),
  ]);

  // ── Biaya Operasional ─────────────────────────────────────────────────────
  const costBreakdown = activeCosts.map((cost) => {
    const originalAmount = Number(cost.amount);
    const normalizedAmount = normalizeToRange(originalAmount, cost.period, rangeDays);
    return {
      id: cost.id,
      name: cost.name,
      category: cost.category,
      period: cost.period,
      originalAmount,
      normalizedAmount,
    };
  });

  const totalOperationalCost = costBreakdown.reduce(
    (sum, c) => sum + c.normalizedAmount,
    0,
  );

  // ── Pajak ─────────────────────────────────────────────────────────────────
  const taxBreakdown = activeTaxes.map((tax) => {
    let amount = 0;

    if (tax.type === "percentage" && tax.rate != null) {
      const rate = Number(tax.rate);
      const basis = tax.appliesTo === "revenue" ? revenue : grossProfit;
      amount = rate * basis;
    } else if (tax.type === "fixed" && tax.fixedAmount != null) {
      amount = normalizeToRange(
        Number(tax.fixedAmount),
        tax.period ?? "monthly",
        rangeDays,
      );
    }

    return {
      id: tax.id,
      name: tax.name,
      type: tax.type,
      appliesTo: tax.appliesTo ?? null,
      rate: tax.rate != null ? Number(tax.rate) : null,
      fixedAmount: tax.fixedAmount != null ? Number(tax.fixedAmount) : null,
      amount,
    };
  });

  const totalTax = taxBreakdown.reduce((sum, t) => sum + t.amount, 0);

  // ── Laba Bersih ───────────────────────────────────────────────────────────
  const netProfit = grossProfit - totalOperationalCost - totalTax;

  return {
    grossProfit,
    totalOperationalCost,
    totalTax,
    netProfit,
    breakdown: {
      operationalCosts: costBreakdown,
      taxes: taxBreakdown,
    },
  };
};
