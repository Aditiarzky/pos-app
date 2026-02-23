import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCustomerReturn,
  deleteCustomerReturn,
} from "@/services/customerReturnService";
import { MutationConfig } from "@/lib/react-query";
import {
  customerReturnKeys,
  getCustomerReturnsQueryOptions,
} from "./customer-return-query-options";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { productKeys } from "../products/product-query-options";

type UseCreateCustomerReturnOptions = {
  mutationConfig?: MutationConfig<typeof createCustomerReturn>;
};

type UseDeleteCustomerReturnOptions = {
  mutationConfig?: MutationConfig<typeof deleteCustomerReturn>;
};

type UseCustomerReturnListOptions = {
  initialLimit?: number;
};

export const useCustomerReturnList = ({
  initialLimit = 10,
}: UseCustomerReturnListOptions = {}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const [compensationType, setCompensationType] = useState<
    string | undefined
  >();
  const [customerId, setCustomerId] = useState<number | undefined>();

  const validParams = {
    page,
    limit,
    search: debouncedSearch || undefined,
    ...dateRange,
    compensationType,
    customerId,
  };

  const query = useQuery(getCustomerReturnsQueryOptions(validParams));

  const hasActiveFilters =
    !!debouncedSearch ||
    !!dateRange.startDate ||
    !!compensationType ||
    !!customerId;

  const resetFilters = () => {
    setSearchInput("");
    setDateRange({});
    setCompensationType(undefined);
    setCustomerId(undefined);
    setPage(1);
  };

  return {
    customerReturns: query.data?.data,
    meta: query.data?.meta,
    analytics: query.data?.analytics,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    page,
    setPage,
    limit,
    setLimit,
    searchInput,
    setSearchInput,
    dateRange,
    setDateRange,
    compensationType,
    setCompensationType,
    customerId,
    setCustomerId,
    hasActiveFilters,
    resetFilters,
    refetch: query.refetch,
  };
};

export const useCreateCustomerReturn = ({
  mutationConfig,
}: UseCreateCustomerReturnOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomerReturn,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: customerReturnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useDeleteCustomerReturn = ({
  mutationConfig,
}: UseDeleteCustomerReturnOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCustomerReturn,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: customerReturnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
