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
import { Filter, LayoutGrid, Search, SearchX, Table2 } from "lucide-react";
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

  // Reset page when filters change
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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 bg-background">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari referensi, produk, atau SKU..."
            value={searchInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchInput(e.target.value);
            }}
            className="pl-10 h-10"
          />
        </div>

        <div className="flex justify-between gap-2 bg-background">
          {/* Mobile Filter */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 sm:hidden">
                <Filter className="mr-2 h-4 w-4" />
                Filter
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
              <Button variant="outline" className="h-10 hidden sm:flex">
                <Filter className="mr-2 h-4 w-4" />
                Filter Lanjutan
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
                <TableHead>Waktu</TableHead>
                <TableHead>Referensi</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Oleh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Memuat data...
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
                  <TableRow key={mutation.id}>
                    <TableCell>
                      {format(
                        new Date(mutation.createdAt),
                        "dd MMM yyyy HH:mm",
                        {
                          locale: id,
                        },
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {mutation.reference || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {mutation.product.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {mutation.product.sku} - {mutation.variant.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeColor(mutation.type) as any}>
                        {getTypeName(mutation.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {mutation.qty}
                    </TableCell>
                    <TableCell>{mutation.user?.name || "System"}</TableCell>
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
              <CardContent className="text-center py-8">
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mutations.map((mutation) => (
                <Card key={mutation.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {mutation.product.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {mutation.product.sku}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {mutation.variant.name}
                        </div>
                      </div>
                      <Badge
                        variant={getTypeColor(mutation.type) as any}
                        className="shrink-0"
                      >
                        {getTypeName(mutation.type)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Jumlah
                        </div>
                        <div className="font-medium">{mutation.qty}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Oleh
                        </div>
                        <div className="font-medium truncate">
                          {mutation.user?.name || "System"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Referensi</span>
                        <span className="font-mono">
                          {mutation.reference || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Waktu</span>
                        <span>
                          {format(
                            new Date(mutation.createdAt),
                            "dd MMM yyyy HH:mm",
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
                Terbawah <IconSortAscending className="h-4 w-4" />
              </SelectItem>
              <SelectItem value="desc">
                Teratas <IconSortDescending className="h-4 w-4" />
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
