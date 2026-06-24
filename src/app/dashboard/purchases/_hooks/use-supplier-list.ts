/**
 * CUSTOM HOOK: useSupplierList
 * Mengelola state untuk list suppliers dengan pagination dan filter
 */

"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useSuppliers, useDeleteSupplier } from "@/hooks/master/use-suppliers";
import { toast } from "sonner";
import { SuppliersQueryParams, SupplierResponse } from "../_types/supplier";

// ============================================
// HOOK RETURN TYPE
// ============================================

interface UseSupplierListReturn {
  suppliers: SupplierResponse[];
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
  orderBy: SuppliersQueryParams["orderBy"];
  setOrderBy: (orderBy: SuppliersQueryParams["orderBy"]) => void;
  order: SuppliersQueryParams["order"];
  setOrder: (order: SuppliersQueryParams["order"]) => void;

  // Filters
  hasActiveFilters: boolean;
  resetFilters: () => void;

  // Actions
  deleteTarget: SupplierResponse | null;
  setDeleteTarget: (supplier: SupplierResponse | null) => void;
  handleConfirmDelete: () => Promise<void>;
  isDeleting: boolean;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useSupplierList(): UseSupplierListReturn {
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  // Sorting state
  const [orderBy, setOrderBy] =
    useState<SuppliersQueryParams["orderBy"]>("createdAt");
  const [order, setOrder] = useState<SuppliersQueryParams["order"]>("desc");

  // Reset page to 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Query params
  const queryParams: SuppliersQueryParams = {
    page,
    limit,
    search: debouncedSearch,
    orderBy,
    order,
  };

  // Fetch suppliers
  const { data: suppliersResult, isLoading } = useSuppliers(queryParams);
  const suppliers = suppliersResult?.data ?? [];
  const meta = suppliersResult?.meta;

  // Delete mutation
  const deleteMutation = useDeleteSupplier();

  // Delete target state
  const [deleteTarget, setDeleteTarget] = useState<SupplierResponse | null>(null);

  // Check if filters are active
  const hasActiveFilters = orderBy !== "createdAt" || order !== "desc";

  // Reset filters
  const resetFilters = () => {
    setOrderBy("createdAt");
    setOrder("desc");
    setPage(1);
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Supplier berhasil dipindahkan ke sampah");
      setDeleteTarget(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus supplier";
      toast.error(errorMessage);
    }
  };

  const result: UseSupplierListReturn = {
    // Data
    suppliers,
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
    deleteTarget,
    setDeleteTarget,
    handleConfirmDelete,
    isDeleting: deleteMutation.isPending,
  };

  return result;
}
