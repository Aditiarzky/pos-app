"use client";

import { type ReactNode, Suspense, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArchiveRestore,
  FolderTree,
  LayoutGrid,
  Loader2,
  MoreHorizontal,
  Package2,
  Pencil,
  Plus,
  SearchX,
  Table2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { CategoryResponse } from "@/services/categoryService";
import { UnitResponse } from "@/services/unitService";
import { CardBg } from "@/assets/card-background/card-bg";
import { useCategories } from "@/hooks/categories/use-categories";
import { useCreateCategory } from "@/hooks/categories/use-create-category";
import { useUpdateCategory } from "@/hooks/categories/use-update-category";
import { useDeleteCategory } from "@/hooks/categories/use-delete-category";
import { useRestoreCategory } from "@/hooks/categories/use-restore-category";
import { useForceDeleteCategory } from "@/hooks/categories/use-force-delete-category";
import { useUnits } from "@/hooks/units/use-units";
import { useCreateUnit } from "@/hooks/units/use-create-unit";
import { useUpdateUnit } from "@/hooks/units/use-update-unit";
import { useDeleteUnit } from "@/hooks/units/use-delete-unit";
import { useRestoreUnit } from "@/hooks/units/use-restore-unit";
import { useForceDeleteUnit } from "@/hooks/units/use-force-delete-unit";

type ManagedItem = CategoryResponse | UnitResponse;

type ConfirmState = {
  mode: "delete" | "restore" | "force-delete";
  items: ManagedItem[];
};

type EntitySectionProps = {
  title: string;
  description: string;
  entityLabel: string;
  emptyLabel: string;
  icon: ReactNode;
  rows: ManagedItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onCreate: (name: string) => Promise<void>;
  onUpdate: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onRestore: (id: number) => Promise<void>;
  onForceDelete: (id: number) => Promise<void>;
  isMutating: boolean;
};

function getErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Terjadi kesalahan";
  }

  const err = error as {
    error?: string;
    message?: string;
  };

  return err.error || err.message || "Terjadi kesalahan";
}

function EntitySection({
  title,
  description,
  entityLabel,
  emptyLabel,
  icon,
  rows,
  isLoading,
  isError,
  onRetry,
  onCreate,
  onUpdate,
  onDelete,
  onRestore,
  onForceDelete,
  isMutating,
}: EntitySectionProps) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [editingItem, setEditingItem] = useState<ManagedItem | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [selectedMap, setSelectedMap] = useState<Record<number, ManagedItem>>(
    {},
  );

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return rows;
    }

    return rows.filter((row) => row.name.toLowerCase().includes(keyword));
  }, [rows, search]);

  const activeCount = rows.filter((row) => !row.deletedAt).length;
  const deletedCount = rows.length - activeCount;
  const selectedItems = useMemo(
    () => Object.values(selectedMap),
    [selectedMap],
  );
  const isCurrentPageAllChecked =
    filteredRows.length > 0 &&
    filteredRows.every((row) => selectedMap[row.id] !== undefined);

  const toggleOne = (row: ManagedItem, checked: boolean) => {
    setSelectedMap((prev) => {
      if (!checked) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [row.id]: _omit, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [row.id]: row,
      };
    });
  };

  const toggleSelectAllPage = (checked: boolean) => {
    setSelectedMap((prev) => {
      if (!checked) {
        const next = { ...prev };
        for (const row of filteredRows) {
          delete next[row.id];
        }
        return next;
      }

      const next = { ...prev };
      for (const row of filteredRows) {
        next[row.id] = row;
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    const name = draftName.trim();

    if (!name) {
      toast.error(`Nama ${entityLabel.toLowerCase()} wajib diisi`);
      return;
    }

    const promise = editingItem
      ? onUpdate(editingItem.id, name)
      : onCreate(name);

    toast.promise(promise, {
      loading: editingItem
        ? `Menyimpan ${entityLabel.toLowerCase()}...`
        : `Membuat ${entityLabel.toLowerCase()}...`,
      success: editingItem
        ? `${entityLabel} berhasil diperbarui`
        : `${entityLabel} berhasil dibuat`,
      error: (error) => getErrorMessage(error),
    });

    await promise;
    setDialogOpen(false);
    setEditingItem(null);
    setDraftName("");
  };

  const handleConfirm = async () => {
    if (!confirmState) {
      return;
    }

    const items = confirmState.items;
    const activeItems = items.filter((item) => !item.deletedAt);
    const deletedItems = items.filter((item) => item.deletedAt);

    if (confirmState.mode === "delete" && activeItems.length === 0) {
      toast.error(`Tidak ada ${entityLabel.toLowerCase()} aktif untuk dihapus`);
      setConfirmState(null);
      return;
    }

    if (confirmState.mode === "restore" && deletedItems.length === 0) {
      toast.error(
        `Tidak ada ${entityLabel.toLowerCase()} terhapus untuk direstore`,
      );
      setConfirmState(null);
      return;
    }

    if (confirmState.mode === "force-delete" && items.length === 0) {
      toast.error(`Pilih minimal 1 data`);
      setConfirmState(null);
      return;
    }

    const action =
      confirmState.mode === "delete"
        ? Promise.all(activeItems.map((item) => onDelete(item.id)))
        : confirmState.mode === "restore"
          ? Promise.all(deletedItems.map((item) => onRestore(item.id)))
          : Promise.all([
            ...deletedItems.map((item) => onForceDelete(item.id)),
            ...activeItems.map((item) => onDelete(item.id)),
          ]);

    toast.promise(action, {
      loading:
        confirmState.mode === "delete"
          ? `Menghapus ${entityLabel.toLowerCase()}${activeItems.length > 1 ? " terpilih" : ""}...`
          : confirmState.mode === "restore"
            ? `Merestore ${entityLabel.toLowerCase()}${deletedItems.length > 1 ? " terpilih" : ""}...`
            : `Menghapus permanen ${entityLabel.toLowerCase()}${items.length > 1 ? " terpilih" : ""}...`,
      success:
        confirmState.mode === "delete"
          ? `${entityLabel} dipindahkan ke trash`
          : confirmState.mode === "restore"
            ? `${entityLabel} berhasil direstore`
            : `Selesai: ${activeItems.length} soft delete, ${deletedItems.length} permanen`,
      error: (error) => getErrorMessage(error),
    });

    await action;
    setSelectedMap((prev) => {
      const next = { ...prev };
      for (const item of items) {
        delete next[item.id];
      }
      return next;
    });
    setConfirmState(null);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{activeCount} aktif</Badge>
            <Badge variant="outline">{deletedCount} terhapus</Badge>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setDraftName("");
            setDialogOpen(true);
          }}
          className="bg-gradient-to-br from-primary to-green-600 dark:to-green-400 hover:brightness-90 rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah {entityLabel}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={`Cari ${entityLabel.toLowerCase()}...`}
          />
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("table")}
              title="Tampilan Tabel"
            >
              <Table2 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("card")}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedItems.length === 0) {
                  toast.error("Pilih minimal 1 data");
                  return;
                }
                setConfirmState({
                  mode: "force-delete",
                  items: selectedItems,
                });
              }}
              disabled={selectedItems.length === 0 || isMutating}
            >
              <Trash2 className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Delete Selected</span>
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {selectedItems.length > 0
            ? `${selectedItems.length} data dipilih`
            : `Total ${filteredRows.length} ${entityLabel.toLowerCase()}`}
        </div>

        {isLoading ? (
          viewMode === "table" ? (
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/20 border-t border-b border-border/50">
                  <TableRow className="border-none">
                    <TableHead className="w-12 text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide" />
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      Nama
                    </TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      Usage
                    </TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      Created At
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
                <Skeleton key={i} className="h-[180px] rounded-xl" />
              ))}
            </div>
          )
        ) : isError ? (
          <Card className="border-dashed p-8 text-center">
            <p className="font-medium text-destructive">
              Gagal memuat {entityLabel.toLowerCase()}
            </p>
            <Button variant="outline" className="mt-4" onClick={onRetry}>
              Coba Lagi
            </Button>
          </Card>
        ) : filteredRows.length === 0 ? (
          <Card className="flex min-h-[220px] flex-col items-center justify-center border-dashed p-8 text-center">
            <SearchX className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">{emptyLabel}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Belum ada data atau tidak ada hasil yang cocok dengan pencarian.
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
                      Nama
                    </TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      Usage
                    </TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      Created At
                    </TableHead>
                    <TableHead className="w-20 text-right text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-muted/50 transition-colors border-b border-border/30 last:border-none"
                    >
                      <TableCell className="px-2 sm:px-4 py-2">
                        <Checkbox
                          checked={selectedMap[row.id] !== undefined}
                          onCheckedChange={(checked) =>
                            toggleOne(row, Boolean(checked))
                          }
                        />
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2">
                        <div className="font-medium">{row.name}</div>
                        {row.deletedAt ? (
                          <div className="text-xs text-muted-foreground">
                            Dihapus pada {formatDate(row.deletedAt)}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2">
                        <Badge variant="secondary">
                          {(row.usageCount ?? 0).toLocaleString("id-ID")} produk
                        </Badge>
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2">
                        <Badge
                          variant={row.deletedAt ? "destructive" : "outline"}
                        >
                          {row.deletedAt ? "Terhapus" : "Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground px-2 sm:px-4 py-2">
                        {row.createdAt ? formatDate(row.createdAt) : "-"}
                      </TableCell>
                      <TableCell className="text-right px-2 sm:px-4 py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!row.deletedAt ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingItem(row);
                                    setDraftName(row.name);
                                    setDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() =>
                                    setConfirmState({
                                      mode: "delete",
                                      items: [row],
                                    })
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setConfirmState({
                                      mode: "restore",
                                      items: [row],
                                    })
                                  }
                                >
                                  <ArchiveRestore className="mr-2 h-4 w-4" />
                                  Restore
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() =>
                                    setConfirmState({
                                      mode: "force-delete",
                                      items: [row],
                                    })
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Permanently
                                </DropdownMenuItem>
                              </>
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
            {filteredRows.map((row) => (
              <Card
                key={row.id}
                className="relative overflow-hidden border-none shadow-md text-primary"
              >
                <CardHeader className="pb-2 z-10">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-xs font-medium text-muted-foreground">
                        {entityLabel}
                      </CardTitle>
                      <div className="text-base font-semibold truncate text-primary">
                        {row.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedMap[row.id] !== undefined}
                        onCheckedChange={(checked) =>
                          toggleOne(row, Boolean(checked))
                        }
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!row.deletedAt ? (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingItem(row);
                                  setDraftName(row.name);
                                  setDialogOpen(true);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() =>
                                  setConfirmState({
                                    mode: "delete",
                                    items: [row],
                                  })
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmState({
                                    mode: "restore",
                                    items: [row],
                                  })
                                }
                              >
                                <ArchiveRestore className="mr-2 h-4 w-4" />
                                Restore
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() =>
                                  setConfirmState({
                                    mode: "force-delete",
                                    items: [row],
                                  })
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Permanently
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="z-10 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {(row.usageCount ?? 0).toLocaleString("id-ID")} produk
                    </Badge>
                    <Badge
                      variant={row.deletedAt ? "destructive" : "outline"}
                    >
                      {row.deletedAt ? "Terhapus" : "Aktif"}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {row.deletedAt
                      ? `Dihapus pada ${formatDate(row.deletedAt)}`
                      : row.createdAt
                        ? `Dibuat ${formatDate(row.createdAt)}`
                        : "-"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingItem(null);
            setDraftName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `Edit ${entityLabel}` : `Tambah ${entityLabel}`}
            </DialogTitle>
            <DialogDescription>
              Kelola data master {entityLabel.toLowerCase()} untuk POS.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder={`Masukkan nama ${entityLabel.toLowerCase()}`}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isMutating}
            >
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isMutating}>
              {isMutating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : editingItem ? (
                "Simpan Perubahan"
              ) : (
                "Buat Data"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(confirmState)}
        onOpenChange={(open) => !open && setConfirmState(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmState
                ? confirmState.mode === "delete"
                  ? `Soft delete ${entityLabel.toLowerCase()}${confirmState.items.length > 1 ? " terpilih" : ""}?`
                  : confirmState.mode === "restore"
                    ? `Restore ${entityLabel.toLowerCase()}${confirmState.items.length > 1 ? " terpilih" : ""}?`
                    : `Hapus ${entityLabel.toLowerCase()} terpilih?`
                : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmState
                ? confirmState.mode === "delete"
                  ? "Data tidak akan tampil pada dropdown transaksi, tetapi masih bisa direstore."
                  : confirmState.mode === "restore"
                    ? "Data akan aktif kembali dan bisa dipakai pada modul lain."
                    : "Data aktif akan di-soft delete, data terhapus akan dihapus permanen."
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isMutating}
              className={
                confirmState?.mode === "force-delete" // Assumed non-null due to 'open' prop
                  ? "bg-destructive hover:bg-destructive/90"
                  : ""
              }
            >
              {isMutating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : confirmState?.mode === "restore" ? ( // Assumed non-null due to 'open' prop
                "Restore"
              ) : confirmState?.mode === "force-delete" ? ( // Assumed non-null due to 'open' prop
                "Delete Permanently"
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function AccessDenied() {
  return (
    <div className="container mx-auto px-4">
      <Card className="mx-auto max-w-xl border-dashed">
        <CardHeader>
          <CardTitle>Akses Ditolak</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Halaman master data hanya tersedia untuk System Admin.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard">Kembali ke Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function MasterDataContent() {
  const categoriesQuery = useCategories({
    params: { includeDeleted: true },
  });
  const unitsQuery = useUnits({
    params: { includeDeleted: true },
  });

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const restoreCategory = useRestoreCategory();
  const forceDeleteCategory = useForceDeleteCategory();

  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();
  const restoreUnit = useRestoreUnit();
  const forceDeleteUnit = useForceDeleteUnit();

  const categories = categoriesQuery.data?.data ?? [];
  const units = unitsQuery.data?.data ?? [];

  const totalCategories = categories.length;
  const totalUnits = units.length;
  const deletedCategories = categories.filter((item) => item.deletedAt).length;
  const deletedUnits = units.filter((item) => item.deletedAt).length;

  return (
    <>
      <header className="sticky top-6 mx-auto container z-10 flex flex-row px-4 justify-between w-full items-center gap-4 pb-16">
        <div className="overflow-hidden flex gap-2">
          <span className="w-2 bg-primary" />
          <div className="flex flex-col">
            <h1 className="text-2xl text-primary font-geist font-semibold truncate">
              Master Data
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola kategori dan unit produk khusus system admin
            </p>
          </div>
        </div>
      </header>

      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="relative overflow-hidden border-none shadow-md text-primary">
            <CardBg />
            <CardHeader className="pb-2 z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="z-10 text-2xl font-bold">
              {totalCategories}
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden border-none shadow-md text-primary">
            <CardBg />
            <CardHeader className="pb-2 z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Category Trash
              </CardTitle>
            </CardHeader>
            <CardContent className="z-10 text-2xl font-bold">
              {deletedCategories}
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden border-none shadow-md text-primary">
            <CardBg />
            <CardHeader className="pb-2 z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Units
              </CardTitle>
            </CardHeader>
            <CardContent className="z-10 text-2xl font-bold">
              {totalUnits}
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden border-none shadow-md text-primary">
            <CardBg />
            <CardHeader className="pb-2 z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unit Trash
              </CardTitle>
            </CardHeader>
            <CardContent className="z-10 text-2xl font-bold">
              {deletedUnits}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <EntitySection
            title="Categories"
            description="Data kategori produk yang dipakai di katalog dan transaksi."
            entityLabel="Category"
            emptyLabel="Belum ada kategori"
            icon={<FolderTree className="h-5 w-5 text-primary" />}
            rows={categories}
            isLoading={categoriesQuery.isLoading}
            isError={categoriesQuery.isError}
            onRetry={() => {
              void categoriesQuery.refetch();
            }}
            onCreate={(name) => createCategory.mutateAsync({ name }).then(() => undefined)}
            onUpdate={(id, name) =>
              updateCategory.mutateAsync({ id, name }).then(() => undefined)
            }
            onDelete={(id) => deleteCategory.mutateAsync(id).then(() => undefined)}
            onRestore={(id) => restoreCategory.mutateAsync(id).then(() => undefined)}
            onForceDelete={(id) =>
              forceDeleteCategory.mutateAsync(id).then(() => undefined)
            }
            isMutating={
              createCategory.isPending ||
              updateCategory.isPending ||
              deleteCategory.isPending ||
              restoreCategory.isPending ||
              forceDeleteCategory.isPending
            }
          />

          <EntitySection
            title="Units"
            description="Data satuan produk seperti pcs, box, liter, atau unit lain."
            entityLabel="Unit"
            emptyLabel="Belum ada satuan"
            icon={<Package2 className="h-5 w-5 text-primary" />}
            rows={units}
            isLoading={unitsQuery.isLoading}
            isError={unitsQuery.isError}
            onRetry={() => {
              void unitsQuery.refetch();
            }}
            onCreate={(name) => createUnit.mutateAsync({ name }).then(() => undefined)}
            onUpdate={(id, name) =>
              updateUnit.mutateAsync({ id, name }).then(() => undefined)
            }
            onDelete={(id) => deleteUnit.mutateAsync(id).then(() => undefined)}
            onRestore={(id) => restoreUnit.mutateAsync(id).then(() => undefined)}
            onForceDelete={(id) =>
              forceDeleteUnit.mutateAsync(id).then(() => undefined)
            }
            isMutating={
              createUnit.isPending ||
              updateUnit.isPending ||
              deleteUnit.isPending ||
              restoreUnit.isPending ||
              forceDeleteUnit.isPending
            }
          />
        </div>
      </main>
    </>
  );
}

function MasterDataPageContent() {
  return (
    <RoleGuard allowedRoles={["admin sistem"]} fallback={<AccessDenied />}>
      <MasterDataContent />
    </RoleGuard>
  );
}

export default function MasterDataPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <MasterDataPageContent />
    </Suspense>
  );
}
