import { getPurchases } from "@/services/purchaseService";
import { queryOptions } from "@tanstack/react-query";

export const purchaseKeys = {
  all: ["purchases"] as const,
  lists: () => [...purchaseKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...purchaseKeys.lists(), { ...params }] as const,
  details: () => [...purchaseKeys.all, "detail"] as const,
  detail: (id: number) => [...purchaseKeys.details(), id] as const,
};

export const getPurchasesQueryOptions = (params?: Record<string, unknown>) => {
  return queryOptions({
    queryKey: purchaseKeys.list(params),
    queryFn: () => getPurchases(params),
  });
};

// export const getPurchaseDetailQueryOptions = (id: number) => {
//   return queryOptions({
//     queryKey: purchaseKeys.detail(id),
//     queryFn: () => getPurchase(id),
//     enabled: !!id,
//   });
// };
