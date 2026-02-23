"use client";

import { Suspense, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  History,
  ShoppingCart,
  Receipt,
  Loader2,
  Undo2,
  LayoutGrid,
  Table2,
  ChevronsDownIcon,
} from "lucide-react";
import { useQueryState } from "@/hooks/use-query-state";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { CardBg } from "@/assets/card-background/card-bg";
import { TransactionForm } from "./_components/_forms/transaction-form";
import { SalesListSection } from "./_components/_sections/sales-list-section";
import { ReturnListSection } from "./_components/_sections/return-list-section";
import { DebtListSection } from "./_components/_sections/debt-list-section";
import { ReturnForm } from "./_components/_forms/return-form";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { useSaleList } from "@/hooks/sales/use-sale";
import { useCustomerReturnList } from "@/hooks/customer-returns/use-customer-return";

// ============================================
// MAIN CONTENT COMPONENT
// ============================================

function SalesContent() {
  // Tab state (synced dengan URL)
  const [tab, setTab] = useQueryState<string>("tab", "cashier");
  const [cashierMode, setCashierMode] = useState<"sales" | "return">("sales");

  // Shared Filter States for History
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [searchInput, setSearchInput] = useState("");

  // Summary Toggle State (Default Open on Desktop, Closed on Mobile)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  useEffect(() => {
    // Client-side only check
    if (window.innerWidth >= 768) {
      setIsSummaryOpen(true);
    }
  }, []);

  // Fetch Analytics Data
  const { analytics: salesAnalytics } = useSaleList({ initialLimit: 1 });
  const { analytics: returnAnalytics } = useCustomerReturnList({
    initialLimit: 1,
  });

  return (
    <>
      {/* Header Section */}
      <header className="sticky top-0 mx-auto container z-10 flex flex-row px-4 justify-between w-full items-center gap-4 pb-16">
        <div className="overflow-hidden">
          <h1 className="text-3xl text-primary font-geist font-semibold truncate">
            Kasir & Penjualan
          </h1>
          <p className="text-muted-foreground font-sans text-base truncate">
            Kelola transaksi penjualan dan retur
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t">
        {/* Analytics Cards */}
        {tab !== "cashier" && (
          <div
            className={cn(
              "relative transition-all duration-500 ease-in-out overflow-hidden",
              isSummaryOpen ? "max-h-full mb-4 pb-2" : "max-h-24",
            )}
          >
            <span
              className={cn(
                "absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none transition-opacity duration-500",
                isSummaryOpen ? "opacity-0" : "opacity-100",
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4">
              <Card className="relative overflow-hidden">
                <CardBg />
                <CardHeader className="pb-2 z-10">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    Penjualan (Hari Ini)
                    <ShoppingCart className="h-5 w-5 text-primary/40" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="z-10 text-primary">
                  <div className="text-2xl font-bold">
                    <span className="text-sm opacity-70 mr-1">Rp</span>
                    <AnimatedNumber
                      value={salesAnalytics?.totalSalesToday || 0}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardBg />
                <CardHeader className="pb-2 z-10">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    Diterima (Hari Ini)
                    <Receipt className="h-5 w-5 text-primary/40" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="z-10 text-emerald-600">
                  <div className="text-2xl font-bold">
                    <span className="text-sm opacity-70 mr-1">Rp</span>
                    <AnimatedNumber
                      value={salesAnalytics?.totalReceivedToday || 0}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardBg />
                <CardHeader className="pb-2 z-10">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    Retur (Hari Ini)
                    <Undo2 className="h-5 w-5 text-destructive/40" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="z-10 text-destructive">
                  <div className="text-2xl font-bold">
                    <span className="text-sm opacity-70 mr-1">Rp</span>
                    <AnimatedNumber
                      value={returnAnalytics?.totalRefundsToday || 0}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardBg />
                <CardHeader className="pb-2 z-10">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    Volume Aktivitas (Hari Ini)
                    <History className="h-5 w-5 text-primary/40" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="z-10 text-primary">
                  <div className="text-2xl font-bold">
                    <AnimatedNumber
                      value={
                        (salesAnalytics?.transactionsTodayCount || 0) +
                        (returnAnalytics?.returnsTodayCount || 0)
                      }
                    />
                    <span className="text-xs font-medium ml-2 text-muted-foreground">
                      Transaksi
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 font-medium bg-secondary/30 w-fit px-1.5 py-0.5 rounded border border-border/50">
                    Total Semua:{" "}
                    {(salesAnalytics?.totalTransactionsLifetime || 0) +
                      (returnAnalytics?.totalReturnsLifetime || 0)}
                  </div>
                </CardContent>
              </Card>
            </div>
            <span
              className={cn(
                "absolute z-20 w-full flex flex-col items-center gap-0 justify-center transition-all duration-500",
                isSummaryOpen ? "relative pt-4" : "top-14",
              )}
            >
              <Button
                variant="outline"
                size="sm"
                className="bg-card text-muted-foreground hover:brightness-95 shadow-sm rounded-full px-4 h-8"
                onClick={() => setIsSummaryOpen(!isSummaryOpen)}
              >
                {isSummaryOpen ? "Tutup Ringkasan" : "Lihat Ringkasan"}
                <ChevronsDownIcon
                  className={cn("h-4 w-4", isSummaryOpen ? "rotate-180" : "")}
                />
              </Button>
            </span>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="gap-4">
          <TabsList className="bg-background w-full justify-start overflow-x-auto h-auto p-1">
            <TabsTrigger
              value="cashier"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-4 py-2"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Menu Kasir
            </TabsTrigger>
            <TabsTrigger
              value="history-sales"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-4 py-2"
            >
              <History className="mr-2 h-4 w-4" />
              Riwayat Penjualan
            </TabsTrigger>
            <TabsTrigger
              value="history-returns"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-4 py-2"
            >
              <Undo2 className="mr-2 h-4 w-4" />
              Riwayat Retur
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="cashier"
            className="space-y-4 animate-in fade-in duration-300"
          >
            {/* Cashier Mode Switcher */}
            <div className="flex justify-center mb-6">
              <div className="bg-muted p-1 rounded-full flex gap-1">
                <button
                  onClick={() => setCashierMode("sales")}
                  className={cn(
                    "px-6 py-2 rounded-full text-sm font-bold transition-all",
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
                    "px-6 py-2 rounded-full text-sm font-bold transition-all",
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
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <SearchInput
                placeholder="Cari No. Invoice / Customer..."
                value={searchInput}
                onChange={setSearchInput}
              />

              <div className="flex gap-2">
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("table")}
                >
                  <Table2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "card" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("card")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <DebtListSection viewMode={viewMode} search={searchInput} />
            <SalesListSection viewMode={viewMode} searchInput={searchInput} />
          </TabsContent>

          <TabsContent
            value="history-returns"
            className="animate-in fade-in duration-300"
          >
            <ReturnListSection />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}

// ============================================
// PAGE COMPONENT WITH SUSPENSE
// ============================================

export default function SalesPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SalesContent />
    </Suspense>
  );
}
