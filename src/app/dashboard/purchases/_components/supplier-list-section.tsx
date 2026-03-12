/**
 * COMPONENT: SupplierListSection
 * Menampilkan daftar suppliers dengan filter, search, dan pagination
 */

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AppPagination } from "@/components/app-pagination";
import { Button } from "@/components/ui/button";
import {
  Search,
  Edit,
  Trash2,
  Plus,
  LayoutList,
  LayoutGrid,
  Table2,
  MoreHorizontal,
  SearchX,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { useSupplierList } from "../_hooks/use-supplier-list";
import { SupplierListSectionProps, SupplierResponse } from "../_types/supplier";
import { FilterWrap } from "@/components/filter-wrap";
import { SupplierFilterForm } from "./_ui/supplier-filter-form";
import { Card } from "@/components/ui/card";
import { useState } from "react";

// ============================================
// MAIN COMPONENT
// ============================================

export function SupplierListSection({
  onEdit,
  onAddNew,
}: SupplierListSectionProps) {
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  const {
    // Data
    suppliers,
    isLoading,
    meta,

    // Pagination
    page,
    setPage,
    limit,
    setLimit,

    // Search
    searchInput,
    setSearchInput,

    // Sorting
    orderBy,
    setOrderBy,
    order,
    setOrder,

    // Filters
    hasActiveFilters,
    resetFilters,

    // Actions
    handleDelete,
  } = useSupplierList();

  return (
    <div className="space-y-4">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-3 bg-background rounded-md">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama supplier..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <div className="flex gap-2">
          <FilterWrap hasActiveFilters={hasActiveFilters}>
            <SupplierFilterForm
              orderBy={orderBy}
              setOrderBy={setOrderBy}
              order={order}
              setOrder={setOrder}
              setPage={setPage}
              resetFilters={resetFilters}
            />
          </FilterWrap>

          {/* Add Supplier Button */}
          <Button className="h-10" onClick={onAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Supplier
          </Button>

          <div className="h-10 w-[1px] bg-border mx-1 hidden sm:block" />
          <div className="flex gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("table")}
              className="h-10 w-10 sm:flex"
              title="Tampilan Tabel"
            >
              <Table2 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("card")}
              className="h-10 w-10 sm:flex"
              title="Tampilan Kartu"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          {/* Total Badge */}
          <Badge className="h-10 px-4 bg-primary/10 text-primary rounded-lg hidden md:flex items-center gap-2 font-medium">
            <LayoutList className="h-4 w-4" />
            Total {meta?.total || 0} Supplier
          </Badge>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/20 border-t border-b border-border/50">
              <TableRow className="border-none">
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">No. </TableHead>
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Nama Supplier</TableHead>
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Telepon</TableHead>
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Email</TableHead>
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Alamat</TableHead>
                <TableHead className="text-center text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                  Tanggal Dibuat
                </TableHead>
                <TableHead className="text-right w-20 text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <LoadingRows count={5} />
              ) : suppliers.length === 0 ? (
                <EmptyState />
              ) : (
                suppliers.map((supplier, idx) => (
                  <SupplierRow
                    key={supplier.id}
                    idx={idx + 1}
                    supplier={supplier}
                    onEdit={onEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] sm:h-[210px] rounded-2xl" />
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed text-muted-foreground min-h-[220px]">
          <SearchX className="h-8 w-8 mb-2 opacity-30" />
          Tidak ada supplier ditemukan
        </Card>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {suppliers.map((supplier) => (
            <Card
              key={supplier.id}
              className="group py-0 overflow-hidden gap-0 hover:shadow-lg transition-all duration-300 flex flex-col h-full border-muted/50"
            >
              <div className="relative h-20 sm:h-24 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 p-2.5 sm:p-4 flex flex-col justify-between">
                <div className="font-semibold text-xs sm:text-lg truncate text-primary">
                  {supplier.name}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">
                  {formatDate(supplier.createdAt || new Date())}
                </div>
              </div>

              <div className="p-2.5 sm:p-4 flex-1 space-y-2">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="truncate">{supplier.phone || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{supplier.email || "-"}</span>
                </div>
                <div className="flex items-start gap-2 text-[10px] sm:text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mt-0.5" />
                  <span className="line-clamp-2">{supplier.address || "-"}</span>
                </div>
              </div>

              <div className="px-2.5 sm:px-4 py-2 sm:py-3 border-t bg-muted/30 flex justify-between gap-1.5 sm:gap-2 mt-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs"
                  onClick={() => onEdit(supplier)}
                >
                  <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 sm:h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(supplier)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

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

// ============================================
// SUB-COMPONENTS
// ============================================

// Loading Skeleton Rows
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
          <TableCell>
            <Skeleton className="h-8 w-8 ml-auto" />
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
      <TableCell colSpan={7} className="h-64">
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 text-2xl">
            <SearchX />
          </div>
          <h3 className="text-lg font-medium text-foreground italic">
            Tidak ada supplier ditemukan
          </h3>
          <p className="text-sm max-w-xs mx-auto">
            Coba sesuaikan kata kunci pencarian atau filter Anda.
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
}

// Supplier Row
interface SupplierRowProps {
  supplier: SupplierResponse;
  onEdit: (supplier: SupplierResponse) => void;
  onDelete: (supplier: SupplierResponse) => Promise<void>;
  idx: number;
}

function SupplierRow({ supplier, onEdit, onDelete, idx }: SupplierRowProps) {
  return (
    <TableRow className="hover:bg-muted/30 transition-colors border-b border-border/30 last:border-none group">
      <TableCell className="text-[12px] sm:text-xs px-2 sm:px-4 py-2 font-semibold text-muted-foreground">{idx}</TableCell>
      <TableCell className="text-[12px] sm:text-sm px-2 sm:px-4 py-2 font-semibold text-primary">
        {supplier.name}
      </TableCell>
      <TableCell className="text-[12px] sm:text-sm px-2 sm:px-4 py-2">{supplier.phone || "-"}</TableCell>
      <TableCell className="text-[12px] sm:text-sm px-2 sm:px-4 py-2">{supplier.email || "-"}</TableCell>
      <TableCell className="px-2 sm:px-4 py-2">
        <div className="text-sm text-muted-foreground max-w-[150px] truncate">
          {supplier.address || "-"}
        </div>
      </TableCell>
      <TableCell className="text-center text-[12px] sm:text-sm px-2 sm:px-4 py-2">
        {formatDate(supplier.createdAt || new Date())}
      </TableCell>
      <TableCell className="text-right px-2 sm:px-4 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={() => onEdit(supplier)}
              className="gap-2 cursor-pointer"
            >
              <Edit className="h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(supplier)}
              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
            >
              <Trash2 className="h-4 w-4" /> Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
