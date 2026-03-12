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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
            Total: <span className="text-primary font-bold ml-1">{meta?.total || 0}</span>
          </div>
        </div>
      </div>

      <div className="min-h-[300px]">
        {isLoading ? (
          <SalesLoading />
        ) : sales?.length === 0 ? (
          <SalesEmpty searchInput={searchInput} />
        ) : viewMode === "table" ? (
          <div className="overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/20 border-t border-b border-border/50">
                <TableRow className="border-none">
                  <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">No.</TableHead>
                  <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">No. Invoice</TableHead>
                  <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Tanggal</TableHead>
                  <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Customer</TableHead>
                  <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Items</TableHead>
                  <TableHead className="text-right text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Total</TableHead>
                  <TableHead className="text-center text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Status</TableHead>
                  <TableHead className="text-right w-24 text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales &&
                  sales.map((sale, idx) => {
                    const itemCount = sale.items?.length || 0;

                    return (
                      <TableRow key={sale.id} className="hover:bg-muted/50 transition-colors border-b border-border/30 last:border-none">
                        <TableCell className="text-[12px] sm:text-xs px-2 sm:px-4 py-2 font-semibold text-muted-foreground">{(page - 1) * limit + idx + 1}</TableCell>
                        <TableCell className="font-mono text-[12px] sm:text-sm px-2 sm:px-4 py-2 font-bold text-primary">{sale.invoiceNumber}</TableCell>
                        <TableCell className="text-[12px] sm:text-xs px-2 sm:px-4 py-2 font-semibold text-muted-foreground">{formatDate(sale.createdAt || new Date())}</TableCell>
                        <TableCell className="text-[12px] sm:text-sm px-2 sm:px-4 py-2 font-semibold">{sale.customer?.name || "-"}</TableCell>
                        <TableCell className="px-2 sm:px-4 py-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                className="text-sm font-medium text-primary hover:bg-transparent hover:underline h-auto py-1 px-2 -ml-2"
                              >
                                {itemCount} item{itemCount !== 1 ? "s" : ""}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="start" sideOffset={4}>
                              <div className="space-y-3">
                                <div className="font-semibold text-sm">Daftar Item Penjualan</div>
                                <div className="space-y-2 text-sm max-h-[240px] overflow-y-auto pr-1">
                                  {sale.items?.slice(0, 3).map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex justify-between border-l-2 border-primary/20 pl-3 py-1"
                                    >
                                      <div className="flex-1">
                                        <span className="font-medium">
                                          {item.product?.name || "Unknown Product"}
                                        </span>
                                        <span className="text-muted-foreground ml-1">
                                          ({item.productVariant?.name || "-"})
                                        </span>
                                      </div>
                                      <div className="text-right whitespace-nowrap font-mono">
                                        {item.qty ?? 0} x {formatCurrency(Number(item.priceAtSale ?? 0))}
                                      </div>
                                    </div>
                                  ))}
                                  {itemCount > 3 && (
                                    <div className="text-xs text-muted-foreground pt-2 border-t italic">
                                      + {itemCount - 3} item lainnya...
                                    </div>
                                  )}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-[12px] sm:text-sm px-2 sm:px-4 py-2">
                          {formatCurrency(Number(sale.totalPrice))}
                        </TableCell>
                        <TableCell className="text-center px-2 sm:px-4 py-2">
                          <Badge
                            variant={
                              sale.status === "completed" ? "default" : "destructive"
                            }
                          >
                            {getStatusName(sale.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 sm:px-4 py-2">
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
                                  <AlertDialogTitle>Batalkan Transaksi?</AlertDialogTitle>
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
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            {sales &&
              sales.map((sale) => (
                <Card
                  key={sale.id}
                  className="group py-0 overflow-hidden gap-0 hover:shadow-lg transition-all duration-300 flex flex-col h-full border-muted/50"
                >
                  <div className="relative h-20 sm:h-24 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 p-2.5 sm:p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <div className="font-mono font-bold text-primary text-xs sm:text-lg">
                          {sale.invoiceNumber}
                        </div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                          {formatDate(sale.createdAt || new Date())}
                        </div>
                      </div>
                      <Badge
                        variant={sale.status === "completed" ? "default" : "destructive"}
                      >
                        {getStatusName(sale.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-4 flex-1 flex flex-col gap-2.5 sm:gap-4">
                    <div className="flex justify-between items-start border-b pb-4 border-dashed">
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                          Total Transaksi
                        </span>
                        <div className="text-sm sm:text-2xl font-black text-primary tracking-tight">
                          {formatCurrency(Number(sale.totalPrice))}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                          Customer
                        </span>
                        <div className="font-semibold text-[10px] sm:text-sm max-w-[120px] truncate">
                          {sale.customer?.name || "Umum"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs font-medium text-muted-foreground">
                        <span>Items ({sale.items?.length || 0})</span>
                      </div>
                      <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                        {sale.items?.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-xs items-center bg-muted/30 p-1.5 rounded-sm"
                          >
                            <div className="truncate flex-1 mr-2">
                              <span className="text-foreground font-medium">
                                {item.product?.name}
                              </span>
                              <span className="text-muted-foreground ml-1 text-[10px]">
                                ({item.productVariant?.name})
                              </span>
                            </div>
                            <div className="whitespace-nowrap font-mono text-[10px]">
                              {item.qty} x
                            </div>
                          </div>
                        ))}
                        {(sale.items?.length || 0) > 3 && (
                          <div className="text-[10px] text-center text-muted-foreground italic pt-1">
                            + {(sale.items?.length || 0) - 3} item lainnya...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-2.5 sm:px-4 py-2 sm:py-3 border-t bg-muted/30 flex justify-between items-center gap-1.5 sm:gap-2 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReceipt(sale as SaleResponse)}
                      className="h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs"
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      Detail
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Batalkan Transaksi?</AlertDialogTitle>
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

      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-[340px] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Nota Penjualan</DialogTitle>
          </DialogHeader>

          <div className="px-4 pb-4">
            {selectedSale && <SaleReceipt ref={receiptRef} sale={selectedSale} />}
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
