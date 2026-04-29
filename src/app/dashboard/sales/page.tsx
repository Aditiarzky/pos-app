"use client";

import { Suspense, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  History,
  ShoppingCart,
  Loader2,
  Undo2,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Wallet,
  QrCode,
} from "lucide-react";
import { useQueryState, useQueryStates } from "@/hooks/use-query-state";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { CardBg } from "@/assets/card-background/card-bg";
import { TransactionForm } from "./_components/_forms/transaction-form";
import { SalesListSection } from "./_components/_sections/sales-list-section";
import { ReturnListSection } from "./_components/_sections/return-list-section";
import { DebtListSection } from "./_components/_sections/debt-list-section";
import { ReturnForm } from "./_components/_forms/return-form";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/ui/search-input";
import { useSaleList } from "@/hooks/sales/use-sale";
import { StickyCardStack } from "@/components/ui/sticky-card-wrapper";
import { RoleGuard } from "@/components/role-guard";
import { AccessDenied } from "@/components/access-denied";
import { ViewModeSwitch } from "@/components/ui/view-mode-switch";
import { FilterWrap } from "@/components/filter-wrap";
import { SalesFilterForm } from "./_components/_ui/sales-filter-form";
import { DebtFilterForm } from "./_components/_ui/debt-filter-form";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import BarcodeScannerCamera from "@/components/barcode-scanner-camera";
import { toast } from "sonner";
import { BUSINESS_TERMS } from "@/lib/business-terms";

// ============================================
// HELPERS
// ============================================

const calculateGrowth = (today: number, yesterday: number) => {
  if (yesterday === 0) return today > 0 ? 100 : 0;
  return ((today - yesterday) / yesterday) * 100;
};

const GrowthIndicator = ({ value }: { value: number }) => {
  const isPositive = value > 0;
  if (value === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 px-1.5 py-0.5 rounded-app-pill text-[10px] font-bold",
        isPositive
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-rose-500/10 text-rose-600",
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {Math.abs(value).toFixed(1)}%
    </div>
  );
};

// ============================================
// MAIN CONTENT COMPONENT
// ============================================

function SalesContent() {
  const [isSalesScannerOpen, setIsSalesScannerOpen] = useState(false);

  // Tab state (synced dengan URL)
  const [tab, setTab] = useQueryState<string>("tab", "cashier");
  const [cashierMode, setCashierMode] = useQueryState<"sales" | "return">(
    "mode",
    "sales",
  );

  // Shared UI/Debt States using useQueryStates
  const [uiStates, setUiStates] = useQueryStates({
    view: "table" as "table" | "card",
    filter: "active" as "active" | "unpaid" | "partial",
    customerId: 0,
  });

  const viewMode = uiStates.view;
  const debtStatusFilter = uiStates.filter;
  const debtCustomerId =
    uiStates.customerId > 0 ? uiStates.customerId : undefined;

  const setViewMode = (v: "table" | "card") => setUiStates({ view: v });
  const setDebtStatusFilter = (f: "active" | "unpaid" | "partial") =>
    setUiStates({ filter: f });
  const setDebtCustomerId = (id: number | undefined) =>
    setUiStates({ customerId: id ?? 0 });

  // Fetch Analytics Data (Static hook for top cards)
  const { analytics: salesAnalytics } = useSaleList({ initialLimit: 1 });

  // Sales history list (syncWithUrl: true enables internal URL-responsive useQueryState for "q")
  const saleList = useSaleList({ syncWithUrl: true });

  const hasActiveSalesAdvancedFilters =
    !!saleList.dateRange.startDate ||
    !!saleList.dateRange.endDate ||
    !!saleList.status ||
    !!saleList.customerId;

  const hasActiveDebtAdvancedFilters =
    debtStatusFilter !== "active" || !!debtCustomerId;

  const hasActiveAdvancedFilters =
    hasActiveSalesAdvancedFilters ||
    hasActiveDebtAdvancedFilters ||
    !!saleList.searchInput;

  const resetDebtFilters = () => {
    setUiStates({ filter: "active", customerId: 0 });
  };

  const handleSalesHistoryScanSuccess = (barcode: string) => {
    const trimmedBarcode = barcode.trim();
    if (!trimmedBarcode) return;

    saleList.setSearchInput(trimmedBarcode);
    saleList.setPage(1);
    setIsSalesScannerOpen(false);
    toast.success("Barcode berhasil dipindai");
  };

  return (
    <>
      {/* Header Section */}
      <header className="sticky top-6 mx-auto container z-10 flex flex-row px-6 justify-between w-full items-center gap-4 pb-16">
        <div className="flex items-center gap-4">
          <div className="h-12 w-1.5 bg-primary rounded-app-pill shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
          <div className="flex flex-col">
            <h1 className="text-3xl text-primary font-bold tracking-tight">
              Kasir & Penjualan
            </h1>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-80">
              Transaksi Real-time • Manajemen Retur
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t">
        {/* Analytics Cards */}
        {tab !== "cashier" && (
          <StickyCardStack className="animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Penjualan */}
            <Card className="relative overflow-hidden border-none shadow-md">
              <CardBg />
              <CardHeader className="pb-2 z-10">
                <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                  Penjualan
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="z-10 pt-0 text-primary">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      <span className="text-sm opacity-70 mr-1">Rp</span>
                      <AnimatedNumber
                        value={salesAnalytics?.totalSalesToday || 0}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                      Total hari ini
                    </p>
                  </div>
                  <GrowthIndicator
                    value={calculateGrowth(
                      salesAnalytics?.totalSalesToday || 0,
                      salesAnalytics?.totalSalesYesterday || 0,
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Gross Profit (mapped from netRevenue field) */}
            <Card className="relative overflow-hidden border-none shadow-md">
              <CardBg />
              <CardHeader className="pb-2 z-10">
                <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                  {BUSINESS_TERMS.grossProfit}
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <CircleDollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="z-10 pt-0 text-emerald-600">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      <span className="text-sm opacity-70 mr-1">Rp</span>
                      <AnimatedNumber
                        value={salesAnalytics?.netRevenueToday || 0}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                      Laba kotor hari ini
                    </p>
                  </div>
                  <GrowthIndicator
                    value={calculateGrowth(
                      salesAnalytics?.netRevenueToday || 0,
                      salesAnalytics?.netRevenueYesterday || 0,
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Piutang */}
            <Card className="relative overflow-hidden border-none shadow-md">
              <CardBg />
              <CardHeader className="pb-2 z-10">
                <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                  Piutang
                  <div className="p-2 bg-rose-500/10 rounded-lg">
                    <Wallet className="h-4 w-4 text-rose-600" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="z-10 pt-0 text-rose-600">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      <span className="text-sm opacity-70 mr-1">Rp</span>
                      <AnimatedNumber
                        value={salesAnalytics?.piutangToday || 0}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                      Sisa tagihan hari ini
                    </p>
                  </div>
                  <GrowthIndicator
                    value={calculateGrowth(
                      salesAnalytics?.piutangToday || 0,
                      salesAnalytics?.piutangYesterday || 0,
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Aktivitas */}
            <Card className="relative overflow-hidden border-none shadow-md">
              <CardBg />
              <CardHeader className="pb-2 z-10">
                <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                  Aktivitas
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <History className="h-4 w-4 text-blue-600" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="z-10 pt-0 text-primary">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      <AnimatedNumber
                        value={salesAnalytics?.transactionsTodayCount || 0}
                      />
                      <span className="text-xs font-medium ml-1 text-muted-foreground">
                        X
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                      Total transaksi hari ini
                    </p>
                  </div>
                  <GrowthIndicator
                    value={calculateGrowth(
                      salesAnalytics?.transactionsTodayCount || 0,
                      salesAnalytics?.transactionsYesterdayCount || 0,
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </StickyCardStack>
        )}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="gap-4">
          <TabsList className="bg-background w-full sm:w-fit justify-start h-auto gap-1 overflow-x-auto flex-nowrap scrollbar-hide">
            <TabsTrigger
              value="cashier"
              className="text-[clamp(0.75rem,2vw,1rem)] data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 data-[state=active]:shadow-none dark:data-[state=active]:border-transparent cursor-pointer whitespace-nowrap text-xs sm:text-sm"
            >
              <ShoppingCart className="mr-2 h-4 w-4 shrink-0" />
              Menu Kasir
            </TabsTrigger>
            <TabsTrigger
              value="history-sales"
              className="text-[clamp(0.75rem,2vw,1rem)] data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 data-[state=active]:shadow-none dark:data-[state=active]:border-transparent cursor-pointer whitespace-nowrap text-xs sm:text-sm"
            >
              <History className="mr-2 h-4 w-4 shrink-0" />
              Riwayat
            </TabsTrigger>
            <TabsTrigger
              value="history-returns"
              className="text-[clamp(0.75rem,2vw,1rem)] data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 data-[state=active]:shadow-none dark:data-[state=active]:border-transparent cursor-pointer whitespace-nowrap text-xs sm:text-sm"
            >
              <Undo2 className="mr-2 h-4 w-4 shrink-0" />
              Retur
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="cashier"
            className="space-y-4 animate-in fade-in duration-300"
          >
            {/* Cashier Mode Switcher */}
            <div className="flex justify-center mb-6">
              <div className="bg-muted p-1 rounded-app-pill flex gap-1">
                <button
                  onClick={() => setCashierMode("sales")}
                  className={cn(
                    "px-6 py-2 rounded-app-pill text-sm font-bold transition-all",
                    cashierMode === "sales"
                      ? "bg-background shadow-sm text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Mode Penjualan
                </button>
                <button
                  onClick={() => setCashierMode("return")}
                  className={cn(
                    "px-6 py-2 rounded-app-pill text-sm font-bold transition-all",
                    cashierMode === "return"
                      ? "bg-background shadow-sm text-destructive"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Mode Retur
                </button>
              </div>
            </div>

            {/* Cashier Forms */}
            {cashierMode === "sales" ? (
              <TransactionForm onSuccess={() => {}} />
            ) : (
              <ReturnForm />
            )}
          </TabsContent>

          <TabsContent
            value="history-sales"
            className="animate-in fade-in duration-300 space-y-8"
          >
            {/* GLOBAL FILTER & TOGGLE BAR */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 items-stretch">
              <div className="flex flex-1 gap-2">
                <SearchInput
                  placeholder="Cari No. Invoice..."
                  value={saleList.searchInput}
                  onChange={saleList.setSearchInput}
                  rightAction={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-app-pill hover:bg-background/50"
                      onClick={() => setIsSalesScannerOpen(true)}
                      aria-label="Buka scanner barcode riwayat penjualan"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  }
                />

                <FilterWrap hasActiveFilters={hasActiveAdvancedFilters}>
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Riwayat Penjualan
                    </div>
                    <SalesFilterForm
                      dateRange={saleList.dateRange}
                      setDateRange={saleList.setDateRange}
                      status={saleList.status}
                      setStatus={saleList.setStatus}
                      customerId={saleList.customerId}
                      setCustomerId={saleList.setCustomerId}
                      setPage={saleList.setPage}
                      resetFilters={saleList.resetFilters}
                      isDropdown
                    />

                    <Separator />

                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Piutang
                    </div>
                    <DebtFilterForm
                      status={debtStatusFilter}
                      setStatus={setDebtStatusFilter}
                      customerId={debtCustomerId}
                      setCustomerId={setDebtCustomerId}
                      resetFilters={resetDebtFilters}
                      isDropdown
                    />
                  </div>
                </FilterWrap>
              </div>

              <ViewModeSwitch value={viewMode} onChange={setViewMode} />
            </div>

            <DebtListSection
              viewMode={viewMode}
              search={saleList.searchInput}
              statusFilter={debtStatusFilter}
              customerId={debtCustomerId}
            />
            <SalesListSection
              viewMode={viewMode}
              searchInput={saleList.searchInput}
              sales={saleList.sales}
              isLoading={saleList.isLoading}
              meta={saleList.meta}
              page={saleList.page}
              setPage={saleList.setPage}
              limit={saleList.limit}
              setLimit={saleList.setLimit}
              refetch={saleList.refetch}
            />
          </TabsContent>

          <TabsContent
            value="history-returns"
            className="animate-in fade-in duration-300"
          >
            <ReturnListSection />
          </TabsContent>
        </Tabs>

        <Dialog open={isSalesScannerOpen} onOpenChange={setIsSalesScannerOpen}>
          <DialogTitle hidden>Scan barcode riwayat penjualan</DialogTitle>
          <DialogContent className="p-0 border-none max-w-lg max-h-[90vh]">
            <BarcodeScannerCamera
              onScanSuccess={handleSalesHistoryScanSuccess}
              onClose={() => setIsSalesScannerOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}

// ============================================
// PAGE COMPONENT WITH SUSPENSE
// ============================================

export default function SalesPage() {
  return (
    <RoleGuard
      allowedRoles={["admin toko", "admin sistem"]}
      fallback={<AccessDenied />}
    >
      <Suspense
        fallback={
          <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <SalesContent />
      </Suspense>
    </RoleGuard>
  );
}
