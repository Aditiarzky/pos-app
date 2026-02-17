import { queryOptions } from "@tanstack/react-query";
import { getDebts, GetDebtsParams } from "@/services/debtService";

export const debtKeys = {
  all: ["debts"] as const,
  lists: () => [...debtKeys.all, "list"] as const,
  list: (params: GetDebtsParams) => [...debtKeys.lists(), params] as const,
  details: () => [...debtKeys.all, "detail"] as const,
  detail: (id: number) => [...debtKeys.details(), id] as const,
};

export const getDebtsQueryOptions = (params: GetDebtsParams) => {
  return queryOptions({
    queryKey: debtKeys.list(params),
    queryFn: () => getDebts(params),
  });
};
