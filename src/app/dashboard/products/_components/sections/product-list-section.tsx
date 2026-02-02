"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SearchX, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { useProducts } from "@/hooks/products/use-products";
import { useCategories } from "@/hooks/master/use-categories";
import { useDeleteProduct } from "@/hooks/products/use-delete-product";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";

import { ProductCard } from "../product-card";
import { AppPagination } from "@/components/app-pagination";
import { ProductResponse } from "@/services/productService";
import { SearchInput } from "@/components/ui/search-input";
import { StockOpnamePrintTable } from "../stock-opname-print-table";
import { ProductFilterForm } from "../ui/product-filter-form";
import { FilterWrap } from "@/components/filter-wrap";

interface ProductListSectionProps {
  onEdit: (id: number) => void;
  onAdjust: (product: ProductResponse) => void;
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
      onError: (error) => {
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
      limit: 9999,
    },
    queryConfig: {
      enabled: isPrinting,
    },
  });

  useEffect(() => {
    if (isPrinting && !isFetchingPrint && printData?.data) {
      const style = document.createElement("style");
      style.id = "dynamic-print-style";
      style.innerHTML = `
      @page {
        size: A4 portrait;
        margin: 1.5cm;
      }

      @media print {
        body > * {
          display: none !important;
        }

        body > #stock-opname-print-area {
          display: block !important;
          visibility: visible !important;
          position: static !important;
          width: 100% !important;
          height: auto !important;
          background: white;
          overflow: visible !important;
        }

        #stock-opname-print-area * {
          visibility: visible !important;
        }
        
        .print-table {
          width: 100%;
          border-collapse: collapse;
          page-break-inside: auto;
        }

        .print-table thead {
          display: table-header-group;
          background: #f3f3f3;
        }

        .print-table tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .print-table td, .print-table th {
          border: 1px solid black;
          padding: 8px 6px;
          font-size: 11px;
          vertical-align: middle;
        }

        .print-table th {
          background: #f0f0f0;
          font-weight: 600;
        }

        /* Force page break after every 25-30 rows (adjust sesuai kebutuhan) */
        .print-table tr:nth-child(28n) {
          page-break-after: always;
        }
      }
    `;
      document.head.appendChild(style);

      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
        document.getElementById("dynamic-print-style")?.remove();
      }, 600);

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
          <SearchInput
            placeholder="Cari nama produk atau SKU..."
            value={searchInput}
            onChange={setSearchInput}
          />
        </div>

        <div className="flex gap-2">
          {/* Mobile Filter Trigger */}
          <FilterWrap hasActiveFilters={hasActiveFilters}>
            <ProductFilterForm
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
          </FilterWrap>

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
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
              {lowStockProducts.map((product: ProductResponse) => (
                <ProductCard
                  key={`low-${product.id}`}
                  product={product}
                  onEdit={() => onEdit(product.id)}
                  onDelete={() => handleDelete(product.id)}
                  onAdjust={(p) => onAdjust(p)}
                />
              ))}
            </div>
            {(analytics?.underMinimumStock ?? 0) > 4 && (
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
            )}{" "}
            <Separator className="mt-8" />
          </section>
        )}

      {/* SEMUA PRODUK SECTION */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Semua produk</h2>
        {isAllProductsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="h-48 sm:h-64 animate-pulse" />
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
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
            {allProducts.map((product: ProductResponse) => (
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

      {mounted &&
        isPrinting &&
        createPortal(
          <StockOpnamePrintTable
            data={printData?.data || []}
            searchTerm={debouncedSearch}
            printDate={new Date().toLocaleString("id-ID")}
          />,
          document.body,
        )}
    </div>
  );
}
