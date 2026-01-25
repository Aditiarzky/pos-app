"use client";

import { useState, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BadgeQuestionMark,
  Blocks,
  LayoutPanelTopIcon,
  PackageIcon,
  PanelTopOpen,
  Plus,
  Table,
} from "lucide-react";

import { useProducts } from "@/hooks/products/use-products";
import { ProductFormModal } from "./_components/product-form/product-form-modal";
import { StockMutationsSection } from "./_components/stock-mutations-section";
import { StockAdjustmentModal } from "./_components/stock-adjustment-modal";
import { ProductListSection } from "./_components/product-list-section";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQueryState } from "@/hooks/use-query-state";

function ProductsContent() {
  const [tab, setTab] = useQueryState<string>("tab", "list");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [adjustmentProduct, setAdjustmentProduct] = useState<any | null>(null);

  // Still need analytics for the top cards
  const { data: productsData } = useProducts({
    params: { limit: 1 },
  });
  const analytics = productsData?.analytics;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-row justify-between w-full items-center gap-4">
        <div className="overflow-hidden">
          <h1 className="text-3xl font-geist font-semibold truncate">Produk</h1>
          <p className="text-muted-foreground font-instrument text-xl tracking-tight truncate italic">
            Kelola produk, stok, dan variant
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="w-auto">
          <Plus className="m-0 sm:mr-2 sm:h-4 sm:w-4 w-5 h-5" />
          <p className="hidden sm:block">Tambah Produk</p>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm justify-between w-full font-medium flex items-center gap-2">
              Total Produk
              <span className="ml-2">
                <PackageIcon className="h-5 w-5 text-muted-foreground" />
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <AnimatedNumber value={analytics?.totalProducts ?? 0} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm justify-between w-full font-medium flex items-center gap-2">
              <dt className="flex items-center gap-2">
                Total Stok
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      type="button"
                      size="icon"
                      className="p-0 text-muted-foreground w-fit h-fit"
                    >
                      <BadgeQuestionMark className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Total berdasarkan stok dari satuan terkecil setiap produk
                    </p>
                  </TooltipContent>
                </Tooltip>
              </dt>
              <span className="ml-2">
                <Blocks className="h-5 w-5 text-muted-foreground" />
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <AnimatedNumber value={analytics?.totalStock ?? 0} />
              <span className="text-base text-muted-foreground"> (BU)</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm justify-between text-destructive w-full font-medium flex items-center gap-2">
              Stok Rendah
              <span className="ml-2">
                <PanelTopOpen className="h-5 w-5 text-destructive/80" />
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              <AnimatedNumber value={analytics?.underMinimumStock ?? 0} />
              <span className="text-xl">
                /<AnimatedNumber value={analytics?.totalProducts ?? 0} />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="cursor-pointer overflow-hidden">
            <LayoutPanelTopIcon className="mr-2 h-4 w-4" />
            <p className="truncate">Daftar Produk</p>
          </TabsTrigger>
          <TabsTrigger
            value="mutations"
            className="cursor-pointer overflow-hidden"
          >
            <Table className="mr-2 h-4 w-4" />
            <p className="truncate">Mutasi Stok</p>
          </TabsTrigger>
        </TabsList>

        {/* DAFTAR PRODUK */}
        <TabsContent value="list">
          <ProductListSection
            onEdit={(id) => setEditingProductId(id)}
            onAdjust={(p) => setAdjustmentProduct(p)}
          />
        </TabsContent>

        {/* MUTASI STOK */}
        <TabsContent value="mutations">
          <StockMutationsSection />
        </TabsContent>
      </Tabs>

      {/* MODALS */}
      <ProductFormModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        mode="create"
      />

      <ProductFormModal
        open={!!editingProductId}
        onOpenChange={(open: boolean) => !open && setEditingProductId(null)}
        mode="edit"
        productId={editingProductId}
      />
      <StockAdjustmentModal
        open={!!adjustmentProduct}
        onOpenChange={(open: boolean) => !open && setAdjustmentProduct(null)}
        product={adjustmentProduct}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground animate-pulse">
            Memuat halaman produk...
          </p>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
