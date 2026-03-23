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
import {
  LayoutGrid,
  Table2,
  Trash2,
  Eye,
  PrinterIcon,
  ListIcon,
} from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";

import {
  useCustomerReturnList,
  useDeleteCustomerReturn,
} from "@/hooks/customer-returns/use-customer-return";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ApiResponse } from "@/services/productService";
import { usePrintReceipt } from "../../_hooks/use-print-receipt";
import { ReturnReceipt } from "../_ui/return-receipt";
import { CustomerReturnResponse } from "@/services/customerReturnService";
import { ReturnResult } from "../../_hooks/use-return-form";
import { Separator } from "@/components/ui/separator";
import { FilterWrap } from "@/components/filter-wrap";
import { ReturnFilterForm } from "../_ui/return-filter-form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function ReturnListSection() {
  const {
    customerReturns,
    isLoading,
    meta,
    page,
    setPage,
    limit,
    setLimit,
    searchInput,
    setSearchInput,
    dateRange,
    setDateRange,
    compensationType,
    setCompensationType,
    customerId,
    setCustomerId,
    hasActiveFilters,
    resetFilters,
  } = useCustomerReturnList();

  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [selectedReturn, setSelectedReturn] =
    useState<CustomerReturnResponse | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const { receiptRef, handlePrint } = usePrintReceipt();

  const deleteMutation = useDeleteCustomerReturn();

  const handleDelete = async (id: number) => {
    const deletePromise = deleteMutation.mutateAsync(id);

    toast.promise(deletePromise, {
      loading: "Membatalkan retur...",
      success: "Retur berhasil dibatalkan",
      error: (err: ApiResponse) => err.error || "Gagal membatalkan retur",
    });
  };

  const openReceipt = (ret: CustomerReturnResponse) => {
    setSelectedReturn(ret);
    setIsReceiptOpen(true);
  };

  const getCompensationName = (type: string) => {
    return type.replace("_", " ").toUpperCase();
  };

  const totalExchangeValue = selectedReturn?.exchangeItems?.reduce(
    (acc, item) => acc + item.qty * (Number(item.priceAtExchange) || 0),
    0,
  );

  const returnDataResult = selectedReturn
    ? ({
      ...selectedReturn,
      customerName: selectedReturn.customer?.name || "",
      returnNumber: selectedReturn.returnNumber || "",
      netRefundAmount: Number(selectedReturn.totalRefund),
      message: "Nota Retur",
      saleData: selectedReturn.sales?.[0] || {},
      returnItems: (selectedReturn.items || []).map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product?.name || "Unknown",
        variantName: item.productVariant?.name || "Default",
        qty: Number(item.qty),
        priceAtReturn: Number(item.priceAtReturn),
        unitFactorAtReturn: Number(item.unitFactorAtReturn),
        returnedToStock: item.returnedToStock,
        reason: item.reason,
      })),
      exchangeItems: (selectedReturn.exchangeItems || []).map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product?.name || "Unknown",
        variantName: item.productVariant?.name || "Default",
        qty: Number(item.qty),
        sellPrice: Number(item.priceAtExchange),
      })),
      totalValueReturned: Number(selectedReturn.totalValueReturned),
      totalValueExchange: totalExchangeValue,
    } as unknown as ReturnResult)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 bg-background rounded-md">
        <div className="flex-1">
          <SearchInput
            placeholder="Cari No. Retur / No. Invoice..."
            value={searchInput}
            onChange={setSearchInput}
          />
        </div>

        <div className="flex gap-2">
          <FilterWrap hasActiveFilters={hasActiveFilters}>
            <ReturnFilterForm
              dateRange={dateRange}
              setDateRange={setDateRange}
              compensationType={compensationType}
              setCompensationType={setCompensationType}
              customerId={customerId}
              setCustomerId={setCustomerId}
              setPage={setPage}
              resetFilters={resetFilters}
              isDropdown
            />
          </FilterWrap>

          <Separator orientation="vertical" className="h-10 mx-1" />

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
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
          <ListIcon className="h-5 w-5" />
          Semua Retur
        </h3>
        <div className="text-sm font-medium">
          Total Retur: <span className="text-primary font-bold">{meta?.total || 0}</span>
        </div>
      </div>

      <div className="min-h-[300px]">
        {isLoading ? (
          <LoadingState />
        ) : customerReturns?.length === 0 ? (
          <EmptyState searchInput={searchInput} />
        ) : viewMode === "table" ? (
          <div className="overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/20 border-t border-b border-border/50">
                <TableRow className="border-none">
                  <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">No.</TableHead>
                  <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">No. Retur</TableHead>
                  <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Tanggal</TableHead>
                  <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Customer</TableHead>
                  <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Items</TableHead>
                  <TableHead className="text-center text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Tipe</TableHead>
                  <TableHead className="text-right text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Total Refund</TableHead>
                  <TableHead className="text-right w-24 text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerReturns?.map((ret, idx) => {
                  const itemCount = ret.items?.length || 0;

                  return (
                    <TableRow key={ret.id} className="hover:bg-muted/50 transition-colors border-b border-border/30 last:border-none">
                      <TableCell className="text-[12px] sm:text-xs px-2 sm:px-4 py-2 font-semibold text-muted-foreground">{(page - 1) * limit + idx + 1}</TableCell>
                      <TableCell className="font-mono text-[12px] sm:text-sm px-2 sm:px-4 py-2 font-bold text-primary">{ret.returnNumber}</TableCell>
                      <TableCell className="text-[12px] sm:text-xs px-2 sm:px-4 py-2 font-semibold text-muted-foreground">{formatDate(ret.createdAt || new Date())}</TableCell>
                      <TableCell className="text-[12px] sm:text-sm px-2 sm:px-4 py-2 font-semibold">{ret.customer?.name || "-"}</TableCell>
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
                              <div className="font-semibold text-sm">Daftar Item Retur</div>
                              <div className="space-y-2 text-sm max-h-[240px] overflow-y-auto pr-1">
                                {ret.items?.slice(0, 3).map((item, itemIdx) => (
                                  <div
                                    key={`${ret.id}-${item.variantId}-${itemIdx}`}
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
                                      {item.qty ?? 0} x
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
                      <TableCell className="text-center px-2 sm:px-4 py-2">
                        <Badge variant="outline">
                          {getCompensationName(ret.compensationType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-[12px] sm:text-sm px-2 sm:px-4 py-2">
                        {formatCurrency(Number(ret.totalRefund))}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openReceipt(ret)}
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
                                <AlertDialogTitle>Batalkan Retur?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tindakan ini akan membatalkan retur,
                                  mengembalikan stok (rollback), dan membatalkan
                                  mutasi saldo. Data tidak dapat dipulihkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(ret.id!)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Batalkan Retur
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
            {customerReturns?.map((ret) => (
              <Card
                key={ret.id}
                className="group py-0 overflow-hidden gap-0 hover:shadow-lg transition-all duration-300 flex flex-col h-full border-muted/50"
              >
                <div className="relative h-20 sm:h-24 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 p-2.5 sm:p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <div className="font-mono font-bold text-primary text-xs sm:text-lg">
                        {ret.returnNumber}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                        {formatDate(ret.createdAt || new Date())}
                      </div>
                    </div>
                    <Badge variant="outline">{getCompensationName(ret.compensationType)}</Badge>
                  </div>
                </div>

                <div className="p-2.5 sm:p-4 flex-1 flex flex-col gap-2.5 sm:gap-4">
                  <div className="flex justify-between items-start border-b pb-4 border-dashed">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                        Total Refund
                      </span>
                      <div className="text-sm sm:text-2xl font-black text-primary tracking-tight">
                        {formatCurrency(Number(ret.totalRefund))}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                        Customer
                      </span>
                      <div className="font-semibold text-[10px] sm:text-sm max-w-[120px] truncate">
                        {ret.customer?.name || "Umum"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between text-[10px] sm:text-xs font-medium text-muted-foreground">
                      <span>Items Retur ({ret.items?.length || 0})</span>
                    </div>
                    <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                      {ret.items?.slice(0, 3).map((item, itemIdx) => (
                        <div
                          key={`${ret.id}-${item.variantId}-${itemIdx}`}
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
                      {(ret.items?.length || 0) > 3 && (
                        <div className="text-[10px] text-center text-muted-foreground italic pt-1">
                          + {(ret.items?.length || 0) - 3} item lainnya...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-2.5 sm:px-4 py-2 sm:py-3 border-t bg-muted/30 flex justify-between items-center gap-1.5 sm:gap-2 mt-auto">
                  <Button variant="outline" size="sm" onClick={() => openReceipt(ret)} className="h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs">
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
                        <AlertDialogTitle>Batalkan Retur?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini akan membatalkan retur, mengembalikan
                          stok (rollback), dan membatalkan mutasi saldo. Data
                          tidak dapat dipulihkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(ret.id!)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Batalkan Retur
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
        <DialogContent className="max-w-[340px] p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Nota Retur</DialogTitle>
          </DialogHeader>

          <div className="px-4 pb-4 overflow-y-auto flex-grow custom-scrollbar">
            {returnDataResult && <ReturnReceipt ref={receiptRef} result={returnDataResult} />}
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

function LoadingState() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

function EmptyState({ searchInput }: { searchInput?: string }) {
  return (
    <div className="p-12 text-center text-muted-foreground border border-dashed rounded-xl">
      {searchInput
        ? `Tidak ada data retur ditemukan untuk "${searchInput}"`
        : "Tidak ada data retur ditemukan."}
    </div>
  );
}
