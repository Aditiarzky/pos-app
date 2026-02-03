/**
 * PURCHASE PAGE
 * Main page untuk manage purchases dan suppliers
 */

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
import { PurchaseResponse } from "./_types/purchase-type";
import { PurchaseListSection } from "./_components/purchase-list-section";
import { SupplierListSection } from "./_components/supplier-list-section";
import { PurchaseForm } from "./_components/purchase-form";
import { SupplierFormModal } from "./_components/supplier-form-modal";
import { SupplierResponse } from "./_types/supplier";

// ============================================
// MAIN CONTENT COMPONENT
// ============================================

function PurchasesContent() {
  // Tab state (synced dengan URL)
  const [tab, setTab] = useQueryState<string>("tab", "history");

  // Purchase form state
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] =
    useState<PurchaseResponse | null>(null);

  // Supplier form state
  const [editingSupplier, setEditingSupplier] =
    useState<SupplierResponse | null>(null);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);

  // ============================================
  // HANDLERS
  // ============================================

  const handleEditPurchase = (purchase: PurchaseResponse) => {
    setEditingPurchase(purchase);
    setIsPurchaseFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClosePurchaseForm = () => {
    setIsPurchaseFormOpen(false);
    setEditingPurchase(null);
  };

  const handleOpenNewPurchase = () => {
    setEditingPurchase(null);
    setIsPurchaseFormOpen(true);
  };

  return (
    <>
      {/* Header Section */}
      <header className="sticky top-0 mx-auto container z-10 flex flex-row px-4 justify-between w-full items-center gap-4 pb-16">
        {" "}
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
            <Button onClick={handleOpenNewPurchase}>
              <Plus className="mr-0 sm:mr-2 h-4 w-4" />
              <p className="hidden sm:block">Catat Pembelian</p>
            </Button>
          ) : (
            <Button
              onClick={() => {
                setEditingSupplier(null);
                setIsSupplierFormOpen(true);
              }}
            >
              <Plus className="mr-0 sm:mr-2 h-4 w-4" />
              <p className="hidden sm:block">Tambah Supplier</p>
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t">
        {/* Analytics Cards - Hidden saat form terbuka */}
        <AnalyticsCards />

        <PurchaseForm
          isOpen={isPurchaseFormOpen}
          onClose={handleClosePurchaseForm}
          initialData={editingPurchase}
        />

        <SupplierFormModal
          open={isSupplierFormOpen}
          onOpenChange={setIsSupplierFormOpen}
          supplierId={editingSupplier?.id}
        />

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="gap-4">
          <TabsList className="bg-background">
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 data-[state=active]:shadow-none dark:data-[state=active]:border-transparent cursor-pointer"
            >
              <History className="mr-2 h-4 w-4" />
              <p className="truncate">Riwayat Pembelian</p>
            </TabsTrigger>
            <TabsTrigger
              value="suppliers"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 data-[state=active]:shadow-none dark:data-[state=active]:border-transparent cursor-pointer"
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
            <SupplierListSection
              onEdit={(supplier) => {
                setEditingSupplier(supplier);
                setIsSupplierFormOpen(true);
              }}
              onAddNew={() => {
                setEditingSupplier(null);
                setIsSupplierFormOpen(true);
              }}
            />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}

// ============================================
// ANALYTICS CARDS COMPONENT
// ============================================

function AnalyticsCards() {
  // TODO: Fetch actual analytics data dari API
  const analytics = {
    totalPurchasesThisMonth: 0,
    newTransactions: 0,
    activeSuppliers: 0,
    percentageChange: 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Pembelian */}
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
            Rp <AnimatedNumber value={analytics.totalPurchasesThisMonth} />
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            {analytics.percentageChange}% vs bulan lalu
          </p>
        </CardContent>
      </Card>

      {/* Transaksi Baru */}
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
            <AnimatedNumber value={analytics.newTransactions} />
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-[10px] font-bold uppercase tracking-wider">
            Menunggu Kedatangan
          </p>
        </CardContent>
      </Card>

      {/* Supplier Aktif */}
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
            <AnimatedNumber value={analytics.activeSuppliers} />
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-[10px] font-bold uppercase tracking-wider">
            Bekerja sama dengan toko
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// PAGE COMPONENT WITH SUSPENSE
// ============================================

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
