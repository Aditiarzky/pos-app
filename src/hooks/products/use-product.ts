import { useQuery } from "@tanstack/react-query";
import { QueryConfig } from "@/lib/react-query";
import { getProductDetailQueryOptions } from "./product-query-options";

type UseProductOptions = {
  id: number;
  queryConfig?: QueryConfig<typeof getProductDetailQueryOptions>;
};

export const useProduct = (
  id: number,
  queryConfig?: UseProductOptions["queryConfig"],
) => {
  return useQuery({
    ...getProductDetailQueryOptions(id),
    ...queryConfig,
  });
};
