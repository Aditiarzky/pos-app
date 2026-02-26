"use client";

import { useState, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LayoutPanelTopIcon,
  Loader2,
  Package,
  PackageIcon,
  Plus,
  Table,
  Activity,
  AlertCircle,
  Blocks,
} from "lucide-react";

import { useProducts } from "@/hooks/products/use-products";
import { ProductFormModal } from "./_components/product-form/product-form-modal";
import { StockMutationsSection } from "./_components/sections/stock-mutations-section";
import { StockAdjustmentModal } from "./_components/stock-adjustment-modal";
import { ProductListSection } from "./_components/sections/product-list-section";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useQueryState } from "@/hooks/use-query-state";
import { CardBg } from "@/assets/card-background/card-bg";
import { ProductResponse } from "@/services/productService";
import { ExpandableContainer } from "@/components/ui/expandable-container";

function ProductsContent() {
  const [tab, setTab] = useQueryState<string>("tab", "list");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [adjustmentProduct, setAdjustmentProduct] =
    useState<ProductResponse | null>(null);

  // Still need analytics for the top cards
  const { data: productsData } = useProducts({
    params: { limit: 1 },
  });
  const analytics = productsData?.analytics;

  return (
    <>
      <header className="sticky top-6 mx-auto container z-0 flex flex-row px-4 justify-between w-full items-center gap-4 pb-16">
        <div className="overflow-hidden flex gap-2">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-2xl text-primary font-geist font-semibold truncate">
            Produk
          </h1>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="w-auto">
          <Plus className="m-0 sm:mr-2 sm:h-4 sm:w-4 w-5 h-5" />
          <p className="hidden sm:block">Tambah Produk</p>
        </Button>
      </header>
      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t">
        {/* Overview Cards */}
        <ExpandableContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4">
            <Card className="relative overflow-hidden border-none shadow-md">
              <CardBg />
              <CardHeader className="pb-2 z-10">
                <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                  Total Produk
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <PackageIcon className="h-4 w-4 text-green-500" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="z-10 pt-0 text-primary">
                <div className="text-2xl font-bold">
                  <AnimatedNumber value={analytics?.totalProducts ?? 0} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                  Informasi produk terdaftar
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-none shadow-md">
              <CardBg />
              <CardHeader className="pb-2 z-10">
                <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                  Total Stok
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Blocks className="h-4 w-4 text-blue-500" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="z-10 pt-0 text-primary">
                <div className="text-2xl font-bold">
                  <AnimatedNumber value={analytics?.totalStock ?? 0} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium italic opacity-60">
                  Total per satuan terkecil
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-none shadow-md">
              <CardBg />
              <CardHeader className="pb-2 z-10">
                <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                  Stok Rendah
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="z-10 pt-0 text-primary">
                <div className="text-2xl font-bold text-destructive">
                  <AnimatedNumber value={analytics?.underMinimumStock ?? 0} />
                  <span className="text-sm text-muted-foreground ml-1">
                    /{analytics?.totalProducts ?? 0}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                  Produk perlu restock
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-none shadow-md">
              <CardBg />
              <CardHeader className="pb-2 z-10">
                <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                  Aktivitas Stok
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Activity className="h-4 w-4 text-amber-600" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="z-10 pt-0 text-primary">
                <div className="text-2xl font-bold">
                  <AnimatedNumber value={analytics?.todayStockActivity ?? 0} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                  Mutasi stok hari ini
                </p>
              </CardContent>
            </Card>
          </div>
        </ExpandableContainer>

        <Tabs value={tab} onValueChange={setTab} className="gap-4">
          <TabsList className="bg-background">
            <TabsTrigger
              value="list"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 data-[state=active]:shadow-none dark:data-[state=active]:border-transparent cursor-pointer"
            >
              <LayoutPanelTopIcon className="mr-2 h-4 w-4" />
              <p className="truncate">Daftar Produk</p>
            </TabsTrigger>
            <TabsTrigger
              value="mutations"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 data-[state=active]:shadow-none dark:data-[state=active]:border-transparent cursor-pointer"
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
      </main>
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
