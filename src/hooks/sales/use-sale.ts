import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSale, deleteSale } from "@/services/saleService";
import { MutationConfig } from "@/lib/react-query";
import { getSalesQueryOptions, saleKeys } from "./sale-query-options";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { productKeys } from "../products/product-query-options";
import { debtKeys } from "../debt/debt-query-options";

type UseCreateSaleOptions = {
  mutationConfig?: MutationConfig<typeof createSale>;
};

type UseDeleteSaleOptions = {
  mutationConfig?: MutationConfig<typeof deleteSale>;
};

type UseSaleListOptions = {
  initialLimit?: number;
  search?: string;
};

export const useSaleList = ({
  initialLimit = 10,
  search: externalSearch,
}: UseSaleListOptions = {}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(externalSearch ?? searchInput, 500);

  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const [status, setStatus] = useState<string | undefined>();
  const [customerId, setCustomerId] = useState<number | undefined>();

  const validParams = {
    page,
    limit,
    search: debouncedSearch || undefined,
    ...dateRange,
    status,
    customerId,
  };

  const query = useQuery(getSalesQueryOptions(validParams));

  const hasActiveFilters =
    !!debouncedSearch || !!dateRange.startDate || !!status || !!customerId;

  const resetFilters = () => {
    setSearchInput("");
    setDateRange({});
    setStatus(undefined);
    setCustomerId(undefined);
    setPage(1);
  };

  return {
    sales: query.data?.data,
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
    status,
    setStatus,
    customerId,
    setCustomerId,
    hasActiveFilters,
    resetFilters,
    refetch: query.refetch,
  };
};

export const useCreateSale = ({
  mutationConfig,
}: UseCreateSaleOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSale,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useDeleteSale = ({
  mutationConfig,
}: UseDeleteSaleOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSale,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: debtKeys.lists() });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
