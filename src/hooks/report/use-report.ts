import { QueryConfig } from "@/lib/react-query";
import {
  getPurchaseReportQueryOptions,
  getReportsQueryOptions,
  getSalesReportQueryOptions,
} from "./report-query-options";
import { useQuery } from "@tanstack/react-query";
import { ReportParams } from "@/services/reportService";

type UseReportOptions = {
  params?: ReportParams;
  queryConfig?: QueryConfig<typeof getReportsQueryOptions>;
};

type UseSalesReportOptions = {
  params?: ReportParams;
  queryConfig?: QueryConfig<typeof getSalesReportQueryOptions>;
};

type UsePurchaseReportOptions = {
  params?: ReportParams;
  queryConfig?: QueryConfig<typeof getPurchaseReportQueryOptions>;
};

export const useReports = ({ params, queryConfig }: UseReportOptions = {}) => {
  return useQuery({
    ...getReportsQueryOptions(params),
    ...queryConfig,
  });
};

export const useSalesReport = ({
  params,
  queryConfig,
}: UseSalesReportOptions = {}) => {
  return useQuery({
    ...getSalesReportQueryOptions(params),
    ...queryConfig,
  });
};

export const usePurchaseReport = ({
  params,
  queryConfig,
}: UsePurchaseReportOptions = {}) => {
  return useQuery({
    ...getPurchaseReportQueryOptions(params),
    ...queryConfig,
  });
};
