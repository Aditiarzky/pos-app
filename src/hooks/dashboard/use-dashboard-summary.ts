import { useQuery } from "@tanstack/react-query";
import { QueryConfig } from "@/lib/react-query";
import { getDashboardSummaryQueryOptions } from "./dashboard-query-options";

type UseDashboardSummaryOptions = {
  queryConfig?: QueryConfig<typeof getDashboardSummaryQueryOptions>;
};

export const useDashboardSummary = ({
  queryConfig,
}: UseDashboardSummaryOptions = {}) => {
  return useQuery({
    ...getDashboardSummaryQueryOptions(),
    ...queryConfig,
  });
};
