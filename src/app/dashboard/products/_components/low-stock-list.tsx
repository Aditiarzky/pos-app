"use client";

import { useProducts } from "@/hooks/products/use-products";
import { ProductCard } from "./product-card";
import { Card } from "@/components/ui/card";
import { AppPagination } from "@/components/app-pagination";
import { useState } from "react";
import { StockAdjustmentModal } from "./stock-adjustment-modal";

export function LowStockList() {
  const [page, setPage] = useState(1);
  const limit = 12;
  const [adjustingProduct, setAdjustingProduct] = useState<any | null>(null);

  const { data, isLoading } = useProducts({
    params: {
      page,
      limit,
      lowStockOnly: true,
    },
  });

  const products = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-64 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Tidak ada produk dengan stok menipis.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdjust={(prod) => setAdjustingProduct(prod)}
              mode="low-stock"
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

      <StockAdjustmentModal
        open={!!adjustingProduct}
        onOpenChange={(open: boolean) => !open && setAdjustingProduct(null)}
        product={adjustingProduct}
      />
    </div>
  );
}
