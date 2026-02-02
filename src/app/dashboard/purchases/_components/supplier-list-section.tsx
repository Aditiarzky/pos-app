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
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppPagination } from "@/components/app-pagination";
import { Button } from "@/components/ui/button";
import {
  Search,
  Edit,
  Trash2,
  Plus,
  Filter,
  LayoutList,
  MoreHorizontal,
  SearchX,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { IconSortAscending, IconSortDescending } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import { useSupplierList } from "../_hooks/use-supplier-list";
import {
  SupplierListSectionProps,
  SupplierResponse,
} from "../_types/supplier";

// ============================================
// MAIN COMPONENT
// ============================================

export function SupplierListSection({ onEdit, onAddNew }: SupplierListSectionProps) {
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

  // ============================================
  // RENDER
  // ============================================

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
          {/* Mobile Filter Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="h-10 sm:hidden relative border-dashed"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter
                {hasActiveFilters && <ActiveFilterIndicator />}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="px-4 py-6 sm:hidden rounded-t-[20px]"
            >
              <SheetHeader className="mb-4">
                <SheetTitle>Filter Lanjutan</SheetTitle>
              </SheetHeader>
              <FilterForm
                orderBy={orderBy}
                setOrderBy={setOrderBy}
                order={order}
                setOrder={setOrder}
                setPage={setPage}
                resetFilters={resetFilters}
              />
            </SheetContent>
          </Sheet>

          {/* Desktop Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 hidden sm:flex relative border-dashed"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter Lanjutan
                {hasActiveFilters && <ActiveFilterIndicator />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-4" align="end">
              <FilterForm
                orderBy={orderBy}
                setOrderBy={setOrderBy}
                order={order}
                setOrder={setOrder}
                setPage={setPage}
                resetFilters={resetFilters}
                isDropdown
              />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Supplier Button */}
          <Button
            className="h-10"
            onClick={onAddNew}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Supplier
          </Button>

          {/* Total Badge */}
          <Badge
            variant="secondary"
            className="h-10 px-4 rounded-lg hidden md:flex items-center gap-2 font-medium"
          >
            <LayoutList className="h-4 w-4" />
            Total {meta?.total || 0} Supplier
          </Badge>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-border/50 shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-bold">Nama Supplier</TableHead>
              <TableHead className="font-bold">Telepon</TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="font-bold">Alamat</TableHead>
              <TableHead className="font-bold text-center">Tanggal Dibuat</TableHead>
              <TableHead className="text-right font-bold w-20">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingRows count={5} />
            ) : suppliers.length === 0 ? (
              <EmptyState />
            ) : (
              suppliers.map((supplier) => (
                <SupplierRow
                  key={supplier.id}
                  supplier={supplier}
                  onEdit={onEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </Card>

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

// Active Filter Indicator
function ActiveFilterIndicator() {
  return (
    <span className="absolute -top-1 -right-1 flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
    </span>
  );
}

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
}

function SupplierRow({ supplier, onEdit, onDelete }: SupplierRowProps) {
  return (
    <TableRow className="hover:bg-muted/30 transition-colors group">
      <TableCell className="font-medium text-primary">
        {supplier.name}
      </TableCell>
      <TableCell>
        {supplier.phone || "-"}
      </TableCell>
      <TableCell>
        {supplier.email || "-"}
      </TableCell>
      <TableCell>
        <div className="text-sm text-muted-foreground max-w-[150px] truncate">
          {supplier.address || "-"}
        </div>
      </TableCell>
      <TableCell className="text-center">
        {formatDate(supplier.createdAt || new Date())}
      </TableCell>
      <TableCell className="text-right">
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

// Filter Form
interface FilterFormProps {
  orderBy: "createdAt" | "name" | "phone" | undefined;
  setOrderBy: (v: "createdAt" | "name" | "phone" | undefined) => void;
  order: "asc" | "desc";
  setOrder: (v: "asc" | "desc") => void;
  setPage: (p: number) => void;
  resetFilters: () => void;
  isDropdown?: boolean;
}

function FilterForm({
  orderBy,
  setOrderBy,
  order,
  setOrder,
  setPage,
  resetFilters,
  isDropdown,
}: FilterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium leading-none text-xs text-muted-foreground uppercase tracking-wider">
          Urutkan
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={orderBy}
            onValueChange={(v) => {
              setOrderBy(v as "createdAt" | "name" | "phone" | undefined);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 px-3 bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary/20 cursor-pointer">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Tanggal Dibuat</SelectItem>
              <SelectItem value="name">Nama</SelectItem>
              <SelectItem value="phone">Telepon</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={order}
            onValueChange={(v: "asc" | "desc") => {
              setOrder(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 px-3 bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary/20 cursor-pointer">
              <SelectValue placeholder="A-Z" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">
                Ascending{" "}
                <IconSortAscending className="h-4 w-4 ml-2 inline text-muted-foreground" />
              </SelectItem>
              <SelectItem value="desc">
                Descending{" "}
                <IconSortDescending className="h-4 w-4 ml-2 inline text-muted-foreground" />
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isDropdown && <DropdownMenuSeparator />}

      <Button
        variant="ghost"
        className="w-full h-10 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
        onClick={resetFilters}
      >
        Reset Filter
      </Button>
    </div>
  );
}