/* eslint-disable @typescript-eslint/no-explicit-any */
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { operationalCosts, taxConfigs } from "@/drizzle/schema";

/**
 * Normalisasi biaya/pajak tetap ke jumlah hari periode laporan.
 */
const normalizeToRange = (
  amount: number,
  period: string,
  rangeDays: number,
): number => {
  switch (period) {
    case "daily":
      return amount * rangeDays;
    case "weekly":
      return amount * (rangeDays / 7);
    case "monthly":
      return amount * (rangeDays / 30);
    case "yearly":
      return amount * (rangeDays / 365);
    case "one_time":
      return amount;
    default:
      return amount;
  }
};

// Hitung jumlah hari antara dua tanggal string 'YYYY-MM-DD' (inclusive).
// Pakai Date.UTC murni dari komponen Y-M-D agar TIDAK terpengaruh timezone
// environment tempat kode berjalan (beda dengan `new Date(str).toISOString()`
// yang bisa geser 1 hari kalau local timezone server != UTC).
const rangeDaysBetween = (startStr: string, endStr: string): number => {
  const [sY, sM, sD] = startStr.split("-").map(Number);
  const [eY, eM, eD] = endStr.split("-").map(Number);
  const startUtc = Date.UTC(sY, sM - 1, sD);
  const endUtc = Date.UTC(eY, eM - 1, eD);
  return Math.max(1, Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24)) + 1);
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
 *   Pajak % Laba   = Σ rate × EBT           (applies_to = net_profit)
 *   Pajak Tetap    = Σ fixedAmount, dinormalisasi
 *   Laba Bersih    = Laba Kotor − Biaya Ops − Semua Pajak
 *
 * @param grossProfit - Laba kotor (pendapatan - HPP)
 * @param revenue     - Total pendapatan (omset)
 * @param startStr    - Awal periode laporan, format 'YYYY-MM-DD' (sudah dalam timezone toko)
 * @param endStr      - Akhir periode laporan, format 'YYYY-MM-DD' (sudah dalam timezone toko)
 */
export const calculateNetProfit = async (
  grossProfit: number,
  revenue: number,
  startStr: string,
  endStr: string,
): Promise<NetProfitResult> => {
  // Jumlah hari periode laporan (minimal 1)
  const rangeDays = rangeDaysBetween(startStr, endStr);

  // Filter: aktif dan effectiveFrom <= endDate dan (effectiveTo IS NULL atau effectiveTo >= startDate)
  const activeFilter = (
    effectiveFromCol: any,
    effectiveToCol: any,
    isActiveCol: any,
  ) =>
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
    const normalizedAmount = normalizeToRange(
      originalAmount,
      cost.period,
      rangeDays,
    );
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
  let totalNonNetProfitTax = 0;
  const tempTaxBreakdown = activeTaxes.map((tax) => {
    let amount = 0;
    let isNetProfitTax = false;

    if (tax.type === "percentage" && tax.rate != null) {
      if (tax.appliesTo === "net_profit") {
        isNetProfitTax = true;
      } else {
        amount = Number(tax.rate) * revenue;
      }
    } else if (tax.type === "fixed" && tax.fixedAmount != null) {
      amount = normalizeToRange(
        Number(tax.fixedAmount),
        tax.period ?? "monthly",
        rangeDays,
      );
    }

    if (!isNetProfitTax) {
      totalNonNetProfitTax += amount;
    }

    return {
      id: tax.id,
      name: tax.name,
      type: tax.type,
      appliesTo: tax.appliesTo ?? null,
      rate: tax.rate != null ? Number(tax.rate) : null,
      fixedAmount: tax.fixedAmount != null ? Number(tax.fixedAmount) : null,
      amount,
      isNetProfitTax,
    };
  });

  const ebt = grossProfit - totalOperationalCost - totalNonNetProfitTax;

  const taxBreakdown = tempTaxBreakdown.map((t) => {
    let amount = t.amount;
    if (t.isNetProfitTax && t.rate != null) {
      amount = t.rate * Math.max(0, ebt);
    }
    return {
      id: t.id,
      name: t.name,
      type: t.type,
      appliesTo: t.appliesTo,
      rate: t.rate,
      fixedAmount: t.fixedAmount,
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