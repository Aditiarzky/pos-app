import { queryOptions } from "@tanstack/react-query";
import { getDashboardSummary } from "@/services/dashboardService";
import { getUserTimezone } from "@/lib/timezone";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (timezone?: string) =>
    [...dashboardKeys.all, "summary", timezone ?? "UTC"] as const,
};

export const getDashboardSummaryQueryOptions = () => {
  const timezone = getUserTimezone();
  return queryOptions({
    queryKey: dashboardKeys.summary(timezone),
    queryFn: () => getDashboardSummary(timezone),
    staleTime: 1000 * 60 * 5,
  });
};
