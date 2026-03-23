import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";

// ── Params ────────────────────────────────────────────────────────────────────

export type ReportParams = {
  startDate?: string;
  endDate?: string;
  timezone?: string;
};

// ── Shared types ──────────────────────────────────────────────────────────────

export type NetProfitBreakdown = {
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

// ── Overview report types ─────────────────────────────────────────────────────

export type ReportSummary = {
  totalSales: number;
  totalPurchases: number;
  totalTransactions: number;
  totalSalesTransactions: number;
  totalPurchaseTransactions: number;
  // Arus kas bersih = Pendapatan − Pembelian (BUKAN laba)
  netCashFlow: number;
  // Laba Kotor = Pendapatan − HPP
  grossProfit: number;
  // Laba Bersih = Laba Kotor − Biaya Ops − Pajak
  netProfit: number;
  totalOperationalCost: number;
  totalTax: number;
  // Perbandingan periode sebelumnya
  prevTotalSales?: number;
  prevTotalPurchases?: number;
  prevGrossProfit?: number;
  prevTotalTransactions?: number;
};

export type TopProductSummary = {
  productId: number;
  productName: string;
  qtySold: number;
  revenue: number;
  grossProfit: number;
};

export type DailyReportSummary = {
  date: string;
  totalSales: number;
  totalPurchases: number;
};

export type ReportResponse = {
  summary: ReportSummary;
  netProfitBreakdown: NetProfitBreakdown;
  topProducts: TopProductSummary[];
  daily: DailyReportSummary[];
};

// ── Sales report types ────────────────────────────────────────────────────────

export type SalesReportSummary = {
  totalSales: number;
  totalTransactions: number;
  grossProfit: number;
  netProfit: number;
  totalOperationalCost: number;
  totalTax: number;
  prevTotalSales?: number;
  prevTotalTransactions?: number;
  prevGrossProfit?: number;
};

export type SalesTopProduct = {
  productId: number;
  productName: string;
  qtySold: number;
  revenue: number;
  grossProfit: number;
};

export type SalesReportResponse = {
  summary: SalesReportSummary;
  netProfitBreakdown: NetProfitBreakdown;
  topProducts: SalesTopProduct[];
  daily: Array<{
    date: string;
    totalSales: string;
    totalTransactions: number;
  }>;
};

// ── Purchase report types ─────────────────────────────────────────────────────

export type PurchaseReportSummary = {
  totalPurchases: number;
  totalTransactions: number;
  prevTotalPurchases?: number;
  prevTotalTransactions?: number;
};

export type PurchaseReportResponse = {
  summary: PurchaseReportSummary;
  daily: Array<{
    date: string;
    totalPurchases: string;
    totalTransactions: number;
  }>;
};

// ── Timezone helper ───────────────────────────────────────────────────────────

const getUserTimezone = (): string => {
  if (typeof Intl === "undefined") return "UTC";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

// Inject timezone otomatis ke semua request report
// sehingga hook dan komponen tidak perlu tahu soal timezone
const withTimezone = (params?: ReportParams): ReportParams => ({
  ...params,
  timezone: params?.timezone ?? getUserTimezone(),
});

// ── Service functions ─────────────────────────────────────────────────────────

export const getReports = async (
  params?: ReportParams,
): Promise<ApiResponse<ReportResponse>> => {
  const response = await axiosInstance.get("/reports", {
    params: withTimezone(params),
  });
  return response.data;
};

export const getSalesReport = async (
  params?: ReportParams,
): Promise<ApiResponse<SalesReportResponse>> => {
  const response = await axiosInstance.get("/reports", {
    params: { ...withTimezone(params), type: "sales" },
  });
  return response.data;
};

export const getPurchaseReport = async (
  params?: ReportParams,
): Promise<ApiResponse<PurchaseReportResponse>> => {
  const response = await axiosInstance.get("/reports", {
    params: { ...withTimezone(params), type: "purchase" },
  });
  return response.data;
};
