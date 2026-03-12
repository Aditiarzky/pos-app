import { queryOptions } from "@tanstack/react-query";
import { getUnits, GetUnitsParams } from "@/services/unitService";

export const unitKeys = {
  all: ["units"] as const,
  lists: () => [...unitKeys.all, "list"] as const,
  list: (params?: GetUnitsParams) => [...unitKeys.lists(), { ...params }] as const,
};

export const getUnitsQueryOptions = (params?: GetUnitsParams) => {
  return queryOptions({
    queryKey: unitKeys.list(params),
    queryFn: () => getUnits(params),
  });
};
