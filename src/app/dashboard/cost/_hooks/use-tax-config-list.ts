"use client";

import { useState } from "react";
import { useTaxConfigs, useDeleteTaxConfig } from "@/hooks/cost/use-cost";
import { TaxConfig } from "@/services/costService";
import { toast } from "sonner";

export function useTaxConfigList() {
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [editingTax, setEditingTax] = useState<TaxConfig | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { taxConfigs, meta, isLoading } = useTaxConfigs({
    search: search || undefined,
    isActive: isActiveFilter,
    page,
    limit,
  });

  const deleteMutation = useDeleteTaxConfig({
    onSuccess: () => toast.success("Pajak berhasil dihapus"),
    onError: () => toast.error("Gagal menghapus pajak"),
  });

  const handleOpenCreate = () => {
    setEditingTax(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (tax: TaxConfig) => {
    setEditingTax(tax);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTax(null);
  };

  const handleDelete = (tax: TaxConfig) => {
    if (!confirm(`Hapus pajak "${tax.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    deleteMutation.mutate(tax.id);
  };

  const hasActiveFilters = isActiveFilter !== undefined;

  const resetFilters = () => {
    setIsActiveFilter(undefined);
    setPage(1);
  };

  return {
    taxConfigs,
    meta,
    isLoading,
    search,
    setSearch,
    isActiveFilter,
    setIsActiveFilter,
    page,
    setPage,
    limit,
    setLimit,
    hasActiveFilters,
    resetFilters,
    editingTax,
    isFormOpen,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseForm,
    handleDelete,
    isDeleting: deleteMutation.isPending,
  };
}
