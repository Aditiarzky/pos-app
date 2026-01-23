import { queryOptions } from "@tanstack/react-query";
import { getProducts, getProduct } from "@/services/productService";

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...productKeys.lists(), { ...params }] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
};

export const getProductsQueryOptions = (params?: Record<string, unknown>) => {
  return queryOptions({
    queryKey: productKeys.list(params),
    queryFn: () => getProducts(params),
  });
};

export const getProductDetailQueryOptions = (id: number) => {
  return queryOptions({
    queryKey: productKeys.detail(id),
    queryFn: () => getProduct(id),
    enabled: !!id,
  });
};
