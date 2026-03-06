import { useQuery } from "@tanstack/react-query";
import { QueryConfig } from "@/lib/react-query";
import { getUsersQueryOptions } from "./user-query-options";

type UseUsersOptions = {
  params?: Record<string, unknown>;
  queryConfig?: QueryConfig<typeof getUsersQueryOptions>;
};

export const useUsers = ({ params, queryConfig }: UseUsersOptions = {}) => {
  return useQuery({
    ...getUsersQueryOptions(params),
    ...queryConfig,
  });
};