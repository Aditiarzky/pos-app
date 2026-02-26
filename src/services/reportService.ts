import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";

export type ReportParams = {
  startDate?: string;
  endDate?: string;
};

export type ReportSummary = {
  totalSales: number;
  totalPurchases: number;
  totalTransactions: number;
  totalProfit: number;
  totalSalesTransactions: number;
  totalPurchaseTransactions: number;
  prevTotalSales?: number;
  prevTotalPurchases?: number;
  prevTotalProfit?: number;
  prevTotalTransactions?: number;
};

export type TopProductSummary = {
  productId: number;
  productName: string;
  qtySold: number;
  revenue: number;
};

export type DailyReportSummary = {
  date: string;
  totalSales: number;
  totalPurchases: number;
};

export type ReportResponse = {
  summary: ReportSummary;
  topProducts: TopProductSummary[];
  daily: DailyReportSummary[];
};

export type SalesReportResponse = {
  summary: {
    totalSales: string;
    totalTransactions: number;
    totalProfit: string;
    prevTotalSales?: number;
    prevTotalTransactions?: number;
    prevTotalProfit?: number;
  };
  topProducts: Array<{
    productId: number;
    productName: string;
    qtySold: string;
    revenue: string;
  }>;
  daily: Array<{
    date: string;
    totalSales: string;
    totalTransactions: number;
  }>;
};

export type PurchaseReportResponse = {
  summary: {
    totalPurchases: string;
    totalTransactions: number;
    prevTotalPurchases?: number;
    prevTotalTransactions?: number;
  };
  daily: Array<{
    date: string;
    totalPurchases: string;
    totalTransactions: number;
  }>;
};

export const getReports = async (
  params?: ReportParams,
): Promise<ApiResponse<ReportResponse>> => {
  const response = await axiosInstance.get("/reports", { params });
  return response.data;
};

export const getSalesReport = async (
  params?: ReportParams,
): Promise<ApiResponse<SalesReportResponse>> => {
  const response = await axiosInstance.get("/reports", {
    params: { ...params, type: "sales" },
  });
  return response.data;
};

export const getPurchaseReport = async (
  params?: ReportParams,
): Promise<ApiResponse<PurchaseReportResponse>> => {
  const response = await axiosInstance.get("/reports", {
    params: { ...params, type: "purchase" },
  });
  return response.data;
};
