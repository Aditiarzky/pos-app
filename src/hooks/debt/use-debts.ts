import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import { getDebtsQueryOptions, debtKeys } from "./debt-query-options";
import { GetDebtsParams, payDebt, DebtPayment } from "@/services/debtService";
import { ApiResponse } from "@/services/productService";
import { PayDebtData } from "@/lib/validations/debt";
import { invalidateBusinessData } from "@/lib/query-utils";

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
      invalidateBusinessData(queryClient);
      options?.onSuccess?.(...args);
    },
  });
};
