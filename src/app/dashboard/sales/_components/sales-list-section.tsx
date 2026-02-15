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
import { LayoutGrid, Table2, Trash2, Eye } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";

import { useSaleList, useDeleteSale } from "@/hooks/sales/use-sale";
import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";
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
import { ApiResponse } from "@/services/productService";

export function SalesListSection() {
  const {
    sales,
    isLoading,
    meta,
    page,
    setPage,
    limit,
    setLimit,
    searchInput,
    setSearchInput,
  } = useSaleList();

  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const deleteMutation = useDeleteSale();

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Penjualan berhasil dibatalkan");
    } catch (error) {
      toast.error(
        (error as ApiResponse).error || "Gagal membatalkan penjualan",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 bg-background rounded-md">
        <SearchInput
          placeholder="Cari No. Invoice / Customer..."
          value={searchInput}
          onChange={setSearchInput}
        />

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

      {/* Content */}
      <div className="min-h-[300px]">
        {isLoading ? (
          <SalesLoading />
        ) : sales?.length === 0 ? (
          <SalesEmpty />
        ) : viewMode === "table" ? (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales?.map((sale, idx) => (
                  <TableRow key={sale.id}>
                    <TableCell>{(page - 1) * limit + idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      {sale.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      {formatDate(sale.createdAt || new Date())}
                    </TableCell>
                    <TableCell>{sale.customer?.name || "-"}</TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      {formatCurrency(Number(sale.totalPrice))}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          sale.status === "completed"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Batalkan Transaksi?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Tindakan ini akan membatalkan transaksi,
                                mengembalikan stok, dan membatalkan pencatatan
                                keuangan. Data tidak dapat dipulihkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(sale.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Batalkan Transaksi
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sales?.map((sale) => (
              <Card key={sale.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm">{sale.invoiceNumber}</h4>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(sale.createdAt || new Date())}
                    </p>
                  </div>
                  <Badge
                    variant={
                      sale.status === "completed" ? "default" : "destructive"
                    }
                  >
                    {sale.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {sale.customer?.name || "Umum"}
                  </span>
                  <span className="font-bold">
                    {formatCurrency(Number(sale.totalPrice))}
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Detail
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                      >
                        Batal
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogAction
                        onClick={() => handleDelete(sale.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Batalkan
                      </AlertDialogAction>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {meta && (
        <AppPagination
          currentPage={page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
        />
      )}
    </div>
  );
}

function SalesLoading() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function SalesEmpty() {
  return (
    <div className="p-12 text-center text-muted-foreground">
      Tidak ada data penjualan.
    </div>
  );
}
