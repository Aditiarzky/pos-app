"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArchiveRestore,
  Loader2,
  MoreHorizontal,
  SearchX,
  Trash2,
} from "lucide-react";

import { useDebounce } from "@/hooks/use-debounce";
import { useTrash } from "@/hooks/trash/useTrash";
import { useRestoreTrash } from "@/hooks/trash/useRestoreTrash";
import { useForceDeleteTrash } from "@/hooks/trash/useForceDeleteTrash";
import { useCleanupTrash } from "@/hooks/trash/useCleanupTrash";
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

type ConfirmAction = {
  mode: "restore" | "force-delete";
  items: TrashItemPayload[];
};

function getTypeLabel(type: TrashListItem["type"]) {
  switch (type) {
    case "product":
      return "Product";
    case "sale":
      return "Sale";
    case "purchase":
      return "Purchase";
    case "customer":
      return "Customer";
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

export default function TrashPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [selectedMap, setSelectedMap] = useState<Record<string, TrashItemPayload>>({});
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const debouncedSearch = useDebounce(searchInput, 400);

  const trashQuery = useTrash({
    params: {
      page,
      limit,
      search: debouncedSearch || undefined,
    },
  });

  const restoreMutation = useRestoreTrash();
  const forceDeleteMutation = useForceDeleteTrash();
  const cleanupTrashMutation = useCleanupTrash();

  const rows = trashQuery.data?.data ?? [];
  const meta = trashQuery.data?.meta;

  const selectedItems = useMemo(() => Object.values(selectedMap), [selectedMap]);

  const isCurrentPageAllChecked =
    rows.length > 0 &&
    rows.every((row) => selectedMap[`${row.type}:${row.id}`] !== undefined);

  const isMutating = restoreMutation.isPending || forceDeleteMutation.isPending;

  useEffect(() => {
    cleanupTrashMutation
      .mutateAsync(undefined)
      .then((res) => {
        const deletedCount = res.data?.deletedCount || 0;
        const skippedCount = res.data?.skippedCount || 0;

        if (deletedCount > 0) {
          toast.success(`🧹 ${deletedCount} data lama di trash berhasil dibersihkan`);
        }

        if (skippedCount > 0) {
          toast.info(`${skippedCount} data batal dihapus karena ada dependency aktif`);
        }
      })
      .catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const openSingleAction = (mode: ConfirmAction["mode"], row: TrashListItem) => {
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

    // After a successful mutation, clear the selected items that were part of the action.
    // This logic was already present and correct for both restore and force-delete.
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
      <header className="sticky top-6 mx-auto container z-10 flex flex-row px-4 justify-between w-full items-center gap-4 pb-16">
        <div className="overflow-hidden flex gap-2">
          <span className="w-2 bg-primary" />
          <div className="flex flex-col">
            <h1 className="text-2xl text-primary font-geist font-semibold truncate">
              Tempat Sampah
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola data nonaktif, archived, dan soft delete
            </p>
          </div>
        </div>
      </header>

      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t">
        <Card className="p-4 space-y-4">
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
              <Button
                variant="outline"
                onClick={() => openBulkAction("restore")}
                disabled={selectedItems.length === 0 || isMutating}
              >
                <ArchiveRestore className="h-4 w-4 mr-2" />
                Restore Selected
              </Button>
              <Button
                variant="destructive"
                onClick={() => openBulkAction("force-delete")}
                disabled={selectedItems.length === 0 || isMutating}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Permanently
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {selectedItems.length > 0
              ? `${selectedItems.length} data dipilih`
              : `Total ${meta?.total || 0} data di trash`}
          </div>

          {trashQuery.isLoading ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-12" />
                    <TableHead>Nama / ID</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Tanggal Dihapus</TableHead>
                    <TableHead className="w-20 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-36" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
                Belum ada data terhapus, atau tidak ada yang cocok dengan pencarian.
              </p>
            </Card>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-[760px]">
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isCurrentPageAllChecked}
                          onCheckedChange={(checked) =>
                            toggleSelectAllPage(Boolean(checked))
                          }
                        />
                      </TableHead>
                      <TableHead>Nama / ID</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Tanggal Dihapus</TableHead>
                      <TableHead className="w-20 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={`${row.type}:${row.id}`}>
                        <TableCell>
                          <Checkbox
                            checked={selectedMap[`${row.type}:${row.id}`] !== undefined}
                            onCheckedChange={(checked) =>
                              toggleOne(row, Boolean(checked))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{row.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.type.toUpperCase()} #{row.id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getTypeLabel(row.type)}</Badge>
                        </TableCell>
                        <TableCell>
                          {row.deleted_at ? formatDate(row.deleted_at) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openSingleAction("restore", row)}
                              >
                                <ArchiveRestore className="h-4 w-4 mr-2" />
                                Restore
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => openSingleAction("force-delete", row)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
        </Card>
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
                  Restore
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
