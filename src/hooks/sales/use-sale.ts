import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSale, deleteSale } from "@/services/saleService";
import { MutationConfig } from "@/lib/react-query";
import { getSalesQueryOptions, saleKeys } from "./sale-query-options";
import { useCallback, useEffect } from "react";
import { invalidateBusinessData } from "@/lib/query-utils";
import { getUserTimezone } from "@/lib/timezone";
import { useQueryState, useQueryStates } from "@/hooks/use-query-state";

type UseCreateSaleOptions = {
  mutationConfig?: MutationConfig<typeof createSale>;
};

type UseDeleteSaleOptions = {
  mutationConfig?: MutationConfig<typeof deleteSale>;
};

type UseSaleListOptions = {
  initialLimit?: number;
  syncWithUrl?: boolean;
};

export const useSaleList = ({
  initialLimit = 10,
  syncWithUrl = false,
}: UseSaleListOptions = {}) => {
  // Search state using useQueryState for responsiveness
  const [searchInput, setSearchInput] = useQueryState<string>("q", "", {
    debounce: 500,
    syncWithUrl: syncWithUrl,
  });

  // Combine other filter states using useQueryStates
  const [filters, setFilters] = useQueryStates({
    page: 1,
    limit: initialLimit,
    status: undefined as string | undefined,
    customerId: undefined as number | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
  });

  const page = filters.page as number;
  const limit = filters.limit as number;
  const status = filters.status as string | undefined;
  const customerId = filters.customerId as number | undefined;
  const startDate = filters.startDate as string | undefined;
  const endDate = filters.endDate as string | undefined;

  const setPage = useCallback((p: number) => setFilters({ page: p }), [setFilters]);
  const setLimit = useCallback((l: number) => setFilters({ limit: l, page: 1 }), [setFilters]);
  const setStatus = useCallback((s: string | undefined) => setFilters({ status: s, page: 1 }), [setFilters]);
  const setCustomerId = useCallback((c: number | undefined) => setFilters({ customerId: c, page: 1 }), [setFilters]);
  const setDateRange = useCallback((range: { startDate?: string; endDate?: string }) => 
    setFilters({ startDate: range.startDate, endDate: range.endDate, page: 1 }), [setFilters]);

  const timezone = getUserTimezone();

  const validParams = {
    page,
    limit,
    search: searchInput || undefined,
    startDate,
    endDate,
    status,
    customerId,
    timezone,
  };

  const query = useQuery(getSalesQueryOptions(validParams));

  const hasActiveFilters =
    !!searchInput || !!startDate || !!status || !!customerId;

  const resetFilters = useCallback(() => {
    setSearchInput("");
    setFilters({
      page: 1,
      status: undefined,
      customerId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  }, [setSearchInput, setFilters]);

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
    dateRange: { startDate, endDate },
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
      invalidateBusinessData(queryClient);
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
      invalidateBusinessData(queryClient);
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
