import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getStockMutations } from "@/services/productService";

export const stockMutationKeys = {
  all: ["stock-mutations"] as const,
  lists: () => [...stockMutationKeys.all, "list"] as const,
  list: (params: unknown) => [...stockMutationKeys.lists(), params] as const,
};

type UseStockMutationsOptions = {
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    productId?: number;
    type?: string;
    orderBy?: string;
    order?: string;
  };
  enabled?: boolean;
};

export const useStockMutations = ({
  params,
  enabled = true,
}: UseStockMutationsOptions = {}) => {
  return useQuery({
    queryKey: stockMutationKeys.list(params),
    queryFn: () => getStockMutations(params),
    placeholderData: keepPreviousData,
    enabled,
  });
};
