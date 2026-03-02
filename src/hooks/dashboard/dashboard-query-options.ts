import { queryOptions } from "@tanstack/react-query";
import { getDashboardSummary } from "@/services/dashboardService";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardKeys.all, "summary"] as const,
};

export const getDashboardSummaryQueryOptions = () =>
  queryOptions({
    queryKey: dashboardKeys.summary(),
    queryFn: () => getDashboardSummary(),
    staleTime: 1000 * 60 * 5,
  });
