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

  const validParams = {
    page,
    limit,
    search: debouncedSearch || undefined,
  };

  const query = useQuery(getCustomerReturnsQueryOptions(validParams));

  const hasActiveFilters = !!debouncedSearch;

  const resetFilters = () => {
    setSearchInput("");
    setPage(1);
  };

  return {
    customerReturns: query.data?.data,
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    page,
    setPage,
    limit,
    setLimit,
    searchInput,
    setSearchInput,
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
