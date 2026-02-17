import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import { getDebtsQueryOptions, debtKeys } from "./debt-query-options";
import { GetDebtsParams, payDebt, DebtPayment } from "@/services/debtService";
// We assume saleKeys are exported from sales query options
import { saleKeys } from "@/hooks/sales/sale-query-options";
import { ApiResponse } from "@/services/productService";
import { PayDebtData } from "@/lib/validations/debt";

export const useDebts = (params: GetDebtsParams = {}) => {
  const query = useQuery(getDebtsQueryOptions(params));
  return {
    ...query,
    debts: query.data?.data,
    meta: query.data?.meta,
  };
};

type PayDebtVariables = { debtId: number; data: PayDebtData };
type PayDebtResponse = ApiResponse<{
  payment: DebtPayment;
  newRemaining: number;
}>;

export const usePayDebt = (
  options?: UseMutationOptions<PayDebtResponse, Error, PayDebtVariables>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payDebt,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: debtKeys.lists() });
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      options?.onSuccess?.(...args);
    },
  });
};
