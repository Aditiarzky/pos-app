import { useQuery } from "@tanstack/react-query";
import { QueryConfig } from "@/lib/react-query";
import { GetUnitsParams } from "@/services/unitService";
import { getUnitsQueryOptions } from "./unit-query-options";

type UseUnitsOptions = {
  params?: GetUnitsParams;
  queryConfig?: QueryConfig<typeof getUnitsQueryOptions>;
};

export const useUnits = ({ params, queryConfig }: UseUnitsOptions = {}) => {
  return useQuery({
    ...getUnitsQueryOptions(params),
    ...queryConfig,
  });
};
