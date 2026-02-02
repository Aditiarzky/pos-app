import { getStockMutations } from "@/services/productService";
import { queryOptions } from "@tanstack/react-query";

export const stockMutationKeys = {
  all: ["stock-mutations"] as const,
  lists: () => [...stockMutationKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...stockMutationKeys.lists(), { ...params }] as const,
  details: () => [...stockMutationKeys.all, "detail"] as const,
  detail: (id: number) => [...stockMutationKeys.details(), id] as const,
};

export const getStockMutationsQueryOptions = (
  params?: Record<string, unknown>,
) => {
  return queryOptions({
    queryKey: stockMutationKeys.list(params),
    queryFn: () => getStockMutations(params),
  });
};
