import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getStockMutations } from "@/services/productService";
import { stockMutationKeys } from "./stock-mutation-query-options";


type UseStockMutationsOptions = {
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    productId?: number;
    type?: string;
    orderBy?: string;
    order?: string;
    startDate?: string;
    endDate?: string;
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
