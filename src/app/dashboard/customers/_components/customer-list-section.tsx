"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppPagination } from "@/components/app-pagination";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Table2, Trash2, Edit2, Eye } from "lucide-react";
import { useCustomers, useDeleteCustomer } from "@/hooks/master/use-customers";
import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { CustomerResponse } from "@/services/customerService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CustomerDetailSection } from "./customer-detail-section";

interface CustomerListSectionProps {
  searchInput: string;
  onEdit: (customer: CustomerResponse) => void;
}

export function CustomerListSection({
  searchInput,
  onEdit,
}: CustomerListSectionProps) {
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useCustomers({
    params: { page, limit, search: searchInput },
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const deleteMutation = useDeleteCustomer();

  const handleDelete = async (id: number) => {
    toast.promise(deleteMutation.mutateAsync(id), {
      loading: "Menghapus pelanggan...",
      success: "Pelanggan berhasil dihapus",
      error: "Gagal menghapus pelanggan",
    });
  };

  const openDetail = (id: number) => {
    setSelectedCustomerId(id);
    setIsDetailOpen(true);
  };

  const customers = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {meta?.total ? `${meta.total} pelanggan ditemukan` : ""}
        </p>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("table")}
          >
            <Table2 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("card")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <div className="rounded-2xl border overflow-hidden bg-card">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead className="hidden md:table-cell">Alamat</TableHead>
                <TableHead className="text-right">Hutang</TableHead>
                <TableHead className="w-32 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                    Tidak ada data pelanggan
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c: CustomerResponse, idx: number) => (
                  <TableRow key={c.id} className="hover:bg-muted/50">
                    <TableCell className="text-center font-mono text-xs">
                      {(page - 1) * limit + idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.phone || "-"}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-[220px] truncate">
                      {c.address || "-"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-rose-600 tabular-nums">
                      {formatCurrency(c.totalDebt || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openDetail(c.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => onEdit(c)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Pelanggan?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive"
                                onClick={() => handleDelete(c.id)}
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* CARD VIEW (Mobile Friendly) */}
      {viewMode === "card" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)
            : customers.map((c: CustomerResponse) => (
              <Card key={c.id} className="p-5 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-semibold text-lg leading-tight">{c.name}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{c.phone || "-"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Hutang</div>
                    <div className="font-bold text-rose-600 text-lg">
                      {formatCurrency(c.totalDebt || 0)}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground line-clamp-2 mb-5">
                  {c.address || "Alamat tidak diisi"}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openDetail(c.id)}>
                    <Eye className="mr-2 h-4 w-4" /> Detail
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(c)}>
                    <Edit2 className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="px-3">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogAction onClick={() => handleDelete(c.id)} className="bg-destructive">
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))}
        </div>
      )}

      {meta && (
        <AppPagination
          currentPage={page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
        />
      )}

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-[620px] p-0">
          <SheetHeader className="p-6 border-b">
            <SheetTitle>Detail Pelanggan</SheetTitle>
          </SheetHeader>
          <div className="p-6">
            {selectedCustomerId && <CustomerDetailSection customerId={selectedCustomerId} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
