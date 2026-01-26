"use client";

import { useState, useEffect } from "react";
import { Search, Filter, SearchX, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";

import { useProducts } from "@/hooks/products/use-products";
import { useCategories } from "@/hooks/master/use-categories";
import { useDeleteProduct } from "@/hooks/products/use-delete-product";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";

import { ProductCard } from "./product-card";
import { AppPagination } from "@/components/app-pagination";
import { formatCompactNumber } from "@/lib/format";
import { ProductResponse } from "@/services/productService";
import { IconSortAscending, IconSortDescending } from "@tabler/icons-react";

interface ProductListSectionProps {
  onEdit: (id: number) => void;
  onAdjust: (product: any) => void;
}

export function ProductListSection({
  onEdit,
  onAdjust,
}: ProductListSectionProps) {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "normal">(
    "all",
  );
  const [orderBy, setOrderBy] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);

  const [isPrinting, setIsPrinting] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Still need to reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryFilter, stockFilter, orderBy, order]);

  const deleteMutation = useDeleteProduct();
  const { data: categoriesResult } = useCategories();
  const categories = categoriesResult?.data ?? [];

  const handleDelete = async (id: number) => {
    if (!id) return;
    await deleteMutation.mutateAsync(id, {
      onSuccess: (data) => {
        toast.success(data?.message || "Produk berhasil dihapus");
      },
      onError: (error: any) => {
        toast.error(error.message || "Gagal menghapus produk");
      },
    });
  };

  // Query for Low Stock Section (Top)
  const { data: lowStockData } = useProducts({
    params: {
      limit: 4,
      lowStockOnly: true,
    },
  });

  // Query for All Products (Bottom)
  const { data: allProductsData, isLoading: isAllProductsLoading } =
    useProducts({
      params: {
        search: debouncedSearch,
        page,
        limit,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        lowStockOnly: stockFilter === "low" ? true : undefined,
        orderBy,
        order,
      },
    });

  // Fetches ALL products for printing when isPrinting is true
  const { data: printData, isFetching: isFetchingPrint } = useProducts({
    params: {
      search: debouncedSearch,
      categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
      lowStockOnly: stockFilter === "low" ? true : undefined,
      orderBy,
      order,
      limit: 9999, // Fetch all for printing
    },
    queryConfig: {
      enabled: isPrinting,
    },
  });

  useEffect(() => {
    if (isPrinting && !isFetchingPrint && printData?.data) {
      const style = document.createElement("style");
      style.innerHTML = "@page { size: A4; margin-top: 0; margin-bottom: 0; }";
      style.id = "dynamic-print-style";
      document.head.appendChild(style);
      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
        document.getElementById("dynamic-print-style")?.remove();
      }, 500);

      return () => {
        clearTimeout(timer);
        document.getElementById("dynamic-print-style")?.remove();
      };
    }
  }, [isPrinting, isFetchingPrint, printData]);

  const lowStockProducts = lowStockData?.data || [];
  const allProducts = allProductsData?.data || [];
  const analytics = allProductsData?.analytics;
  const meta = allProductsData?.meta;

  const hasActiveFilters =
    categoryFilter !== "all" ||
    stockFilter !== "all" ||
    orderBy !== "createdAt" ||
    order !== "desc";

  return (
    <div className="space-y-8">
      {/* Search & Advanced Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-background rounded-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama produk atau SKU..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
            }}
            className="pl-10 h-10"
          />
        </div>

        <div className="flex gap-2">
          {/* Mobile Filter Trigger */}
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
                <SheetTitle>Filter Lanjutan</SheetTitle>
              </SheetHeader>
              <FilterForm
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                categories={categories}
                stockFilter={stockFilter}
                setStockFilter={setStockFilter}
                orderBy={orderBy}
                setOrderBy={setOrderBy}
                order={order}
                setOrder={setOrder}
                setPage={setPage}
              />
            </SheetContent>
          </Sheet>

          {/* Desktop Filter Trigger */}
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
              <FilterForm
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                categories={categories}
                stockFilter={stockFilter}
                setStockFilter={setStockFilter}
                orderBy={orderBy}
                setOrderBy={setOrderBy}
                order={order}
                setOrder={setOrder}
                setPage={setPage}
                isDropdown
              />
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className="h-10"
            onClick={() => setIsPrinting(true)}
            disabled={isPrinting || isFetchingPrint}
          >
            <Printer className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Cetak Opname</span>
            <span className="sm:hidden">Cetak</span>
          </Button>
        </div>
      </div>

      {/* PERLU RESTOK SECTION */}
      {lowStockProducts.length > 0 &&
        !debouncedSearch &&
        categoryFilter === "all" &&
        stockFilter === "all" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-destructive flex items-center gap-2">
                Perlu restok
                <Badge
                  variant="destructive"
                  className="rounded-full px-2 py-0.5 text-[10px]"
                >
                  {analytics?.underMinimumStock || lowStockProducts.length}
                </Badge>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {lowStockProducts.map((product: any) => (
                <ProductCard
                  key={`low-${product.id}`}
                  product={product}
                  onEdit={() => onEdit(product.id)}
                  onDelete={() => handleDelete(product.id)}
                  onAdjust={(p) => onAdjust(p)}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Hanya menampilkan 4 produk terbaru.{" "}
              <button
                type="button"
                onClick={() => {
                  setStockFilter("low");
                  setPage(1);
                }}
                className="text-primary underline font-medium cursor-pointer"
              >
                Lihat Semua
              </button>
            </p>
            <Separator className="mt-8" />
          </section>
        )}

      {/* SEMUA PRODUK SECTION */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Semua produk</h2>
        {isAllProductsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="h-64 animate-pulse" />
            ))}
          </div>
        ) : allProducts.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 text-2xl">
              <SearchX />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              Tidak ada produk ditemukan
            </h3>
            <p className="text-sm max-w-xs mx-auto">
              Coba sesuaikan kata kunci pencarian atau filter Anda.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allProducts.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => onEdit(product.id)}
                onDelete={() => handleDelete(product.id)}
                onAdjust={(p) => onAdjust(p)}
              />
            ))}
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
      </section>

      {/* Hidden Printable Table for Stock Opname */}
      <div
        id="printable-stock-opname"
        className="hidden print:block p-8 text-black"
      >
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold uppercase">Laporan Stok Opname</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dicetak pada:{" "}
            {mounted ? new Date().toLocaleString("id-ID") : "Loading..."}
          </p>
        </div>

        <table className="w-full border-collapse border border-black text-black">
          <thead>
            <tr className="bg-muted/10">
              <th className="border border-black p-2 text-center w-10">No</th>
              <th className="border border-black p-2 text-left">
                Produk & SKU
              </th>
              <th className="border border-black p-2 text-left">Variant</th>
              <th className="border border-black p-2 text-center w-24">
                Stok Base Unit
              </th>
              <th className="border border-black p-2 text-center w-20">
                Satuan
              </th>
              <th className="border border-black p-2 text-center w-28">
                Stok Aktual
              </th>
              <th className="border border-black p-2 text-left">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {printData?.data?.flatMap(
              (product: ProductResponse, productIdx: number) => {
                if (product.variants && product.variants.length > 0) {
                  return product.variants.map(
                    (v: ProductResponse["variants"][number], vIdx: number) => (
                      <tr key={`${product.id}-${v.id}`}>
                        <td className="border border-black p-2 text-center">
                          {productIdx + 1}.{vIdx + 1}
                        </td>
                        <td className="border border-black p-2">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-[10px] text-black/80">
                            {product.sku}
                          </div>
                        </td>
                        <td className="border border-black p-2 font-mono text-xs">
                          {v.name}
                        </td>
                        <td className="border border-black p-2 text-center">
                          {formatCompactNumber(product?.stock || 0)}{" "}
                          {product?.unit?.name || ""}
                        </td>
                        <td className="border border-black p-2 text-center text-xs">
                          {v.unit?.name || "-"}
                        </td>
                        <td className="border border-black p-2"></td>
                        <td className="border border-black p-2"></td>
                      </tr>
                    ),
                  );
                }

                // Jika produk tidak punya variant
                return (
                  <tr key={product.id}>
                    <td className="border border-black p-2 text-center">
                      {productIdx + 1}
                    </td>
                    <td className="border border-black p-2">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-[10px] text-black/80">
                        {product.sku}
                      </div>
                    </td>
                    <td className="border border-black p-2 text-xs">-</td>
                    <td className="border border-black p-2 text-center">
                      {formatCompactNumber(product?.stock || 0)}{" "}
                      {product?.unit?.name || ""}
                    </td>
                    <td className="border border-black p-2 text-center text-xs">
                      {product?.variants?.[0]?.unit?.name || "-"}
                    </td>
                    <td className="border border-black p-2">-</td>
                    <td className="border border-black p-2">-</td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface FilterFormProps {
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  categories: any[];
  stockFilter: string;
  setStockFilter: (v: any) => void;
  orderBy: string;
  setOrderBy: (v: string) => void;
  order: string;
  setOrder: (v: any) => void;
  setPage: (p: number) => void;
  isDropdown?: boolean;
}

function FilterForm({
  categoryFilter,
  setCategoryFilter,
  categories,
  stockFilter,
  setStockFilter,
  orderBy,
  setOrderBy,
  order,
  setOrder,
  setPage,
  isDropdown,
}: FilterFormProps) {
  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium leading-none text-xs text-muted-foreground uppercase tracking-wider">
          Filter Kategori
        </h4>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full h-10 px-3 bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary/20">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium leading-none text-xs text-muted-foreground uppercase tracking-wider">
          Status Stok
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {["all", "low", "normal"].map((v) => (
            <Button
              key={v}
              variant={stockFilter === v ? "default" : "outline"}
              size="sm"
              className="h-9 capitalize text-xs shadow-none border-muted"
              onClick={() => {
                setStockFilter(v as any);
                setPage(1);
              }}
            >
              {v === "all" ? "Semua" : v === "low" ? "Rendah" : "Normal"}
            </Button>
          ))}
        </div>
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
            <SelectTrigger className="h-10 px-3 bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary/20">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Tanggal</SelectItem>
              <SelectItem value="name">Nama</SelectItem>
              <SelectItem value="stock">Stok</SelectItem>
              <SelectItem value="sku">SKU</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={order}
            onValueChange={(v: any) => {
              setOrder(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 px-3 bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary/20">
              <SelectValue placeholder="A-Z" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">
                Ascending <IconSortAscending className="h-4 w-4 ml-2 inline" />
              </SelectItem>
              <SelectItem value="desc">
                Descending{" "}
                <IconSortDescending className="h-4 w-4 ml-2 inline" />
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isDropdown && <DropdownMenuSeparator />}
      <Button
        variant="ghost"
        className="w-full h-10 text-xs font-semibold text-muted-foreground hover:text-foreground"
        onClick={() => {
          setCategoryFilter("all");
          setStockFilter("all");
          setOrderBy("createdAt");
          setOrder("desc");
          setPage(1);
        }}
      >
        Reset Filter
      </Button>
    </div>
  );

  return content;
}
