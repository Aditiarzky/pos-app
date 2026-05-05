"use client";

import { useState, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LayoutPanelTopIcon,
  Loader2,
  PackageIcon,
  Plus,
  Table,
  Activity,
  AlertCircle,
  Blocks,
  //   History,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useProducts } from "@/hooks/products/use-products";
import { ProductFormModal } from "./_components/product-form/product-form-modal";
import { StockMutationsSection } from "./_components/sections/stock-mutations-section";
// import { ProductAuditLogSection } from "./_components/sections/product-audit-log-section";
import { StockAdjustmentModal } from "./_components/stock-adjustment-modal";
import { ProductListSection } from "./_components/sections/product-list-section";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useQueryState } from "@/hooks/use-query-state";
import { useAuth } from "@/hooks/use-auth";
import { CardBg } from "@/assets/card-background/card-bg";
import { ProductResponse } from "@/services/productService";
import { StickyCardStack } from "@/components/ui/sticky-card-wrapper";
import { RoleGuard } from "@/components/role-guard";
import { AccessDenied } from "@/components/access-denied";
import { useTabsOverflow } from "@/hooks/use-tabs-overflow";

function ProductsContent() {
  const { roles } = useAuth();
  const isSystemAdmin = (roles as string[]).includes("admin sistem");

  const [tab, setTab] = useQueryState<string>("tab", "list");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [adjustmentProduct, setAdjustmentProduct] =
    useState<ProductResponse | null>(null);

  const { listRef, isOverflowing } = useTabsOverflow();

  // Still need analytics for the top cards
  const { data: productsData } = useProducts({
    params: { limit: 1 },
  });
  const analytics = productsData?.analytics;

  type TabItem = {
    value: string;
    icon: React.ElementType;
    label: string;
  };

  const tabItems: TabItem[] = [
    { value: "list", icon: LayoutPanelTopIcon, label: "Daftar Produk" },
    ...(isSystemAdmin
      ? [{ value: "mutations", icon: Table, label: "Mutasi Stok" }]
      : []),
    // ...(isSystemAdmin
    //   ? [{ value: "audit-log", icon: History, label: "Riwayat Produk" }]
    //   : []),
  ];

  return (
    <>
      <header className="sticky top-6 mx-auto container z-10 flex flex-row px-4 sm:px-6 justify-between w-full items-center gap-4 pb-16">
        <div className="flex items-center gap-4">
          <div className="h-12 w-1.5 bg-primary rounded-app-pill shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
          <div className="flex flex-col">
            <h1 className="text-3xl text-primary font-bold tracking-tight">
              Produk
            </h1>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-80">
              Manajemen Produk • Kategori & Arus Stok
            </p>
          </div>
        </div>
        <div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-br from-primary to-green-600 dark:to-green-400 hover:brightness-90 rounded-app-lg"
          >
            <Plus className="mr-0 sm:mr-2 h-4 w-4" />
            <p className="hidden sm:block">Tambah Produk</p>
          </Button>
        </div>
      </header>
      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t">
        {/* Overview Cards */}
        <StickyCardStack className="animate-in fade-in slide-in-from-top-4 duration-500">
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
        </StickyCardStack>

        <Tabs value={tab} onValueChange={setTab} className="gap-4">
          {/*
           * ref diarahkan ke div wrapper karena TabsList dari shadcn
           * belum tentu forward ref. Kalau TabsList sudah support ref,
           * bisa langsung pasang ref={listRef} di TabsList.
           */}
          <div ref={listRef} className="w-full overflow-hidden">
            <TabsList className="bg-background w-max">
              {tabItems.map(({ value, icon: Icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 data-[state=active]:shadow-none dark:data-[state=active]:border-transparent cursor-pointer"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span
                    className={cn(
                      "overflow-hidden transition-[max-width,opacity,margin] duration-300 ease-in-out",
                      !isOverflowing || tab === value
                        ? "max-w-[120px] opacity-100 ml-2"
                        : "max-w-0 opacity-0 ml-0",
                    )}
                  >
                    {label}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* DAFTAR PRODUK */}
          <TabsContent value="list">
            <ProductListSection
              onEdit={(id) => setEditingProductId(id)}
              onAdjust={(p) => setAdjustmentProduct(p)}
            />
          </TabsContent>

          {/* MUTASI STOK */}
          {isSystemAdmin && (
            <TabsContent value="mutations">
              <StockMutationsSection />
            </TabsContent>
          )}

          {/* RIWAYAT PRODUK */}
          {/* {isSystemAdmin && (
            <TabsContent value="audit-log">
              <ProductAuditLogSection />
            </TabsContent>
          )} */}
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
    <RoleGuard
      allowedRoles={["admin toko", "admin sistem"]}
      fallback={<AccessDenied />}
    >
      <Suspense
        fallback={
          <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <ProductsContent />
      </Suspense>
    </RoleGuard>
  );
}
