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
import { Trash2, Eye, PrinterIcon, ListIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSaleList, useDeleteSale } from "@/hooks/sales/use-sale";
import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { usePrintReceipt } from "../../_hooks/use-print-receipt";

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { ApiResponse } from "@/services/productService";
import { SaleResponse } from "../../_types/sale-type";
import { SaleReceipt } from "../_ui/sale-receipt";
import { Separator } from "@/components/ui/separator";
import { FilterWrap } from "@/components/filter-wrap";
import { SalesFilterForm } from "../_ui/sales-filter-form";

interface SalesListSectionProps {
  viewMode: "table" | "card";
  searchInput: string;
}

export function SalesListSection({
  viewMode,
  searchInput: externalSearch,
}: SalesListSectionProps) {
  const {
    sales,
    isLoading,
    meta,
    page,
    setPage,
    limit,
    setLimit,
    dateRange,
    setDateRange,
    status,
    setStatus,
    customerId,
    setCustomerId,
    hasActiveFilters,
    resetFilters,
    searchInput,
  } = useSaleList({ search: externalSearch });

  const [selectedSale, setSelectedSale] = useState<SaleResponse | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const { receiptRef, handlePrint } = usePrintReceipt();

  const deleteMutation = useDeleteSale();

  const handleDelete = async (id: number) => {
    const deletePromise = deleteMutation.mutateAsync(id);

    toast.promise(deletePromise, {
      loading: "Membatalkan penjualan...",
      success: "Penjualan berhasil dibatalkan",
      error: (err: ApiResponse) => err.error || "Gagal membatalkan penjualan",
    });
  };

  const openReceipt = (sale: SaleResponse) => {
    setSelectedSale(sale as SaleResponse);
    setIsReceiptOpen(true);
  };

  const getStatusName = (status: string | null) => {
    switch (status) {
      case "completed":
        return "Selesai";
      case "cancelled":
        return "Dibatalkan";
      case "debt":
        return "Hutang";
      default:
        return status || "-";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 bg-background rounded-md">
        <div className="flex-1">
          <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
            <ListIcon className="h-5 w-5" />
            Semua Penjualan
          </h3>
        </div>

        <div className="flex w-full justify-between sm:w-fit gap-2">
          <FilterWrap hasActiveFilters={hasActiveFilters}>
            <SalesFilterForm
              dateRange={dateRange}
              setDateRange={setDateRange}
              status={status}
              setStatus={setStatus}
              customerId={customerId}
              setCustomerId={setCustomerId}
              setPage={setPage}
              resetFilters={resetFilters}
              isDropdown
            />
          </FilterWrap>

          <Separator orientation="vertical" className="h-10 mx-1 block" />

          <div className="text-sm font-medium flex items-center bg-muted/30 px-3 rounded-lg border">
            Total:{" "}
            <span className="text-primary font-bold ml-1">
              {meta?.total || 0}
            </span>
          </div>
        </div>
      </div>

      <div className="min-h-[300px]">
        {isLoading ? (
          <SalesLoading />
        ) : sales?.length === 0 ? (
          <SalesEmpty searchInput={searchInput} />
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
                  <TableHead className="text-right w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales &&
                  sales.map((sale, idx) => (
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
                          {getStatusName(sale.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openReceipt(sale as SaleResponse)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10"
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
                                  Tindakan ini akan mengembalikan stok dan
                                  membatalkan pencatatan keuangan. Data tidak
                                  dapat dipulihkan.
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
          /* ==================== CARD VIEW (Mobile Friendly) ==================== */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sales &&
              sales.map((sale) => (
                <Card
                  key={sale.id}
                  className="p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-base">
                        {sale.invoiceNumber}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(sale.createdAt || new Date())}
                      </div>
                    </div>
                    <Badge
                      variant={
                        sale.status === "completed" ? "default" : "destructive"
                      }
                    >
                      {getStatusName(sale.status)}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center text-sm mb-4">
                    <span className="text-muted-foreground">
                      {sale.customer?.name || "Umum"}
                    </span>
                    <span className="font-bold tabular-nums">
                      {formatCurrency(Number(sale.totalPrice))}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReceipt(sale as SaleResponse)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Detail
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Batal
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Batalkan Transaksi?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini akan mengembalikan stok dan membatalkan
                            pencatatan keuangan. Data tidak dapat dipulihkan.
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

      {/* ==================== MODAL NOTA ==================== */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-[340px] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Nota Penjualan</DialogTitle>
          </DialogHeader>

          <div className="px-4 pb-4">
            {selectedSale && (
              <SaleReceipt ref={receiptRef} sale={selectedSale} />
            )}
          </div>

          <DialogFooter className="px-4 pb-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReceiptOpen(false)}
            >
              Tutup
            </Button>
            <Button size="sm" onClick={handlePrint}>
              <PrinterIcon className="w-4 h-auto" /> Cetak Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* Loading & Empty tetap sama */
function SalesLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

function SalesEmpty({ searchInput }: { searchInput?: string }) {
  return (
    <div className="p-12 text-center text-muted-foreground border border-dashed rounded-xl">
      {searchInput
        ? `Tidak ada data penjualan ditemukan untuk "${searchInput}"`
        : "Tidak ada data penjualan ditemukan."}
    </div>
  );
}
