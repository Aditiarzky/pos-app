"use client";

import { useState } from "react";
import {
  useOperationalCosts,
  useDeleteOperationalCost,
} from "@/hooks/cost/use-cost";
import { useConfirm } from "@/contexts/ConfirmDialog";
import { OperationalCost } from "@/services/costService";
import { toast } from "sonner";

export function useOperationalCostList() {
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(
    undefined,
  );
  const [editingCost, setEditingCost] = useState<OperationalCost | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { costs, meta, isLoading } = useOperationalCosts({
    search: search || undefined,
    isActive: isActiveFilter,
    page,
    limit,
  });

  const deleteMutation = useDeleteOperationalCost({
    onSuccess: () => toast.success("Biaya berhasil dihapus"),
    onError: () => toast.error("Gagal menghapus biaya"),
  });

  const handleOpenCreate = () => {
    setEditingCost(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cost: OperationalCost) => {
    setEditingCost(cost);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCost(null);
  };

  const handleDelete = async (cost: OperationalCost) => {
    const ok = await confirm({
      title: "Hapus Biaya Operasional",
      description: `Apakah Anda yakin ingin menghapus biaya "${cost.name}"? Tindakan ini tidak bisa dibatalkan.`,
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });

    if (!ok) return;
    deleteMutation.mutate(cost.id);
  };

  const handleToggleActive = (_cost: OperationalCost) => {
    // dihandle via form edit
    handleOpenEdit(_cost);
  };

  const hasActiveFilters = isActiveFilter !== undefined;

  const resetFilters = () => {
    setIsActiveFilter(undefined);
    setPage(1);
  };

  return {
    costs,
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
    editingCost,
    isFormOpen,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseForm,
    handleDelete,
    handleToggleActive,
    isDeleting: deleteMutation.isPending,
  };
}
