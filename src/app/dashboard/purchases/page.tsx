"use client";

import { useState, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  History,
  Truck,
  Plus,
  ShoppingCart,
  TrendingUp,
  Receipt,
  Loader2,
} from "lucide-react";
import { useQueryState } from "@/hooks/use-query-state";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { CardBg } from "@/assets/card-background/card-bg";
import { usePurchases } from "@/hooks/purchases/use-purchases";
import { SupplierListSection } from "./_components/supplier-list-section";
import { SupplierFormModal } from "./_components/supplier-form-modal";
import { PurchaseListSection } from "./_components/purchase-list-section";
import { PurchaseFormModal } from "./_components/purchase-form-modal";

function PurchasesContent() {
  const [tab, setTab] = useQueryState<string>("tab", "history");
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);

  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(
    null,
  );
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);

  const { data: purchasesResult } = usePurchases({ limit: 1 });
  const analytics = purchasesResult?.analytics;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-row justify-between w-full items-center gap-4">
        <div className="overflow-hidden">
          <h1 className="text-3xl text-primary font-geist font-semibold truncate">
            Pembelian
          </h1>
          <p className="text-muted-foreground font-sans text-base truncate">
            Kelola stok masuk dan daftar supplier
          </p>
        </div>
        <div className="flex gap-2">
          {tab === "history" ? (
            <Button onClick={() => setIsAddPurchaseOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Catat Pembelian
            </Button>
          ) : (
            <Button onClick={() => setIsAddSupplierOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Supplier
            </Button>
          )}
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden">
          <CardBg />
          <CardHeader className="pb-2 z-10">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Total Pembelian (Bulan Ini)
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="z-10 text-primary">
            <div className="text-3xl font-bold">
              Rp <AnimatedNumber value={0} /> {/* Placeholder for analytics */}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              0% vs bulan lalu
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardBg />
          <CardHeader className="pb-2 z-10">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Transaksi Baru
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="z-10 text-primary">
            <div className="text-3xl font-bold">
              <AnimatedNumber value={0} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Menunggu kedatangan
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardBg />
          <CardHeader className="pb-2 z-10">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Supplier Aktif
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="z-10 text-primary">
            <div className="text-3xl font-bold">
              <AnimatedNumber value={0} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bekerja sama dengan toko
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history" className="cursor-pointer">
            <History className="mr-2 h-4 w-4" />
            Riwayat Pembelian
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="cursor-pointer">
            <Truck className="mr-2 h-4 w-4" />
            Daftar Supplier
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <PurchaseListSection />
        </TabsContent>

        <TabsContent value="suppliers">
          <SupplierListSection onEdit={(id) => setEditingSupplierId(id)} />
        </TabsContent>
      </Tabs>

      <PurchaseFormModal
        open={isAddPurchaseOpen}
        onOpenChange={setIsAddPurchaseOpen}
      />

      <SupplierFormModal
        open={isAddSupplierOpen || !!editingSupplierId}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddSupplierOpen(false);
            setEditingSupplierId(null);
          }
        }}
        supplierId={editingSupplierId}
      />
    </div>
  );
}

export default function PurchasesPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <PurchasesContent />
    </Suspense>
  );
}
