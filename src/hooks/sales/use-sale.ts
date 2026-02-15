import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSale, deleteSale } from "@/services/saleService";
import { MutationConfig, QueryConfig } from "@/lib/react-query";
import { getSalesQueryOptions, saleKeys } from "./sale-query-options";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { productKeys } from "../products/product-query-options";

type UseCreateSaleOptions = {
  mutationConfig?: MutationConfig<typeof createSale>;
};

type UseDeleteSaleOptions = {
  mutationConfig?: MutationConfig<typeof deleteSale>;
};

type UseSaleListOptions = {
  initialLimit?: number;
};

export const useSaleList = ({ initialLimit = 10 }: UseSaleListOptions = {}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const validParams = {
    page,
    limit,
    search: debouncedSearch || undefined,
    ...dateRange,
  };

  const query = useQuery(getSalesQueryOptions(validParams));

  const hasActiveFilters = !!debouncedSearch || !!dateRange.startDate;

  const resetFilters = () => {
    setSearchInput("");
    setDateRange({});
    setPage(1);
  };

  return {
    sales: query.data?.data,
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
    dateRange,
    setDateRange,
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
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
