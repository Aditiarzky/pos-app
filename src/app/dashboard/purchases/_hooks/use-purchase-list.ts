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
import { useConfirm } from "@/contexts/ConfirmDialog";
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
  handleDelete: (purchase: PurchaseResponse) => Promise<void>;
  isDeleting: boolean;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function usePurchaseList(): UsePurchaseListReturn {
  const [searchInput, setSearchInput] = useQueryState<string>("q", "", { 
    debounce: 500,
    syncWithUrl: false 
  });

  // Pagination & Sorting state using useQueryStates
  const [filters, setFilters] = useQueryStates({
    page: 1,
    limit: 10,
    sort: "createdAt",
    order: "desc",
  });

  const page = filters.page as number;
  const limit = filters.limit as number;
  const orderBy = filters.sort as PurchasesQueryParams["orderBy"];
  const order = filters.order as PurchasesQueryParams["order"];

  const setPage = (newPage: number) => setFilters({ page: newPage });
  const setLimit = (newLimit: number) => setFilters({ limit: newLimit, page: 1 });
  const setOrderBy = (newOrderBy: PurchasesQueryParams["orderBy"]) =>
    setFilters({ sort: newOrderBy, page: 1 });
  const setOrder = (newOrder: PurchasesQueryParams["order"]) =>
    setFilters({ order: newOrder, page: 1 });

  // Fetch purchases
  const { data: purchasesResult, isLoading } = usePurchases({
    params: {
      page,
      limit,
      search: searchInput,
      orderBy,
      order,
    },
  });
  const purchases = purchasesResult?.data ?? [];
  const meta = purchasesResult?.meta;
  const analytics = purchasesResult?.analytics;

  // Delete mutation
  const deleteMutation = useDeletePurchase();
  const confirm = useConfirm();

  // Check if filters are active
  const hasActiveFilters = orderBy !== "createdAt" || order !== "desc";

  // Reset filters
  const resetFilters = () => {
    setOrderBy("createdAt");
    setOrder("desc");
    setPage(1);
  };

  // Delete handler
  const handleDelete = async (purchase: PurchaseResponse) => {
    const ok = await confirm({
      title: "Hapus Pembelian",
      description: `Apakah Anda yakin ingin menghapus transaksi ${purchase.orderNumber}? Stok produk akan dikembalikan dan data akan diarsipkan.`,
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });

    if (ok) {
      try {
        await deleteMutation.mutateAsync(purchase.id);
        toast.success("Transaksi berhasil dihapus");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Gagal menghapus transaksi";
        toast.error(errorMessage);
      }
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
