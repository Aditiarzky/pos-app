"use client";

import { type ReactNode, Suspense, useEffect, useMemo, useState } from "react";
import { FolderTree, Loader2, MoreHorizontal, Package2, Pencil, Plus, SearchX, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AppPagination } from "@/components/app-pagination";
import { formatDate } from "@/lib/format";
import { CategoryResponse } from "@/services/categoryService";
import { UnitResponse } from "@/services/unitService";
import { CardBg } from "@/assets/card-background/card-bg";
import { useCategories } from "@/hooks/categories/use-categories";
import { useCreateCategory } from "@/hooks/categories/use-create-category";
import { useUpdateCategory } from "@/hooks/categories/use-update-category";
import { useDeleteCategory } from "@/hooks/categories/use-delete-category";
import { useUnits } from "@/hooks/units/use-units";
import { useCreateUnit } from "@/hooks/units/use-create-unit";
import { useUpdateUnit } from "@/hooks/units/use-update-unit";
import { useDeleteUnit } from "@/hooks/units/use-delete-unit";
import { AccessDenied } from "@/components/access-denied";
import { RelationAwareDeleteDialog } from "@/components/relation-aware-delete-dialog";

type ManagedItem = CategoryResponse | UnitResponse;

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
  isMutating: boolean;
  relationsUrlPrefix: string; // e.g. "/api/categories" or "/api/units"
};

function getErrorMessage(error: unknown) {
  const err = error as { error?: string; message?: string };
  return err?.error || err?.message || "Terjadi kesalahan";
}

function EntitySection({
  title, description, entityLabel, emptyLabel, icon,
  rows, isLoading, isError, onRetry,
  onCreate, onUpdate, onDelete, isMutating, relationsUrlPrefix,
}: EntitySectionProps) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [editingItem, setEditingItem] = useState<ManagedItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filteredRows = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return kw ? rows.filter((r) => r.name.toLowerCase().includes(kw)) : rows;
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / limit));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredRows.slice(start, start + limit);
  }, [filteredRows, limit, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  const handleSubmit = async () => {
    const name = draftName.trim();
    if (!name) { toast.error(`Nama ${entityLabel.toLowerCase()} wajib diisi`); return; }
    const promise = editingItem ? onUpdate(editingItem.id, name) : onCreate(name);
    toast.promise(promise, {
      loading: editingItem ? `Menyimpan...` : `Membuat...`,
      success: editingItem ? `${entityLabel} berhasil diperbarui` : `${entityLabel} berhasil dibuat`,
      error: getErrorMessage,
    });
    await promise;
    setDialogOpen(false);
    setEditingItem(null);
    setDraftName("");
    setPage(1);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      toast.success(`${entityLabel} berhasil dihapus`);
      setDeleteTarget(null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg">{icon}{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
          <Badge variant="secondary">{filteredRows.length} data</Badge>
        </div>
        <Button onClick={() => { setEditingItem(null); setDraftName(""); setDialogOpen(true); }}
          className="bg-gradient-to-br from-primary to-green-600 dark:to-green-400 hover:brightness-90 rounded-xl">
          <Plus className="mr-2 h-4 w-4" />Tambah {entityLabel}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <SearchInput value={search} onChange={setSearch} placeholder={`Cari ${entityLabel.toLowerCase()}...`} />

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : isError ? (
          <Card className="border-dashed p-8 text-center">
            <p className="font-medium text-destructive">Gagal memuat {entityLabel.toLowerCase()}</p>
            <Button variant="outline" className="mt-4" onClick={onRetry}>Coba Lagi</Button>
          </Card>
        ) : filteredRows.length === 0 ? (
          <Card className="flex min-h-[220px] flex-col items-center justify-center border-dashed p-8 text-center">
            <SearchX className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">{emptyLabel}</h3>
          </Card>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/20 border-t border-b border-border/50">
                  <TableRow className="border-none">
                    <TableHead className="h-9 px-4 font-semibold text-muted-foreground uppercase tracking-wide text-xs">Nama</TableHead>
                    <TableHead className="h-9 px-4 font-semibold text-muted-foreground uppercase tracking-wide text-xs">Dibuat</TableHead>
                    <TableHead className="w-16 text-right h-9 px-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/50 border-b border-border/30 last:border-none">
                      <TableCell className="px-4 py-2 font-medium">{row.name}</TableCell>
                      <TableCell className="px-4 py-2 text-muted-foreground text-sm">
                        {row.createdAt ? formatDate(row.createdAt) : "-"}
                      </TableCell>
                      <TableCell className="text-right px-4 py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingItem(row); setDraftName(row.name); setDialogOpen(true); }}>
                              <Pencil className="mr-2 h-4 w-4" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(row)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <AppPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              limit={limit}
              onLimitChange={setLimit}
            />
          </>
        )}
      </CardContent>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingItem(null); setDraftName(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? `Edit ${entityLabel}` : `Tambah ${entityLabel}`}</DialogTitle>
            <DialogDescription>Kelola data master {entityLabel.toLowerCase()} untuk POS.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama</label>
            <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder={`Masukkan nama ${entityLabel.toLowerCase()}`} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isMutating}>Batal</Button>
            <Button onClick={handleSubmit} disabled={isMutating}>
              {isMutating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : editingItem ? "Simpan Perubahan" : "Buat Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <RelationAwareDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        itemName={deleteTarget?.name ?? ""}
        relationsUrl={deleteTarget ? `${relationsUrlPrefix}/${deleteTarget.id}/relations` : ""}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </Card>
  );
}

function MasterDataContent() {
  const categoriesQuery = useCategories({ params: {} });
  const unitsQuery = useUnits({ params: {} });

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();

  const categories = categoriesQuery.data?.data ?? [];
  const units = unitsQuery.data?.data ?? [];

  return (
    <>
      <header className="sticky top-6 mx-auto container z-10 flex flex-row px-4 sm:px-6 justify-between w-full items-center gap-4 pb-16">
        <div className="flex items-center gap-4">
          <div className="h-12 w-1.5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
          <div className="flex flex-col">
            <h1 className="text-3xl text-primary font-bold tracking-tight">Master Data</h1>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-80">
              Manajemen Data Dasar • Kategori & Unit
            </p>
          </div>
        </div>
      </header>

      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="relative overflow-hidden border-none shadow-md text-primary">
            <CardBg />
            <CardHeader className="pb-2 z-10"><CardTitle className="text-sm font-medium text-muted-foreground">Total Kategori</CardTitle></CardHeader>
            <CardContent className="z-10 text-2xl font-bold">{categories.length}</CardContent>
          </Card>
          <Card className="relative overflow-hidden border-none shadow-md text-primary">
            <CardBg />
            <CardHeader className="pb-2 z-10"><CardTitle className="text-sm font-medium text-muted-foreground">Total Satuan</CardTitle></CardHeader>
            <CardContent className="z-10 text-2xl font-bold">{units.length}</CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <EntitySection
            title="Kategori" description="Data kategori produk yang dipakai di katalog dan transaksi."
            entityLabel="Kategori" emptyLabel="Belum ada kategori"
            icon={<FolderTree className="h-5 w-5 text-primary" />}
            rows={categories} isLoading={categoriesQuery.isLoading} isError={categoriesQuery.isError}
            onRetry={() => void categoriesQuery.refetch()}
            onCreate={(name) => createCategory.mutateAsync({ name }).then(() => undefined)}
            onUpdate={(id, name) => updateCategory.mutateAsync({ id, name }).then(() => undefined)}
            onDelete={(id) => deleteCategory.mutateAsync(id).then(() => undefined)}
            isMutating={createCategory.isPending || updateCategory.isPending || deleteCategory.isPending}
            relationsUrlPrefix="/api/categories"
          />
          <EntitySection
            title="Satuan" description="Data satuan produk seperti pcs, box, liter, atau unit lain."
            entityLabel="Satuan" emptyLabel="Belum ada satuan"
            icon={<Package2 className="h-5 w-5 text-primary" />}
            rows={units} isLoading={unitsQuery.isLoading} isError={unitsQuery.isError}
            onRetry={() => void unitsQuery.refetch()}
            onCreate={(name) => createUnit.mutateAsync({ name }).then(() => undefined)}
            onUpdate={(id, name) => updateUnit.mutateAsync({ id, name }).then(() => undefined)}
            onDelete={(id) => deleteUnit.mutateAsync(id).then(() => undefined)}
            isMutating={createUnit.isPending || updateUnit.isPending || deleteUnit.isPending}
            relationsUrlPrefix="/api/units"
          />
        </div>
      </main>
    </>
  );
}

export default function MasterDataPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <RoleGuard allowedRoles={["admin sistem"]} fallback={<AccessDenied />}>
        <MasterDataContent />
      </RoleGuard>
    </Suspense>
  );
}
