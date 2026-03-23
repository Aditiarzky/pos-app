import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import {
  operationalCostKeys,
  taxConfigKeys,
  getCostAnalyticsQueryOptions,
  getOperationalCostsQueryOptions,
  getOperationalCostQueryOptions,
  getTaxConfigsQueryOptions,
  getTaxConfigQueryOptions,
} from "./cost-query-options";
import {
  createOperationalCost,
  updateOperationalCost,
  deleteOperationalCost,
  createTaxConfig,
  updateTaxConfig,
  deleteTaxConfig,
  OperationalCost,
  TaxConfig,
  GetOperationalCostsParams,
  GetTaxConfigsParams,
} from "@/services/costService";
import { ApiResponse } from "@/services/productService";
import {
  OperationalCostType,
  UpdateOperationalCostType,
} from "@/lib/validations/operational-cost";
import {
  TaxConfigType,
  UpdateTaxConfigType,
} from "@/lib/validations/tax-config";
import { invalidateBusinessData } from "@/lib/query-utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type CreateOperationalCostResponse = ApiResponse<OperationalCost>;
type UpdateOperationalCostResponse = ApiResponse<OperationalCost>;
type DeleteOperationalCostResponse = ApiResponse<{ message: string }>;

type CreateTaxConfigResponse = ApiResponse<TaxConfig>;
type UpdateTaxConfigResponse = ApiResponse<TaxConfig>;
type DeleteTaxConfigResponse = ApiResponse<{ message: string }>;

// ── Operational Cost Hooks ────────────────────────────────────────────────────

export const useOperationalCosts = (params: GetOperationalCostsParams = {}) => {
  const query = useQuery(getOperationalCostsQueryOptions(params));
  return {
    ...query,
    costs: query.data?.data,
    meta: query.data?.meta,
  };
};

export const useOperationalCost = (id: number) => {
  const query = useQuery(getOperationalCostQueryOptions(id));
  return {
    ...query,
    cost: query.data?.data,
  };
};

export const useCreateOperationalCost = (
  options?: UseMutationOptions<
    CreateOperationalCostResponse,
    Error,
    OperationalCostType
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOperationalCost,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: operationalCostKeys.lists() });
      invalidateBusinessData(queryClient);
      options?.onSuccess?.(...args);
    },
  });
};

export const useUpdateOperationalCost = (
  options?: UseMutationOptions<
    UpdateOperationalCostResponse,
    Error,
    { id: number; data: UpdateOperationalCostType }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOperationalCost,
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: operationalCostKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: operationalCostKeys.detail(variables.id),
      });
      invalidateBusinessData(queryClient);
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
};

export const useDeleteOperationalCost = (
  options?: UseMutationOptions<
    DeleteOperationalCostResponse,
    Error,
    number
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOperationalCost,
    ...options,
    onSuccess: (data, id, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: operationalCostKeys.lists() });
      queryClient.removeQueries({
        queryKey: operationalCostKeys.detail(id),
      });
      invalidateBusinessData(queryClient);
      options?.onSuccess?.(data, id, context, mutation);
    },
  });
};

// ── Tax Config Hooks ──────────────────────────────────────────────────────────

export const useTaxConfigs = (params: GetTaxConfigsParams = {}) => {
  const query = useQuery(getTaxConfigsQueryOptions(params));
  return {
    ...query,
    taxConfigs: query.data?.data,
    meta: query.data?.meta,
  };
};

export const useTaxConfig = (id: number) => {
  const query = useQuery(getTaxConfigQueryOptions(id));
  return {
    ...query,
    taxConfig: query.data?.data,
  };
};

export const useCostAnalytics = () => {
  const query = useQuery(getCostAnalyticsQueryOptions());
  return {
    ...query,
    analytics: query.data?.data,
  };
};

export const useCreateTaxConfig = (
  options?: UseMutationOptions<
    CreateTaxConfigResponse,
    Error,
    TaxConfigType
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTaxConfig,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: taxConfigKeys.lists() });
      invalidateBusinessData(queryClient);
      options?.onSuccess?.(...args);
    },
  });
};

export const useUpdateTaxConfig = (
  options?: UseMutationOptions<
    UpdateTaxConfigResponse,
    Error,
    { id: number; data: UpdateTaxConfigType }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTaxConfig,
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: taxConfigKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: taxConfigKeys.detail(variables.id),
      });
      invalidateBusinessData(queryClient);
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
};

export const useDeleteTaxConfig = (
  options?: UseMutationOptions<
    DeleteTaxConfigResponse,
    Error,
    number
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTaxConfig,
    ...options,
    onSuccess: (data, id, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: taxConfigKeys.lists() });
      queryClient.removeQueries({
        queryKey: taxConfigKeys.detail(id),
      });
      invalidateBusinessData(queryClient);
      options?.onSuccess?.(data, id, context, mutation);
    },
  });
};
