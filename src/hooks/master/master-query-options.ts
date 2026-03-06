import { queryOptions } from "@tanstack/react-query";
import {
  getCustomers,
  getCustomerDetail,
  GetCustomersParams,
} from "@/services/customerService";

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (params?: GetCustomersParams) =>
    [...customerKeys.lists(), { ...params }] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: number) => [...customerKeys.details(), id] as const,
};

export const getCustomersQueryOptions = (params?: GetCustomersParams) => {
  return queryOptions({
    queryKey: customerKeys.list(params),
    queryFn: () => getCustomers(params),
  });
};

export const getCustomerDetailQueryOptions = (id: number) => {
  return queryOptions({
    queryKey: customerKeys.detail(id),
    queryFn: () => getCustomerDetail(id),
  });
};
