"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter } from "lucide-react";

import { useProducts } from "@/hooks/products/use-products";
// import { ProductCard } from "./product-card";
// import { StockMutationsSection } from "./stock-mutations-section";
// import { LowStockList } from "./low-stock-list";
import { AppPagination } from "@/components/app-pagination";
import { ProductCard } from "./_components/product-card";
import { ProductFormModal } from "./_components/product-form/product-form-modal";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "normal">(
    "all",
  );
  const [page, setPage] = useState(1);
  const limit = 12;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(
    null,
  );

  const { data, isLoading } = useProducts({
    params: {
      search,
      page,
      limit,
      categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
      unitId: unitFilter !== "all" ? unitFilter : undefined,
      lowStockOnly: stockFilter === "low" ? true : undefined,
    },
  });

  const products = data?.data || [];
  const analytics = data?.analytics;
  const meta = data?.meta;
  const allSku = data?.allSku;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produk</h1>
          <p className="text-muted-foreground">
            Kelola produk, stok, dan variant
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Produk
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analytics?.totalProducts ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Stok</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analytics?.totalStock ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">
              Stok Rendah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {analytics?.underMinimumStock ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Daftar Produk</TabsTrigger>
          <TabsTrigger value="mutations">Mutasi Stok</TabsTrigger>
          <TabsTrigger value="low-stock">Stok Minimum</TabsTrigger>
        </TabsList>

        {/* DAFTAR PRODUK */}
        <TabsContent value="list" className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama produk atau SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {/* Isi dari query categories */}
              </SelectContent>
            </Select>

            <Select
              value={stockFilter}
              onValueChange={(v) => setStockFilter(v as any)}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Stok" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Stok</SelectItem>
                <SelectItem value="low">Stok Rendah</SelectItem>
                <SelectItem value="normal">Stok Normal</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="sm:hidden">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Grid Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="h-64 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={() => setEditingProductId(product.id)}
                  onDelete={() => setDeletingProductId(product.id)}
                />
              ))}
            </div>
          )}

          {meta && (
            <AppPagination
              currentPage={page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          )}
        </TabsContent>

        {/* MUTASI STOK */}
        <TabsContent value="mutations">
          {/* <StockMutationsSection /> */}
        </TabsContent>

        {/* STOK MINIMUM */}
        <TabsContent value="low-stock">
          {/* <LowStockList products={products} /> */}
        </TabsContent>
      </Tabs>

      {/* MODALS */}
      <ProductFormModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        mode="create"
        allSku={allSku}
      />

      <ProductFormModal
        open={!!editingProductId}
        onOpenChange={(open: boolean) => !open && setEditingProductId(null)}
        mode="edit"
        productId={editingProductId}
        allSku={allSku}
      />
    </div>
  );
}
