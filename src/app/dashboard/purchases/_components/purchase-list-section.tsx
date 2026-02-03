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
import { LayoutList, SearchX, LayoutGrid, Table2 } from "lucide-react";
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

export function PurchaseListSection({
  onEdit,
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

  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 bg-background rounded-md">
        <SearchInput
          placeholder="Cari No. Invoice atau Supplier..."
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

          <div className="flex gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("table")}
              className={`h-10 w-10 sm:flex ${viewMode === "table" ? "bg-primary/10 text-primary border border-border hover:bg-primary/50" : "hover:bg-primary/50"}`}
              title="Tampilan Tabel"
            >
              <Table2 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("card")}
              className={`h-10 w-10 sm:flex ${viewMode === "card" ? "bg-primary/10 text-primary border border-border hover:bg-primary/50" : "hover:bg-primary/50"}`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
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
            <div className="rounded-md border hidden md:block">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-bold">No.</TableHead>
                    <TableHead className="font-bold">No. Invoice</TableHead>
                    <TableHead className="font-bold text-center">
                      Tanggal
                    </TableHead>
                    <TableHead className="font-bold">Supplier</TableHead>
                    <TableHead className="font-bold">Items</TableHead>
                    <TableHead className="text-right font-bold">
                      Total Amount
                    </TableHead>
                    <TableHead className="font-bold">Dicatat Oleh</TableHead>
                    <TableHead className="text-right font-bold w-20">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="h-48 sm:h-64 animate-pulse" />
              ))}
            </div>
          )
        ) : purchases.length === 0 ? (
          viewMode === "table" ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-bold">No.</TableHead>
                    <TableHead className="font-bold">No. Invoice</TableHead>
                    <TableHead className="font-bold text-center">
                      Tanggal
                    </TableHead>
                    <TableHead className="font-bold">Supplier</TableHead>
                    <TableHead className="font-bold">Items</TableHead>
                    <TableHead className="text-right font-bold">
                      Total Amount
                    </TableHead>
                    <TableHead className="font-bold">Dicatat Oleh</TableHead>
                    <TableHead className="text-right font-bold w-20">
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
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-bold">No.</TableHead>
                      <TableHead className="font-bold">No. Invoice</TableHead>
                      <TableHead className="font-bold text-center">
                        Tanggal
                      </TableHead>
                      <TableHead className="font-bold">Supplier</TableHead>
                      <TableHead className="font-bold">Items</TableHead>
                      <TableHead className="text-right font-bold">
                        Total Amount
                      </TableHead>
                      <TableHead className="font-bold">Dicatat Oleh</TableHead>
                      <TableHead className="text-right font-bold w-20">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase, idx) => (
                      <PurchaseRow
                        key={purchase.id}
                        purchase={purchase}
                        onEdit={onEdit}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {purchases.map((purchase) => (
              <PurchaseCard
                key={purchase.id}
                purchase={purchase}
                onEdit={onEdit}
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
      <TableCell colSpan={6} className="h-64">
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
