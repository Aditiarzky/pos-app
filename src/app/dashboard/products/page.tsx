"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Edit, Trash, Plus } from "lucide-react";
import { useProducts } from "@/hooks/products/use-products";
import { useCreateProduct } from "@/hooks/products/use-create-product";
import { useUpdateProduct } from "@/hooks/products/use-update-product";
import { useDeleteProduct } from "@/hooks/products/use-delete-product";
import { useProduct } from "@/hooks/products/use-product";
import { PaginationControls } from "@/components/pagination-controls";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table"; // Jika pakai react-table untuk advance table

// Form input types dari validations (asumsi ada)
import {
  InsertProductInputType,
  UpdateProductInputType,
} from "@/lib/validations/product";

// Komponen utama halaman
export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [orderBy, setOrderBy] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Query daftar produk
  const { data: productsData, isLoading: isProductsLoading } = useProducts({
    params: { search, orderBy, order, page, limit, ...filters },
  });

  // Query single product untuk edit atau detail
  const { data: selectedProduct } = useProduct(selectedProductId ?? 0, {
    enabled: !!selectedProductId,
  });

  // Mutations
  const createMutation = useCreateProduct({
    mutationConfig: {
      onSuccess: () => {
        toast.success("Produk berhasil ditambahkan");
        setIsAddDialogOpen(false);
      },
      onError: () => toast.error("Gagal menambahkan produk"),
    },
  });

  const updateMutation = useUpdateProduct({
    mutationConfig: {
      onSuccess: () => {
        toast.success("Produk berhasil diupdate");
        setIsEditDialogOpen(false);
      },
      onError: () => toast.error("Gagal mengupdate produk"),
    },
  });

  const deleteMutation = useDeleteProduct({
    mutationConfig: {
      onSuccess: () => toast.success("Produk berhasil dihapus"),
      onError: () => toast.error("Gagal menghapus produk"),
    },
  });

  // Handler tambah produk
  const handleCreate = (data: InsertProductInputType) => {
    createMutation.mutate(data);
  };

  // Handler update
  const handleUpdate = (id: number, data: UpdateProductInputType) => {
    updateMutation.mutate({ id, ...data });
  };

  // Handler delete
  const handleDelete = (id: number) => {
    if (confirm("Yakin hapus produk ini?")) {
      deleteMutation.mutate(id);
    }
  };

  // Handler filter
  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  // Handler sorting
  const handleSort = (field: string) => {
    if (orderBy === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(field);
      setOrder("asc");
    }
  };

  // Handler pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manajemen Produk</h1>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="list">Daftar Produk</TabsTrigger>
          <TabsTrigger value="mutations">Mutasi Stok</TabsTrigger>
          <TabsTrigger value="low-stock">Stok Minimum</TabsTrigger>
        </TabsList>

        {/* Tab Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Produk</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {productsData?.meta?.total || 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Stok Rendah</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {/* Hitung dari data atau query terpisah */}
                  {productsData?.data?.filter(
                    (p) => Number(p.stock) < Number(p.minStock),
                  ).length || 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Stok</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {/* Sum stok */}
                  {productsData?.data?.reduce(
                    (acc, p) => acc + Number(p.stock),
                    0,
                  ) || 0}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Daftar Produk */}
        <TabsContent value="list" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Produk
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Produk Baru</DialogTitle>
                </DialogHeader>
                {/* Form tambah produk, gunakan form library seperti react-hook-form */}
                {/* Contoh sederhana */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    // Ambil data form dan call handleCreate
                  }}
                >
                  {/* Input fields: name, sku, categoryId, dll. */}
                  <Button type="submit" disabled={createMutation.isPending}>
                    Simpan
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filter per field */}
          <div className="flex gap-4">
            <Select onValueChange={(v) => handleFilterChange("category", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Kategori" />
              </SelectTrigger>
              <SelectContent>
                {/* Daftar kategori dari query terpisah */}
                <SelectItem value="all">Semua</SelectItem>
              </SelectContent>
            </Select>
            {/* Filter lain: unit, dll. */}
          </div>

          {/* Table dengan Accordion */}
          {isProductsLoading ? (
            <p>Loading...</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {productsData?.data?.map((product) => (
                <AccordionItem key={product.id} value={product.id.toString()}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span>
                        {product.name} ({product.sku})
                      </span>
                      <Badge
                        variant={
                          Number(product.stock) < Number(product.minStock)
                            ? "destructive"
                            : "default"
                        }
                      >
                        Stok: {product.stock}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Variant</TableHead>
                          <TableHead>Harga</TableHead>
                          <TableHead>Konversi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {product.variants?.map((variant) => (
                          <TableRow key={variant.id}>
                            <TableCell>{variant.name}</TableCell>
                            <TableCell>{variant.sellPrice}</TableCell>
                            <TableCell>{variant.conversionToBase}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProductId(product.id);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash className="mr-2 h-4 w-4" /> Hapus
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {/* Pagination */}
          <PaginationControls
            currentPage={page}
            totalPages={productsData?.meta?.totalPages || 1}
            onPageChange={handlePageChange}
          />

          {/* Dialog Edit */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Produk</DialogTitle>
              </DialogHeader>
              {/* Form edit mirip tambah, prefill dengan selectedProduct */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // Call handleUpdate(selectedProductId, data)
                }}
              >
                <Button type="submit" disabled={updateMutation.isPending}>
                  Update
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tab Mutasi Stok */}
        <TabsContent value="mutations" className="space-y-4">
          {/* Table mutasi stok dari stockMutations */}
          {/* Query terpisah untuk stock mutations */}
          <Table>{/* Headers: Tipe, Qty, Ref, Tanggal, User */}</Table>
        </TabsContent>

        {/* Tab Stok Minimum */}
        <TabsContent value="low-stock" className="space-y-4">
          <div className="space-y-2">
            {productsData?.data
              ?.filter((p) => Number(p.stock) < Number(p.minStock))
              .map((p) => (
                <Card key={p.id} className="p-4 flex items-center gap-4">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Stok: {p.stock} kurang dari {p.minStock}
                    </p>
                  </div>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
