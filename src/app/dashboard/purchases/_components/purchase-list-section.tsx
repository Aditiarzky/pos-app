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
import { LayoutList, SearchX } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";

import { usePurchaseList } from "../_hooks/use-purchase-list";
import {
  PurchaseListSectionProps,
  PurchaseResponse,
} from "../_types/purchase-type";
import { PurchaseCard, PurchaseRow } from "./_ui/purchase-row";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { FilterWrap } from "@/components/filter-wrap";
import { PurchaseFilterForm } from "./_ui/purchase-filter-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ViewModeSwitch } from "@/components/ui/view-mode-switch";
import { useQueryState } from "@/hooks/use-query-state";
import { formatCurrency, formatDate } from "@/lib/format";

export function PurchaseListSection({
  // Optional props for direct injection
  purchases: injectedPurchases,
  isLoading: injectedIsLoading,
  meta: injectedMeta,
  page: injectedPage,
  setPage: injectedSetPage,
  limit: injectedLimit,
  setLimit: injectedSetLimit,
  searchInput: injectedSearchInput,
  setSearchInput: injectedSetSearchInput,
  orderBy: injectedOrderBy,
  setOrderBy: injectedSetOrderBy,
  order: injectedOrder,
  setOrder: injectedSetOrder,
  hasActiveFilters: injectedHasActiveFilters,
  resetFilters: injectedResetFilters,
  onDelete: injectedOnDelete,
}: PurchaseListSectionProps &
  Partial<ReturnType<typeof usePurchaseList>> & {
    onDelete?: (p: PurchaseResponse) => void;
  }) {
  const internalData = usePurchaseList();

  // Use injected props if available, otherwise use internal hook results
  const purchases = injectedPurchases ?? internalData.purchases;
  const isLoading = injectedIsLoading ?? internalData.isLoading;
  const meta = injectedMeta ?? internalData.meta;
  const page = injectedPage ?? internalData.page;
  const setPage = injectedSetPage ?? internalData.setPage;
  const limit = injectedLimit ?? internalData.limit;
  const setLimit = injectedSetLimit ?? internalData.setLimit;
  const searchInput = injectedSearchInput ?? internalData.searchInput;
  const setSearchInput = injectedSetSearchInput ?? internalData.setSearchInput;
  const orderBy = injectedOrderBy ?? internalData.orderBy;
  const setOrderBy = injectedSetOrderBy ?? internalData.setOrderBy;
  const order = injectedOrder ?? internalData.order;
  const setOrder = injectedSetOrder ?? internalData.setOrder;
  const hasActiveFilters =
    injectedHasActiveFilters ?? internalData.hasActiveFilters;
  const resetFilters = injectedResetFilters ?? internalData.resetFilters;
  const handleDelete = injectedOnDelete ?? internalData.handleDelete;

  const [viewMode, setViewMode] = useQueryState<"table" | "card">(
    "view",
    "table",
  );
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseResponse | null>(
    null,
  );
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const openReceipt = (purchase: PurchaseResponse) => {
    setSelectedPurchase(purchase);
    setIsReceiptOpen(true);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 bg-background rounded-md">
        <SearchInput
          placeholder="Cari No. Transaksi atau Supplier..."
          value={searchInput}
          onChange={setSearchInput}
        />

        <div className="flex gap-2">
          <FilterWrap hasActiveFilters={hasActiveFilters}>
            <PurchaseFilterForm
              orderBy={orderBy}
              setOrderBy={setOrderBy}
              order={order}
              setOrder={setOrder}
              setPage={setPage}
              resetFilters={resetFilters}
              isDropdown
            />
          </FilterWrap>

          <Separator orientation="vertical" className="h-10" />

          <ViewModeSwitch value={viewMode} onChange={setViewMode} />
          <Badge className="h-10 px-4 bg-primary/10 text-primary rounded-lg hidden md:flex items-center gap-2 font-medium">
            <LayoutList className="h-4 w-4" />
            Total {meta?.total || 0} Transaksi
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {isLoading ? (
          viewMode === "table" ? (
            <div className="overflow-hidden hidden md:block">
              <Table>
                <TableHeader className="bg-muted/20 border-t border-b border-border/50">
                  <TableRow className="border-none">
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">No.</TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">No. Transaksi</TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 text-center font-semibold text-muted-foreground uppercase tracking-wide">
                      Tanggal
                    </TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Supplier</TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Items</TableHead>
                    <TableHead className="text-right text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      Total Amount
                    </TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Dicatat Oleh</TableHead>
                    <TableHead className="text-right text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide w-20">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <LoadingRows count={5} />
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="h-48 sm:h-64 animate-pulse" />
              ))}
            </div>
          )
        ) : purchases.length === 0 ? (
          viewMode === "table" ? (
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/20 border-t border-b border-border/50">
                  <TableRow className="border-none">
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">No.</TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">No. Transaksi</TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 text-center font-semibold text-muted-foreground uppercase tracking-wide">
                      Tanggal
                    </TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Supplier</TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Items</TableHead>
                    <TableHead className="text-right text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                      Total Amount
                    </TableHead>
                    <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Dicatat Oleh</TableHead>
                    <TableHead className="text-right text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide w-20">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <EmptyState />
                </TableBody>
              </Table>
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed text-muted-foreground h-64">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 text-2xl">
                <SearchX />
              </div>
              <h3 className="text-lg font-medium text-foreground">
                Tidak ada riwayat pembelian ditemukan
              </h3>
              <p className="text-sm max-w-xs mx-auto">
                Coba sesuaikan kata kunci pencarian atau filter Anda.
              </p>
            </Card>
          )
        ) : viewMode === "table" ? (
          <>
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader className="bg-muted/20 border-t border-b border-border/50">
                    <TableRow className="border-none">
                      <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">No.</TableHead>
                      <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">No. Transaksi</TableHead>
                      <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 text-center font-semibold text-muted-foreground uppercase tracking-wide">
                        Tanggal
                      </TableHead>
                      <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Supplier</TableHead>
                      <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Items</TableHead>
                      <TableHead className="text-right text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                        Total Amount
                      </TableHead>
                      <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Dicatat Oleh</TableHead>
                      <TableHead className="text-right text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide w-20">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase, idx) => (
                      <PurchaseRow
                        key={purchase.id}
                        purchase={purchase}
                        onView={openReceipt}
                        onDelete={handleDelete}
                        idx={idx + 1}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
            {purchases.map((purchase) => (
              <PurchaseCard
                key={purchase.id}
                purchase={purchase}
                onView={openReceipt}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && (
        <div className="pt-2">
          <AppPagination
            currentPage={page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={setLimit}
          />
        </div>
      )}

      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-[640px] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 border-b">
            <DialogTitle>Detail Pembelian</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {selectedPurchase && (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">No. Transaksi</p>
                    <p className="font-semibold">{selectedPurchase.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tanggal</p>
                    <p className="font-semibold">
                      {selectedPurchase.createdAt
                        ? formatDate(selectedPurchase.createdAt)
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Supplier</p>
                    <p className="font-semibold">
                      {selectedPurchase.supplier?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dicatat Oleh</p>
                    <p className="font-semibold">
                      {selectedPurchase.user?.name || "-"}
                    </p>
                  </div>
                </div>

                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Varian</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Harga</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedPurchase.items || []).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product?.name || "-"}</TableCell>
                          <TableCell>{item.productVariant?.name || "-"}</TableCell>
                          <TableCell className="text-right">{item.qty}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(Number(item.price || 0))}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(Number(item.subtotal || 0))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Transaksi</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(Number(selectedPurchase.total || 0))}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoadingRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24 ml-auto" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-10 ml-auto" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// Empty State
function EmptyState() {
  return (
    <TableRow>
      <TableCell colSpan={8} className="h-64">
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 text-2xl">
            <SearchX />
          </div>
          <h3 className="text-lg font-medium text-foreground italic">
            Tidak ada riwayat pembelian ditemukan
          </h3>
          <p className="text-sm max-w-xs mx-auto">
            Coba sesuaikan kata kunci pencarian atau filter Anda.
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
}
