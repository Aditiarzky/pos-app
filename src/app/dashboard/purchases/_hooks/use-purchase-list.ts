/**
 * CUSTOM HOOK: usePurchaseList
 * Mengelola state untuk list purchases dengan pagination dan filter
 */

"use client";

import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
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

interface UsePurchaseListReturn {
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
  debouncedSearch: string;

  // Sorting
  orderBy: PurchasesQueryParams["orderBy"];
  setOrderBy: (orderBy: PurchasesQueryParams["orderBy"]) => void;
  order: PurchasesQueryParams["order"];
  setOrder: (order: PurchasesQueryParams["order"]) => void;

  // Filters
  hasActiveFilters: boolean;
  resetFilters: () => void;

  // Actions
  handleDelete: (purchase: PurchaseResponse) => Promise<void>;
  isDeleting: boolean;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function usePurchaseList(): UsePurchaseListReturn {
  // Pagination state
  const [page, setPageInternal] = useState(1);
  const [limit, setLimitInternal] = useState(10);

  const setPage = (newPage: number) => setPageInternal(newPage);
  const setLimit = (newLimit: number) => {
    setLimitInternal(newLimit);
    setPageInternal(1);
  };

  // Search state
  const [searchInput, setSearchInputInternal] = useState("");
  const setSearchInput = (search: string) => {
    setSearchInputInternal(search);
    setPageInternal(1);
  };
  const debouncedSearch = useDebounce(searchInput, 500);

  // Sorting state
  const [orderBy, setOrderBy] =
    useState<PurchasesQueryParams["orderBy"]>("createdAt");
  const [order, setOrder] = useState<PurchasesQueryParams["order"]>("desc");

  // Fetch purchases
  const { data: purchasesResult, isLoading } = usePurchases({
    params: {
      page,
      limit,
      search: debouncedSearch,
      orderBy,
      order,
    },
  });
  const purchases = purchasesResult?.data ?? [];
  const meta = purchasesResult?.meta;

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

    // Pagination
    page,
    setPage,
    limit,
    setLimit,

    // Search
    searchInput,
    setSearchInput,
    debouncedSearch,

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
