"use client";

import { useState, useEffect } from "react";
import { useStockMutations } from "@/hooks/products/use-stock-mutations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AppPagination } from "@/components/app-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Filter,
  LayoutGrid,
  Loader2,
  Search,
  SearchX,
  Table2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDebounce } from "@/hooks/use-debounce";
import { IconSortAscending, IconSortDescending } from "@tabler/icons-react";
import { SearchInput } from "@/components/ui/search-input";

type ViewMode = "table" | "card";

export function StockMutationsSection() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  const [typeFilter, setTypeFilter] = useState("all");
  const [orderBy, setOrderBy] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [limit, setLimit] = useState(12);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, orderBy, order]);

  const { data, isLoading } = useStockMutations({
    params: {
      page,
      limit,
      search: debouncedSearch,
      type: typeFilter !== "all" ? typeFilter : undefined,
      orderBy,
      order,
    },
  });

  const mutations = data?.data || [];
  const meta = data?.meta;

  const hasActiveFilters =
    typeFilter !== "all" || orderBy !== "createdAt" || order !== "desc";

  const getTypeColor = (type: string) => {
    switch (type) {
      case "purchase":
      case "return_restock":
      case "adjustment":
        return "default";
      case "sale":
      case "waste":
      case "supplier_return":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "purchase":
        return "Pembelian";
      case "sale":
        return "Penjualan";
      case "return_restock":
        return "Retur (Restock)";
      case "waste":
        return "Terbuang/Rusak";
      case "supplier_return":
        return "Retur ke Supplier";
      case "adjustment":
        return "Penyesuaian";
      case "exchange":
        return "Pertukaran";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 bg-background rounded-md">
        <div className="relative flex-1">
          <SearchInput
            placeholder="Cari referensi, produk, atau SKU..."
            value={searchInput}
            onChange={setSearchInput}
          />
        </div>

        <div className="flex justify-between gap-2">
          {/* Mobile Filter */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 sm:hidden relative">
                <Filter className="mr-2 h-4 w-4" />
                Filter
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="px-4 py-6 sm:hidden rounded-t-[20px]"
            >
              <SheetHeader className="mb-4">
                <SheetTitle>Filter Mutasi</SheetTitle>
              </SheetHeader>
              <MutationFilterForm
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                orderBy={orderBy}
                setOrderBy={setOrderBy}
                order={order}
                setOrder={setOrder}
                setPage={setPage}
              />
            </SheetContent>
          </Sheet>

          {/* Desktop Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 hidden sm:flex relative"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter Lanjutan
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-4" align="end">
              <MutationFilterForm
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                orderBy={orderBy}
                setOrderBy={setOrderBy}
                order={order}
                setOrder={setOrder}
                setPage={setPage}
                isDropdown
              />
            </DropdownMenuContent>
          </DropdownMenu>

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
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="rounded-md border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4">
                  Waktu
                </TableHead>
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4">
                  Referensi
                </TableHead>
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4">
                  Produk
                </TableHead>
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4">
                  Tipe
                </TableHead>
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 text-right">
                  Jumlah
                </TableHead>
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4">
                  Oleh
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <span className="flex items-center justify-center w-full">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memuat data...
                    </span>
                  </TableCell>
                </TableRow>
              ) : mutations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <SearchX className="h-8 w-8 mb-2 opacity-20" />
                      <p>Tidak ada data mutasi stok</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                mutations.map((mutation) => (
                  <TableRow
                    key={mutation.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="text-[12px] sm:text-sm px-2 sm:px-4 py-2">
                      <div className="flex flex-col">
                        <span className="sm:hidden text-[9px] text-muted-foreground">
                          {format(new Date(mutation.createdAt), "dd/MM/yy", {
                            locale: id,
                          })}
                        </span>
                        <span>
                          {format(new Date(mutation.createdAt), "HH:mm", {
                            locale: id,
                          })}
                        </span>
                        <span className="hidden sm:block">
                          {format(new Date(mutation.createdAt), "dd MMM yyyy", {
                            locale: id,
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[9px] sm:text-xs px-2 sm:px-4 py-2">
                      {mutation.reference || "-"}
                    </TableCell>
                    <TableCell className="px-2 sm:px-4 py-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-[12px] sm:text-sm leading-tight">
                          {mutation.product.name}
                        </span>
                        <span className="text-[9px] sm:text-xs text-muted-foreground whitespace-nowrap">
                          {mutation.variant.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 sm:px-4 py-2">
                      <Badge
                        variant={getTypeColor(mutation.type) as any}
                        className="text-[8px] sm:text-[12px] px-1 py-0 h-4 sm:h-5 sm:px-2"
                      >
                        {getTypeName(mutation.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-black text-primary text-[12px] sm:text-sm px-2 sm:px-4 py-2">
                      {mutation.qty}
                    </TableCell>
                    <TableCell className="text-[12px] sm:text-sm px-2 sm:px-4 py-2">
                      {mutation.user?.name?.split(" ")[0] || "System"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center w-full py-8">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Memuat data...
              </CardContent>
            </Card>
          ) : mutations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                Tidak ada data mutasi stok
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {mutations.map((mutation) => (
                <Card
                  key={mutation.id}
                  className="overflow-hidden border-muted/50"
                >
                  <CardContent className="p-2.5 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-start gap-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[12px] sm:text-sm truncate leading-tight">
                          {mutation.product.name}
                        </div>
                        <div className="text-[9px] sm:text-xs text-muted-foreground font-mono truncate">
                          {mutation.product.sku}
                        </div>
                        <div className="text-[9px] sm:text-xs text-muted-foreground italic truncate">
                          {mutation.variant.name}
                        </div>
                      </div>
                      <Badge
                        variant={getTypeColor(mutation.type) as any}
                        className="shrink-0 text-[8px] sm:text-[12px] px-1 py-0 h-4 sm:h-5 sm:px-2 sm:py-0.5"
                      >
                        {getTypeName(mutation.type)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[12px] sm:text-sm">
                      <div>
                        <div className="text-[8px] sm:text-xs text-muted-foreground uppercase font-bold tracking-tighter">
                          Jumlah
                        </div>
                        <div className="font-black text-primary">
                          {mutation.qty}
                        </div>
                      </div>
                      <div>
                        <div className="text-[8px] sm:text-xs text-muted-foreground uppercase font-bold tracking-tighter">
                          Oleh
                        </div>
                        <div className="font-medium truncate">
                          {mutation.user?.name || "System"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1.5 sm:pt-2 border-t border-muted/50">
                      <div className="flex justify-between items-center text-[9px] sm:text-xs">
                        <span className="text-muted-foreground">Referensi</span>
                        <span className="font-mono truncate max-w-[60%] text-right transition-all hover:max-w-none">
                          {mutation.reference || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] sm:text-xs">
                        <span className="text-muted-foreground shrink-0 underline underline-offset-2 decoration-muted-foreground/20">
                          Waktu
                        </span>
                        <span className="truncate text-right ml-1">
                          {format(
                            new Date(mutation.createdAt),
                            "dd/MM/yy HH:mm",
                            {
                              locale: id,
                            },
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {meta && (
        <div className="pt-4">
          <AppPagination
            currentPage={page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
}

interface MutationFilterFormProps {
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  orderBy: string;
  setOrderBy: (v: string) => void;
  order: string;
  setOrder: (v: any) => void;
  setPage: (p: number) => void;
  isDropdown?: boolean;
}

function MutationFilterForm({
  typeFilter,
  setTypeFilter,
  orderBy,
  setOrderBy,
  order,
  setOrder,
  setPage,
  isDropdown,
}: MutationFilterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium leading-none text-xs text-muted-foreground uppercase tracking-wider">
          Tipe Mutasi
        </h4>
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full h-10 px-3 bg-muted/50 border-none shadow-none">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="purchase">Pembelian</SelectItem>
            <SelectItem value="sale">Penjualan</SelectItem>
            <SelectItem value="adjustment">Penyesuaian</SelectItem>
            <SelectItem value="waste">Terbuang/Rusak</SelectItem>
            <SelectItem value="return_restock">Retur (Restock)</SelectItem>
            <SelectItem value="supplier_return">Retur ke Supplier</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium leading-none text-xs text-muted-foreground uppercase tracking-wider">
          Urutkan
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={orderBy}
            onValueChange={(v) => {
              setOrderBy(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 px-3 bg-muted/50 border-none shadow-none">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Tanggal</SelectItem>
              <SelectItem value="name">Nama Produk</SelectItem>
              <SelectItem value="qty">Jumlah</SelectItem>
              <SelectItem value="reference">Referensi</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={order}
            onValueChange={(v: any) => {
              setOrder(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 px-3 bg-muted/50 border-none shadow-none">
              <SelectValue placeholder="A-Z" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">
                Ascending <IconSortAscending className="h-4 w-4" />
              </SelectItem>
              <SelectItem value="desc">
                Descending <IconSortDescending className="h-4 w-4" />
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isDropdown && <DropdownMenuSeparator />}
      <Button
        variant="ghost"
        className="w-full h-10 text-xs font-semibold text-muted-foreground"
        onClick={() => {
          setTypeFilter("all");
          setOrderBy("createdAt");
          setOrder("desc");
          setPage(1);
        }}
      >
        Reset Filter
      </Button>
    </div>
  );
}
