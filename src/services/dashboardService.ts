import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";

export type DashboardSummary = {
  totalSalesMonth: number;
  prevTotalSalesMonth: number;
  totalProfitMonth: number;
  prevTotalProfitMonth: number;
  totalTransactionsMonth: number;
  prevTotalTransactionsMonth: number;
  totalActiveDebt: number;
  prevTotalActiveDebt: number;
};

export type DashboardSalesTrendItem = {
  date: string;
  totalSales: number;
};

export type DashboardLowStockAlert = {
  productId: number;
  productName: string;
  stock: number;
  minStock: number;
  image: string;
};

export type DashboardUnpaidDebtAlert = {
  debtId: number;
  customerName: string;
  remainingAmount: number;
  ageDays: number;
};

export type DashboardResponse = {
  summary: DashboardSummary;
  salesTrend: DashboardSalesTrendItem[];
  alerts: {
    lowStockProducts: DashboardLowStockAlert[];
    unpaidDebts: DashboardUnpaidDebtAlert[];
  };
};

export const getDashboardSummary = async (): Promise<
  ApiResponse<DashboardResponse>
> => {
  const response = await axiosInstance.get("/dashboard");
  return response.data;
};
