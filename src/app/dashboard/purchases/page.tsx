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
import { PurchaseForm } from "./_components/purchase-form";

function PurchasesContent() {
  const [tab, setTab] = useQueryState<string>("tab", "history");
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);

  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(
    null,
  );
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);

  const { data: purchasesResult } = usePurchases({ limit: 1 });
  // Analytics could be expanded later
  // const analytics = purchasesResult?.analytics;

  const handleEditPurchase = (purchase: any) => {
    setEditingPurchase(purchase);
    setIsPurchaseFormOpen(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseForm = () => {
    setIsPurchaseFormOpen(false);
    setEditingPurchase(null);
  };

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
            !isPurchaseFormOpen && (
              <Button onClick={() => setIsPurchaseFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Catat Pembelian
              </Button>
            )
          ) : (
            <Button onClick={() => setIsAddSupplierOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Supplier
            </Button>
          )}
        </div>
      </div>

      {/* Analytics Overview (Hidden when form is open to save space) */}
      {!isPurchaseFormOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="relative overflow-hidden group">
            <CardBg />
            <CardHeader className="pb-2 z-10 transition-transform group-hover:scale-105 duration-300">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Total Pembelian (Bulan Ini)
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="z-10 text-primary">
              <div className="text-3xl font-bold">
                Rp <AnimatedNumber value={0} />{" "}
                {/* Analytics logic needed on backend */}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                0% vs bulan lalu
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group">
            <CardBg />
            <CardHeader className="pb-2 z-10 transition-transform group-hover:scale-105 duration-300">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Transaksi Baru
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="z-10 text-primary">
              <div className="text-3xl font-bold">
                <AnimatedNumber value={0} />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-[10px] font-bold uppercase tracking-wider">
                Menunggu Kedatangan
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group">
            <CardBg />
            <CardHeader className="pb-2 z-10 transition-transform group-hover:scale-105 duration-300">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Supplier Aktif
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="z-10 text-primary">
              <div className="text-3xl font-bold">
                <AnimatedNumber value={0} />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-[10px] font-bold uppercase tracking-wider">
                Bekerja sama dengan toko
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inline Purchase Form */}
      {isPurchaseFormOpen && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <PurchaseForm
            onCancel={handleCloseForm}
            initialData={editingPurchase}
          />
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-11 bg-muted/50 p-1">
          <TabsTrigger
            value="history"
            className="cursor-pointer font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground overflow-hidden"
          >
            <History className="mr-2 h-4 w-4" />
            <p className="truncate">Riwayat Pembelian</p>
          </TabsTrigger>
          <TabsTrigger
            value="suppliers"
            className="cursor-pointer font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground overflow-hidden"
          >
            <Truck className="mr-2 h-4 w-4" />
            <p className="truncate">Daftar Supplier</p>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="history"
          className="animate-in fade-in duration-300"
        >
          <PurchaseListSection onEdit={handleEditPurchase} />
        </TabsContent>

        <TabsContent
          value="suppliers"
          className="animate-in fade-in duration-300"
        >
          <SupplierListSection onEdit={(id) => setEditingSupplierId(id)} />
        </TabsContent>
      </Tabs>

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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PurchasesContent />
    </Suspense>
  );
}
