import { queryOptions } from "@tanstack/react-query";
import {
  getPurchaseReport,
  getReports,
  getSalesReport,
  ReportParams,
} from "@/services/reportService";

export const reportKeys = {
  all: ["reports"] as const,
  lists: () => [...reportKeys.all, "list"] as const,
  list: (params?: ReportParams) => [...reportKeys.lists(), params] as const,
  sales: (params?: ReportParams) =>
    [...reportKeys.all, "sales", params] as const,
  purchases: (params?: ReportParams) =>
    [...reportKeys.all, "purchases", params] as const,
};

export const getReportsQueryOptions = (params?: ReportParams) =>
  queryOptions({
    queryKey: reportKeys.list(params),
    queryFn: () => getReports(params),
  });

export const getSalesReportQueryOptions = (params?: ReportParams) =>
  queryOptions({
    queryKey: reportKeys.sales(params),
    queryFn: () => getSalesReport(params),
  });

export const getPurchaseReportQueryOptions = (params?: ReportParams) =>
  queryOptions({
    queryKey: reportKeys.purchases(params),
    queryFn: () => getPurchaseReport(params),
  });
