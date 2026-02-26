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
  Receipt,
  Loader2,
  Box,
} from "lucide-react";
import {
  usePurchaseList,
  UsePurchaseListReturn,
} from "./_hooks/use-purchase-list";
import { PurchaseResponse } from "./_types/purchase-type";
import { PurchaseListSection } from "./_components/purchase-list-section";
import { SupplierListSection } from "./_components/supplier-list-section";
import { PurchaseForm } from "./_components/purchase-form";
import { SupplierFormModal } from "./_components/supplier-form-modal";
import { SupplierResponse } from "./_types/supplier";
import { useQueryState } from "@/hooks/use-query-state";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { CardBg } from "@/assets/card-background/card-bg";
import { Badge } from "@/components/ui/badge";
import { IconTrolley } from "@tabler/icons-react";
import { ExpandableContainer } from "@/components/ui/expandable-container";

// ============================================
// MAIN CONTENT COMPONENT
// ============================================

function PurchasesContent() {
  // Tab state (synced dengan URL)
  const [tab, setTab] = useQueryState<string>("tab", "history");

  // Fetch data here so it can be shared with AnalyticsCards
  const {
    purchases,
    isLoading,
    meta,
    analytics,
    page,
    setPage,
    limit,
    setLimit,
    searchInput,
    setSearchInput,
    orderBy,
    setOrderBy,
    order,
    setOrder,
    hasActiveFilters,
    resetFilters,
    handleDelete,
  } = usePurchaseList();

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
      <header className="sticky top-6 mx-auto container z-10 flex flex-row px-4 justify-between w-full items-center gap-4 pb-16">
        {" "}
        <div className="overflow-hidden flex gap-2">
          <IconTrolley className="h-8 w-8 text-primary" />
          <h1 className="text-2xl text-primary font-geist font-semibold truncate">
            Pembelian
          </h1>
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
        <AnalyticsCards analytics={analytics} />

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
            <PurchaseListSection
              onEdit={handleEditPurchase}
              // Injection data dari usePurchaseList
              purchases={purchases}
              isLoading={isLoading}
              meta={meta}
              page={page}
              setPage={setPage}
              limit={limit}
              setLimit={setLimit}
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              orderBy={orderBy}
              setOrderBy={setOrderBy}
              order={order}
              setOrder={setOrder}
              hasActiveFilters={hasActiveFilters}
              resetFilters={resetFilters}
              onDelete={handleDelete}
            />
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

function AnalyticsCards({
  analytics,
}: {
  analytics?: UsePurchaseListReturn["analytics"];
}) {
  const thisMonth = analytics?.totalPurchasesThisMonth ?? 0;
  const lastMonth = analytics?.totalPurchasesLastMonth ?? 0;

  const percentage =
    lastMonth > 0
      ? ((thisMonth - lastMonth) / lastMonth) * 100
      : thisMonth > 0
        ? 100
        : 0;

  const isPositive = percentage >= 0;
  const formattedPercentage = Math.abs(percentage).toFixed(0);

  return (
    <ExpandableContainer>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4">
        {/* Total Pembelian */}
        <Card className="relative overflow-hidden border-none shadow-md">
          <CardBg />
          <CardHeader className="pb-2 z-10">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
              Total Pembelian
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="z-10 pt-0 text-primary">
            <div className="text-2xl font-bold flex items-baseline gap-1">
              <span className="text-sm font-medium opacity-70">Rp</span>
              <AnimatedNumber value={thisMonth} />
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[8px] px-1 py-0 font-bold ${
                  isPositive
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-rose-50 text-rose-600 border-rose-100"
                }`}
              >
                {isPositive ? "+" : "-"}
                {formattedPercentage}%
              </Badge>
              <span className="text-[10px] text-muted-foreground font-medium italic opacity-60">
                vs bulan lalu
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Transaksi Baru */}
        <Card className="relative overflow-hidden border-none shadow-md">
          <CardBg />
          <CardHeader className="pb-2 z-10">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
              Transaksi Baru
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Receipt className="h-4 w-4 text-yellow-500" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="z-10 pt-0 text-primary">
            <div className="text-2xl font-bold">
              <AnimatedNumber value={analytics?.newTransactions ?? 0} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">
              Tercatat hari ini
            </p>
          </CardContent>
        </Card>

        {/* Supplier Aktif */}
        <Card className="relative overflow-hidden border-none shadow-md">
          <CardBg />
          <CardHeader className="pb-2 z-10">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
              Supplier Terlibat
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Truck className="h-4 w-4 text-green-500" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="z-10 pt-0 text-primary">
            <div className="text-2xl font-bold">
              <AnimatedNumber value={analytics?.activeSuppliers ?? 0} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">
              Mitra aktif bertransaksi
            </p>
          </CardContent>
        </Card>

        {/* Total Item Dibeli */}
        <Card className="relative overflow-hidden border-none shadow-md">
          <CardBg />
          <CardHeader className="pb-2 z-10">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
              Item Dibeli
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Box className="h-4 w-4 text-blue-500" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="z-10 pt-0 text-primary">
            <div className="text-2xl font-bold">
              <AnimatedNumber value={analytics?.todayItemsQty ?? 0} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">
              Kuantitas masuk hari ini
            </p>
          </CardContent>
        </Card>
      </div>
    </ExpandableContainer>
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
