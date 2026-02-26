"use client";

import { Suspense, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  History,
  ShoppingCart,
  Loader2,
  Undo2,
  LayoutGrid,
  Table2,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Wallet,
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
import { ExpandableContainer } from "@/components/ui/expandable-container";
import { IconCalculator } from "@tabler/icons-react";

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
        "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
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
  // Tab state (synced dengan URL)
  const [tab, setTab] = useQueryState<string>("tab", "cashier");
  const [cashierMode, setCashierMode] = useState<"sales" | "return">("sales");

  // Shared Filter States for History
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [searchInput, setSearchInput] = useState("");

  // Fetch Analytics Data
  const { analytics: salesAnalytics } = useSaleList({ initialLimit: 1 });

  return (
    <>
      {/* Header Section */}
      <header className="sticky top-6 mx-auto container z-10 flex flex-row px-4 justify-between w-full items-center gap-4 pb-16">
        <div className="overflow-hidden flex gap-2">
          <IconCalculator className="h-8 w-8 text-primary" />
          <h1 className="text-2xl text-primary font-geist font-semibold truncate">
            Kasir & Penjualan
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t">
        {/* Analytics Cards */}
        {tab !== "cashier" && (
          <ExpandableContainer>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4">
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

              {/* Net Revenue */}
              <Card className="relative overflow-hidden border-none shadow-md">
                <CardBg />
                <CardHeader className="pb-2 z-10">
                  <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                    Net Revenue
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
                        Profit hari ini
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
            </div>
          </ExpandableContainer>
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
