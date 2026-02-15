import { queryOptions } from "@tanstack/react-query";
import { getSales } from "@/services/saleService";

export const saleKeys = {
  all: ["sales"] as const,
  lists: () => [...saleKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...saleKeys.lists(), params] as const,
  details: () => [...saleKeys.all, "detail"] as const,
  detail: (id: number) => [...saleKeys.details(), id] as const,
};

export const getSalesQueryOptions = (params?: Record<string, unknown>) => {
  return queryOptions({
    queryKey: saleKeys.list(params || {}),
    queryFn: () => getSales(params),
  });
};
