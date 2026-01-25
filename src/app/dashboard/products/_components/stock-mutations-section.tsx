"use client";

import { useState } from "react";
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
import { LayoutGrid, Table2 } from "lucide-react";

type ViewMode = "table" | "card";

export function StockMutationsSection() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const limit = 10;

  const { data, isLoading } = useStockMutations({
    params: {
      page,
      limit,
      search,
      type: typeFilter !== "all" ? typeFilter : undefined,
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Input
            placeholder="Cari referensi, produk, atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tipe Mutasi" />
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

        <div className="flex gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("table")}
            title="Tampilan Tabel"
          >
            <Table2 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("card")}
            title="Tampilan Kartu"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
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
                  <TableCell colSpan={6} className="text-center py-8">
                    Tidak ada data mutasi stok
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
        <AppPagination
          currentPage={page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
