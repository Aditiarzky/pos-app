/**
 * CUSTOM HOOK: useSupplierList
 * Mengelola state untuk list suppliers dengan pagination dan filter
 */

"use client";

import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useSuppliers, useDeleteSupplier } from "@/hooks/master/use-suppliers";
import { useConfirm } from "@/contexts/ConfirmDialog";
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
  handleDelete: (supplier: SupplierResponse) => Promise<void>;
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
  const [orderBy, setOrderBy] = useState<SuppliersQueryParams["orderBy"]>("createdAt");
  const [order, setOrder] = useState<SuppliersQueryParams["order"]>("desc");

  // Query params
  const queryParams: SuppliersQueryParams = {
    page,
    limit,
    search: debouncedSearch,
    orderBy,
    order,
  };

  // Fetch suppliers
  const { data: suppliersResult, isLoading } = useSuppliers();
  const suppliers = suppliersResult?.data ?? [];
  const meta = suppliersResult?.meta;

  // Delete mutation
  const deleteMutation = useDeleteSupplier();
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
  const handleDelete = async (supplier: SupplierResponse) => {
    const ok = await confirm({
      title: "Hapus Supplier",
      description: `Apakah Anda yakin ingin menghapus supplier "${supplier.name}"?`,
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });

    if (ok) {
      try {
        await deleteMutation.mutateAsync(supplier.id);
        toast.success("Supplier berhasil dihapus");
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : "Gagal menghapus supplier";
        toast.error(errorMessage);
      }
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
    handleDelete,
    isDeleting: deleteMutation.isPending ? true : false,
  };

  return result;
}