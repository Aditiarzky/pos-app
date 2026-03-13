import { useQuery } from "@tanstack/react-query";
import { QueryConfig } from "@/lib/react-query";
import { getPasswordResetRequestsQueryOptions } from "./password-reset-query-options";

type UsePasswordResetRequestsOptions = {
  queryConfig?: QueryConfig<typeof getPasswordResetRequestsQueryOptions>;
};

export const usePasswordResetRequests = (
  { queryConfig }: UsePasswordResetRequestsOptions = {},
) => {
  return useQuery({
    ...getPasswordResetRequestsQueryOptions(),
    ...queryConfig,
  });
};
