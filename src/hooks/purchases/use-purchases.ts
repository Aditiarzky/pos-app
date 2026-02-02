import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPurchase,
  updatePurchase,
  deletePurchase,
} from "@/services/purchaseService";
import { MutationConfig, QueryConfig } from "@/lib/react-query";
import {
  getPurchasesQueryOptions,
  purchaseKeys,
} from "./purchase-query-options";
import { productKeys } from "../products/product-query-options";

type UseUpdatePurchaseOptions = {
  mutationConfig?: MutationConfig<typeof updatePurchase>;
};

type UseDeletePurchaseOptions = {
  mutationConfig?: MutationConfig<typeof deletePurchase>;
};

type UseCreatePurchaseOptions = {
  mutationConfig?: MutationConfig<typeof createPurchase>;
};

type UsePurchasesOptions = {
  params?: Record<string, unknown>;
  queryConfig?: QueryConfig<typeof getPurchasesQueryOptions>;
};

export const usePurchases = ({
  params,
  queryConfig,
}: UsePurchasesOptions = {}) => {
  return useQuery({
    ...getPurchasesQueryOptions(params),
    ...queryConfig,
  });
};

export const useCreatePurchase = ({
  mutationConfig,
}: UseCreatePurchaseOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPurchase,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useUpdatePurchase = ({
  mutationConfig,
}: UseUpdatePurchaseOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePurchase,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: purchaseKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useDeletePurchase = ({
  mutationConfig,
}: UseDeletePurchaseOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePurchase,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
