/**
 * CUSTOM HOOK: usePurchaseList
 * Mengelola state untuk list purchases dengan pagination dan filter
 */

"use client";

import { useQueryState, useQueryStates } from "@/hooks/use-query-state";
import {
  usePurchases,
  useDeletePurchase,
} from "@/hooks/purchases/use-purchases";
import { toast } from "sonner";
import {
  PurchasesQueryParams,
  PurchaseResponse,
} from "../_types/purchase-type";

// ============================================
// HOOK RETURN TYPE
// ============================================

export interface UsePurchaseListReturn {
  purchases: PurchaseResponse[];
  isLoading: boolean;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // Pagination
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;

  // Search
  searchInput: string;
  setSearchInput: (search: string) => void;

  // Date & Supplier Filters
  dateRange: { startDate?: string; endDate?: string };
  setDateRange: (range: { startDate?: string; endDate?: string }) => void;
  supplierId: number | undefined;
  setSupplierId: (supplierId: number | undefined) => void;

  // Sorting
  orderBy: PurchasesQueryParams["orderBy"];
  setOrderBy: (orderBy: PurchasesQueryParams["orderBy"]) => void;
  order: PurchasesQueryParams["order"];
  setOrder: (order: PurchasesQueryParams["order"]) => void;

  // Filters
  hasActiveFilters: boolean;
  resetFilters: () => void;

  analytics?: {
    totalPurchases?: number;
    totalPurchasesThisMonth?: number;
    totalPurchasesLastMonth?: number;
    newTransactions?: number;
    activeSuppliers?: number;
    todayItemsQty?: number;
  };
  // Actions
  handleDelete: (purchaseId: number) => Promise<void>;
  isDeleting: boolean;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function usePurchaseList(): UsePurchaseListReturn {
  const [searchInput, setSearchInput] = useQueryState<string>("q", "", {
    debounce: 500,
    syncWithUrl: true,
  });

  // Pagination & Sorting state using useQueryStates
  const [filters, setFilters] = useQueryStates({
    page: 1,
    limit: 10,
    sort: "createdAt",
    order: "desc",
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    supplierId: undefined as number | undefined,
  });

  const page = filters.page as number;
  const limit = filters.limit as number;
  const orderBy = filters.sort as PurchasesQueryParams["orderBy"];
  const order = filters.order as PurchasesQueryParams["order"];
  const startDate = filters.startDate as string | undefined;
  const endDate = filters.endDate as string | undefined;
  const supplierId = filters.supplierId as number | undefined;

  const setPage = (newPage: number) => setFilters({ page: newPage });
  const setLimit = (newLimit: number) => setFilters({ limit: newLimit, page: 1 });
  const setOrderBy = (newOrderBy: PurchasesQueryParams["orderBy"]) =>
    setFilters({ sort: newOrderBy, page: 1 });
  const setOrder = (newOrder: PurchasesQueryParams["order"]) =>
    setFilters({ order: newOrder, page: 1 });
  const setDateRange = (range: { startDate?: string; endDate?: string }) =>
    setFilters({ startDate: range.startDate, endDate: range.endDate, page: 1 });
  const setSupplierId = (newSupplierId: number | undefined) =>
    setFilters({ supplierId: newSupplierId, page: 1 });

  // Fetch purchases
  const { data: purchasesResult, isLoading } = usePurchases({
    params: {
      page,
      limit,
      search: searchInput,
      startDate,
      endDate,
      supplierId,
      orderBy,
      order,
    },
  });
  const purchases = purchasesResult?.data ?? [];
  const meta = purchasesResult?.meta;
  const analytics = purchasesResult?.analytics;

  // Delete mutation
  const deleteMutation = useDeletePurchase();

  // Check if filters are active
  const hasActiveFilters =
    !!searchInput ||
    orderBy !== "createdAt" ||
    order !== "desc" ||
    !!startDate ||
    !!endDate ||
    !!supplierId;

  // Reset filters
  const resetFilters = () => {
    setSearchInput("");
    setOrderBy("createdAt");
    setOrder("desc");
    setDateRange({});
    setSupplierId(undefined);
    setPage(1);
  };

  // Delete handler (no confirm dialog — modal in form handles confirmation)
  const handleDelete = async (purchaseId: number) => {
    try {
      await deleteMutation.mutateAsync(purchaseId);
      toast.success("Transaksi berhasil dihapus permanen");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus transaksi";
      toast.error(errorMessage);
    }
  };

  const result: UsePurchaseListReturn = {
    // Data
    purchases: purchases as PurchaseResponse[],
    isLoading,
    meta,
    analytics,

    // Pagination
    page,
    setPage,
    limit,
    setLimit,

    // Search
    searchInput,
    setSearchInput,

    // Date & Supplier Filters
    dateRange: { startDate, endDate },
    setDateRange,
    supplierId,
    setSupplierId,

    // Sorting
    orderBy,
    setOrderBy,
    order,
    setOrder,

    // Filters
    hasActiveFilters,
    resetFilters,

    // Actions
    handleDelete,
    isDeleting: deleteMutation.isPending ? true : false,
  };

  return result;
}
