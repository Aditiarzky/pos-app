import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/services/customerService";
import { MutationConfig, QueryConfig } from "@/lib/react-query";
import {
  customerKeys,
  getCustomersQueryOptions,
  getCustomerDetailQueryOptions,
} from "./master-query-options";
import { dashboardKeys } from "../dashboard/dashboard-query-options";
import { GetCustomersParams } from "@/services/customerService";

type UseCustomersOptions = {
  params?: GetCustomersParams;
  queryConfig?: QueryConfig<typeof getCustomersQueryOptions>;
};

type UseCustomerDetailOptions = {
  id: number;
  queryConfig?: QueryConfig<typeof getCustomerDetailQueryOptions>;
};

type UseCreateCustomerOptions = {
  mutationConfig?: MutationConfig<typeof createCustomer>;
};

type UseUpdateCustomerOptions = {
  mutationConfig?: MutationConfig<typeof updateCustomer>;
};

type UseDeleteCustomerOptions = {
  mutationConfig?: MutationConfig<typeof deleteCustomer>;
};

export const useCustomers = ({
  params,
  queryConfig,
}: UseCustomersOptions = {}) => {
  return useQuery({
    ...getCustomersQueryOptions(params),
    ...queryConfig,
  });
};

export const useCustomerDetail = ({
  id,
  queryConfig,
}: UseCustomerDetailOptions) => {
  return useQuery({
    ...getCustomerDetailQueryOptions(id),
    ...queryConfig,
  });
};

export const useCreateCustomer = ({
  mutationConfig,
}: UseCreateCustomerOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomer,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      // Invalidate semua list customer & dashboard (karena jumlah customer berubah)
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.summary() });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useUpdateCustomer = ({
  mutationConfig,
}: UseUpdateCustomerOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCustomer,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(variables.id),
      });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useDeleteCustomer = ({
  mutationConfig,
}: UseDeleteCustomerOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCustomer,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.summary() });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
