"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArchiveRestore,
  Loader2,
  MoreHorizontal,
  SearchX,
  Trash2,
  Settings2,
} from "lucide-react";

import { useDebounce } from "@/hooks/use-debounce";
import { useTrash } from "@/hooks/trash/useTrash";
import { useRestoreTrash } from "@/hooks/trash/useRestoreTrash";
import { useForceDeleteTrash } from "@/hooks/trash/useForceDeleteTrash";
import { useCleanupTrash } from "@/hooks/trash/useCleanupTrash";
import { useTrashSettings } from "@/hooks/trash/use-trash-settings";
import { TrashItemPayload, TrashListItem } from "@/services/trashService";

import { AppPagination } from "@/components/app-pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { RoleGuard } from "@/components/role-guard";
import { AccessDenied } from "@/components/access-denied";
import { ViewModeSwitch } from "@/components/ui/view-mode-switch";
import { FilterWrap } from "@/components/filter-wrap";

type ConfirmAction = {
  mode: "restore" | "force-delete";
  items: TrashItemPayload[];
};

function getTypeLabel(type: TrashListItem["type"]) {
  switch (type) {
    case "product":
      return "Produk";
    case "sale":
      return "Penjualan";
    case "purchase":
      return "Pembelian";
    case "customer":
      return "Pelanggan";
    default:
      return type;
  }
}

function getErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Terjadi kesalahan";
  }

  const err = error as {
    error?: string;
    message?: string;
    reason?: string;
  };

  if (err.message && err.reason) {
    return `${err.message}: ${err.reason}`;
  }

  return err.error || err.message || "Terjadi kesalahan";
}

function TrashContent() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | TrashItemPayload["type"]
  >("all");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [selectedMap, setSelectedMap] = useState<
    Record<string, TrashItemPayload>
  >({});
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );
  const [isManualCleanupPending, setIsManualCleanupPending] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 400);

  const trashQuery = useTrash({
    params: {
      page,
      limit,
      search: debouncedSearch || undefined,
      type: typeFilter === "all" ? undefined : typeFilter,
    },
  });

  const restoreMutation = useRestoreTrash();
  const forceDeleteMutation = useForceDeleteTrash();
  const cleanupTrashMutation = useCleanupTrash();
  const { roles } = useAuth();
  const isSystemAdmin = (roles as string[]).includes("admin sistem");
  
  const { settings, updateInterval, isUpdating } = useTrashSettings();
  const [tempInterval, setTempInterval] = useState<string>("");

  useEffect(() => {
    if (settings) {
      setTempInterval(settings.cleanupIntervalMinutes.toString());
    }
  }, [settings]);

  const handleUpdateInterval = () => {
    const val = parseInt(tempInterval);
    if (isNaN(val) || val < 1) {
      toast.error("Interval minimal 1 menit");
      return;
    }
    updateInterval(val, {
      onSuccess: () => toast.success("Interval pembersihan diperbarui"),
      onError: () => toast.error("Gagal memperbarui interval"),
    });
  };

  const rows = trashQuery.data?.data ?? [];
  const meta = trashQuery.data?.meta;
  const hasActiveTypeFilter = typeFilter !== "all";

  const selectedItems = useMemo(
    () => Object.values(selectedMap),
    [selectedMap],
  );

  const isCurrentPageAllChecked =
    rows.length > 0 &&
    rows.every((row) => selectedMap[`${row.type}:${row.id}`] !== undefined);

  const isMutating = restoreMutation.isPending || forceDeleteMutation.isPending;
  const autoCleanupKey = useMemo(
    () => `trash:auto_cleanup:${new Date().toISOString().slice(0, 10)}`,
    [],
  );

  useEffect(() => {
    if (!isSystemAdmin || typeof window === "undefined") {
      return;
    }

    if (window.sessionStorage.getItem(autoCleanupKey) === "1") {
      return;
    }
    window.sessionStorage.setItem(autoCleanupKey, "1");
    runCleanupExpired({ rethrow: true })
      .catch(() => {
        window.sessionStorage.removeItem(autoCleanupKey);
      });
    return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCleanupKey, isSystemAdmin]);

  const runCleanupExpired = async (options?: {
    showNoopToast?: boolean;
    trackManualLoading?: boolean;
    rethrow?: boolean;
  }) => {
    if (options?.trackManualLoading) {
      setIsManualCleanupPending(true);
    }

    try {
      const res = await cleanupTrashMutation.mutateAsync(undefined);
      const deletedCount = res.data?.deletedCount || 0;
      const skippedCount = res.data?.skippedCount || 0;

      if (deletedCount > 0) {
        toast.success(`${deletedCount} data lama di trash berhasil dibersihkan`);
      } else if (options?.showNoopToast) {
        toast.info("Tidak ada data trash yang perlu dibersihkan");
      }

      if (skippedCount > 0) {
        toast.info(`${skippedCount} data batal dihapus karena ada dependency aktif`);
      }
    } catch (error) {
      toast.error("Gagal menjalankan cleanup trash");
      if (options?.rethrow) {
        throw error;
      }
    } finally {
      if (options?.trackManualLoading) {
        setIsManualCleanupPending(false);
      }
    }
  };

  const toggleOne = (row: TrashListItem, checked: boolean) => {
    const key = `${row.type}:${row.id}`;

    setSelectedMap((prev) => {
      if (!checked) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [key]: _omit, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [key]: { id: row.id, type: row.type },
      };
    });
  };

  const toggleSelectAllPage = (checked: boolean) => {
    setSelectedMap((prev) => {
      if (!checked) {
        const next = { ...prev };
        for (const row of rows) {
          delete next[`${row.type}:${row.id}`];
        }
        return next;
      }

      const next = { ...prev };
      for (const row of rows) {
        next[`${row.type}:${row.id}`] = { id: row.id, type: row.type };
      }
      return next;
    });
  };

  const openSingleAction = (
    mode: ConfirmAction["mode"],
    row: TrashListItem,
  ) => {
    setConfirmAction({
      mode,
      items: [{ id: row.id, type: row.type }],
    });
  };

  const openBulkAction = (mode: ConfirmAction["mode"]) => {
    if (selectedItems.length === 0) {
      toast.error("Pilih minimal 1 data");
      return;
    }

    setConfirmAction({
      mode,
      items: selectedItems,
    });
  };

  const runConfirmedAction = async () => {
    if (!confirmAction) return;

    const payload =
      confirmAction.items.length > 1
        ? { items: confirmAction.items }
        : confirmAction.items[0];

    const actionPromise =
      confirmAction.mode === "restore"
        ? restoreMutation.mutateAsync(payload)
        : forceDeleteMutation.mutateAsync(payload);

    toast.promise(actionPromise, {
      loading:
        confirmAction.mode === "restore"
          ? "Memulihkan data..."
          : "Menghapus permanen data...",
      success: (res) => res.message || "Berhasil",
      error: (err) => getErrorMessage(err),
    });

    setConfirmAction(null);

    setSelectedMap((prev) => {
      const next = { ...prev };
      for (const item of confirmAction.items) {
        delete next[`${item.type}:${item.id}`];
      }
      return next;
    });
  };

  return (
    <>
      <header className="sticky top-6 mx-auto container z-10 flex flex-row px-4 sm:px-6 justify-between w-full items-center gap-4 pb-16">
        <div className="flex items-center gap-4">
          <div className="h-12 w-1.5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
          <div className="flex flex-col">
            <h1 className="text-3xl text-primary font-bold tracking-tight">
              Tempat Sampah
            </h1>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-80">
              Arsip Data Dihapus • Pemulihan Data
            </p>
          </div>
        </div>
      </header>

      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            placeholder="Cari nama data / nomor dokumen..."
            value={searchInput}
            onChange={(value) => {
              setSearchInput(value);
              setPage(1);
            }}
          />

          <div className="flex gap-2">
            <FilterWrap hasActiveFilters={hasActiveTypeFilter}>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter("all");
                    setPage(1);
                  }}
                  className={`w-full flex items-center justify-center rounded-md border px-3 py-1.5 text-xs cursor-pointer hover:bg-muted ${typeFilter === "all" ? "bg-muted" : "bg-muted/50"}`}
                >
                  Semua Tipe
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter("product");
                    setPage(1);
                  }}
                  className={`w-full flex items-center justify-center rounded-md border px-3 py-1.5 text-xs cursor-pointer hover:bg-muted ${typeFilter === "product" ? "bg-muted" : "bg-muted/50"}`}
                >
                  Produk
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter("sale");
                    setPage(1);
                  }}
                  className={`w-full flex items-center justify-center rounded-md border px-3 py-1.5 text-xs cursor-pointer hover:bg-muted ${typeFilter === "sale" ? "bg-muted" : "bg-muted/50"}`}
                >
                  Penjualan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter("purchase");
                    setPage(1);
                  }}
                  className={`w-full flex items-center justify-center rounded-md border px-3 py-1.5 text-xs cursor-pointer hover:bg-muted ${typeFilter === "purchase" ? "bg-muted" : "bg-muted/50"}`}
                >
                  Pembelian
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter("customer");
                    setPage(1);
                  }}
                  className={`w-full flex items-center justify-center rounded-md border px-3 py-1.5 text-xs cursor-pointer hover:bg-muted ${typeFilter === "customer" ? "bg-muted" : "bg-muted/50"}`}
                >
                  Pelanggan
                </button>
              </div>
            </FilterWrap>

            <div className="h-10 w-[1px] bg-border mx-1 hidden sm:block" />
            <ViewModeSwitch value={viewMode} onChange={setViewMode} />

            {isSystemAdmin && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-xl">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Pengaturan Cleanup</h4>
                      <p className="text-sm text-muted-foreground">
                        Atur seberapa sering sistem mengecek data expired.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interval">Interval Pengecekan (Menit)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="interval"
                          type="number"
                          value={tempInterval}
                          onChange={(e) => setTempInterval(e.target.value)}
                          className="h-9"
                          min={1}
                        />
                        <Button 
                          size="sm" 
                          onClick={handleUpdateInterval}
                          disabled={isUpdating}
                        >
                          {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Simpan"}
                        </Button>
                      </div>
                      {settings?.lastCleanupAt && (
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Terakhir dijalankan: {formatDate(settings.lastCleanupAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <Button
              variant="outline"
              onClick={() => openBulkAction("restore")}
              disabled={selectedItems.length === 0 || isMutating}
            >
              <ArchiveRestore className="h-4 w-4 mr-0 sm:mr-2" />
              <p className="hidden sm:block">Restore Selected</p>
            </Button>
            {isSystemAdmin && (
              <Button
                variant="outline"
                onClick={() =>
                  runCleanupExpired({
                    showNoopToast: true,
                    trackManualLoading: true,
                  })
                }
                disabled={isManualCleanupPending || isMutating}
              >
                {isManualCleanupPending ? (
                  <Loader2 className="h-4 w-4 mr-0 sm:mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-0 sm:mr-2" />
                )}
                <p className="hidden sm:block">Cleanup Expired</p>
              </Button>
            )}
            {isSystemAdmin && (
              <Button
                variant="destructive"
                onClick={() => openBulkAction("force-delete")}
                disabled={selectedItems.length === 0 || isMutating}
              >
                <Trash2 className="h-4 w-4 mr-0 sm:mr-2" />
                <p className="hidden sm:block">Delete Permanently</p>
              </Button>
            )}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {selectedItems.length > 0
            ? `${selectedItems.length} data dipilih`
            : `Total ${trashQuery.data?.meta?.total || 0} data di trash${typeFilter !== "all" ? ` (${getTypeLabel(typeFilter)})` : ""}`}
        </div>

        {trashQuery.isLoading ? (
          viewMode === "table" ? (
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/20 border-t border-b border-border/50">
                  <TableRow className="border-none">
                    <TableHead className="w-12 text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide" />
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      Nama / ID
                    </TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      Tipe
                    </TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      Tanggal Dihapus
                    </TableHead>
                    <TableHead className="w-20 text-right text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableRow
                      key={i}
                      className="border-b border-border/30 last:border-none"
                    >
                      <TableCell className="px-2 sm:px-4 py-2">
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2">
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2">
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2">
                        <Skeleton className="h-4 w-36" />
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2">
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-[170px] sm:h-[200px] rounded-xl"
                />
              ))}
            </div>
          )
        ) : trashQuery.isError ? (
          <Card className="p-8 text-center text-destructive border-dashed">
            <p className="font-semibold">Gagal memuat data trash</p>
            <p className="text-sm mt-1 text-muted-foreground">
              {getErrorMessage(trashQuery.error)}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => trashQuery.refetch()}
            >
              Coba Lagi
            </Button>
          </Card>
        ) : rows.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed text-muted-foreground min-h-[280px]">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 text-2xl">
              <SearchX />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              Tempat sampah kosong
            </h3>
            <p className="text-sm max-w-xs mx-auto">
              Belum ada data terhapus, atau tidak ada yang cocok dengan
              pencarian.
            </p>
          </Card>
        ) : viewMode === "table" ? (
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader className="bg-muted/20 border-t border-b border-border/50">
                  <TableRow className="border-none">
                    <TableHead className="w-12 text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      <Checkbox
                        checked={isCurrentPageAllChecked}
                        onCheckedChange={(checked) =>
                          toggleSelectAllPage(Boolean(checked))
                        }
                      />
                    </TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      Nama / ID
                    </TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      Tipe
                    </TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      Tanggal Dihapus
                    </TableHead>
                    <TableHead className="w-20 text-right text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={`${row.type}:${row.id}`}
                      className="hover:bg-muted/50 transition-colors border-b border-border/30 last:border-none"
                    >
                      <TableCell className="px-2 sm:px-4 py-2">
                        <Checkbox
                          checked={
                            selectedMap[`${row.type}:${row.id}`] !== undefined
                          }
                          onCheckedChange={(checked) =>
                            toggleOne(row, Boolean(checked))
                          }
                        />
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2">
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.type.toUpperCase()} #{row.id}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2">
                        <Badge variant="secondary">
                          {getTypeLabel(row.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[12px] sm:text-sm px-2 sm:px-4 py-2 text-muted-foreground">
                        {row.deleted_at ? formatDate(row.deleted_at) : "-"}
                      </TableCell>
                      <TableCell className="text-right px-2 sm:px-4 py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openSingleAction("restore", row)}
                            >
                              <ArchiveRestore className="h-4 w-4 mr-2" />
                              Pulihkan
                            </DropdownMenuItem>
                            {isSystemAdmin && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() =>
                                  openSingleAction("force-delete", row)
                                }
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus Permanen
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            {rows.map((row) => (
              <Card
                key={`${row.type}:${row.id}`}
                className="group py-0 overflow-hidden gap-0 hover:shadow-lg transition-all duration-300 flex flex-col h-full border-muted/50"
              >
                <div className="relative h-20 sm:h-24 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 p-2.5 sm:p-4 flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold text-xs sm:text-sm truncate">
                      {row.name}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      {row.type.toUpperCase()} #{row.id}
                    </div>
                  </div>
                  <Checkbox
                    checked={selectedMap[`${row.type}:${row.id}`] !== undefined}
                    onCheckedChange={(checked) =>
                      toggleOne(row, Boolean(checked))
                    }
                  />
                </div>

                <div className="p-2.5 sm:p-4 flex-1 space-y-2">
                  <Badge variant="secondary" className="text-[10px] w-fit">
                    {getTypeLabel(row.type)}
                  </Badge>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    {row.deleted_at ? formatDate(row.deleted_at) : "-"}
                  </div>
                </div>

                <div className="px-2.5 sm:px-4 py-2 sm:py-3 border-t bg-muted/30 flex justify-end mt-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => openSingleAction("restore", row)}
                      >
                        <ArchiveRestore className="h-4 w-4 mr-2" />
                        Pulihkan
                      </DropdownMenuItem>
                      {isSystemAdmin && (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => openSingleAction("force-delete", row)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus Permanen
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}

        {meta && meta.totalPages > 0 && (
          <AppPagination
            currentPage={page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        )}
      </main>

      <AlertDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.mode === "restore"
                ? "Pulihkan data terpilih?"
                : "Hapus permanen data terpilih?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.mode === "restore"
                ? "Data akan diaktifkan kembali. Sistem akan melakukan validasi integritas sebelum restore."
                : "Data akan dihapus permanen dari database dan tidak bisa dikembalikan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={runConfirmedAction}
              disabled={isMutating}
              className={
                confirmAction?.mode === "force-delete"
                  ? "bg-destructive hover:bg-destructive/90"
                  : ""
              }
            >
              {isMutating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : confirmAction?.mode === "restore" ? (
                <>
                  <ArchiveRestore className="h-4 w-4 mr-2" />
                  Pulihkan
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus Permanen
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function TrashPage() {
  return (
    <RoleGuard allowedRoles={["admin sistem"]} fallback={<AccessDenied />}>
      <TrashContent />
    </RoleGuard>
  );
}
