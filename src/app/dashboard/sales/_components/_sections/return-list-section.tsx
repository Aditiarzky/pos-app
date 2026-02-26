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
        saleData: selectedReturn.sales || {},
        returnItems: selectedReturn.items || [],
        exchangeItems: selectedReturn.exchangeItems || [],
        totalValueReturned: Number(selectedReturn.totalValueReturned),
        totalValueExchange: totalExchangeValue,
      } as unknown as ReturnResult)
    : null;

  console.log(returnDataResult);

  return (
    <div className="space-y-6">
      {/* Controls */}
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
          Total Retur:{" "}
          <span className="text-primary font-bold">{meta?.total || 0}</span>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {isLoading ? (
          <LoadingState />
        ) : customerReturns?.length === 0 ? (
          <EmptyState searchInput={searchInput} />
        ) : viewMode === "table" ? (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>No. Retur</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Tipe</TableHead>
                  <TableHead className="text-right">Total Refund</TableHead>
                  <TableHead className="text-right w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerReturns?.map((ret, idx) => (
                  <TableRow key={ret.id}>
                    <TableCell>{(page - 1) * limit + idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      {ret.returnNumber}
                    </TableCell>
                    <TableCell>
                      {formatDate(ret.createdAt || new Date())}
                    </TableCell>
                    <TableCell>{ret.customer?.name || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {getCompensationName(ret.compensationType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      {formatCurrency(Number(ret.totalRefund))}
                    </TableCell>
                    <TableCell>
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
                              <AlertDialogTitle>
                                Batalkan Retur?
                              </AlertDialogTitle>
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
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customerReturns?.map((ret) => (
              <Card
                key={ret.id}
                className="p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-base">
                      {ret.returnNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(ret.createdAt || new Date())}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {getCompensationName(ret.compensationType)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm mb-4">
                  <span className="text-muted-foreground">
                    {ret.customer?.name || "Umum"}
                  </span>
                  <span className="font-bold tabular-nums">
                    {formatCurrency(Number(ret.totalRefund))}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openReceipt(ret)}
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

      {/* Modal Nota Retur */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-[340px] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Nota Retur</DialogTitle>
          </DialogHeader>

          <div className="px-4 pb-4">
            {returnDataResult && (
              <ReturnReceipt ref={receiptRef} result={returnDataResult} />
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
