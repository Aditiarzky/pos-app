import { useQuery } from "@tanstack/react-query";
import { QueryConfig } from "@/lib/react-query";
import { getProductsQueryOptions } from "./product-query-options";
type UseProductsOptions = {
  params?: Record<string, unknown>;
  queryConfig?: QueryConfig<typeof getProductsQueryOptions>;
};

export const useProducts = ({
  params,
  queryConfig,
}: UseProductsOptions = {}) => {
  return useQuery({
    ...getProductsQueryOptions(params),
    ...queryConfig,
  });
};
