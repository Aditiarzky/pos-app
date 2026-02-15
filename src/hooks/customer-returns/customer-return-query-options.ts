import { queryOptions } from "@tanstack/react-query";
import { getCustomerReturns } from "@/services/customerReturnService";

export const customerReturnKeys = {
  all: ["customer-returns"] as const,
  lists: () => [...customerReturnKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...customerReturnKeys.lists(), params] as const,
  details: () => [...customerReturnKeys.all, "detail"] as const,
  detail: (id: number) => [...customerReturnKeys.details(), id] as const,
};

export const getCustomerReturnsQueryOptions = (
  params?: Record<string, unknown>,
) => {
  return queryOptions({
    queryKey: customerReturnKeys.list(params || {}),
    queryFn: () => getCustomerReturns(params),
  });
};
