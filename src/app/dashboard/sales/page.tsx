"use client";

import { Suspense, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  History,
  ShoppingCart,
  Receipt,
  Loader2,
  Undo2,
  RefreshCcw,
  LayoutGrid,
  Table2,
} from "lucide-react";
import { useQueryState } from "@/hooks/use-query-state";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { CardBg } from "@/assets/card-background/card-bg";
import { TransactionForm } from "./_components/transaction-form";
import { SalesListSection } from "./_components/sales-list-section";
import { ReturnListSection } from "./_components/return-list-section";
import { DebtListSection } from "./_components/debt-list-section";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4">
            <Card className="relative overflow-hidden">
              <CardBg />
              <CardHeader className="pb-2 z-10">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Total Penjualan (Hari Ini)
                  <ShoppingCart className="h-5 w-5 text-muted-foreground/50" />
                </CardTitle>
              </CardHeader>
              <CardContent className="z-10 text-primary">
                <div className="text-3xl font-bold">
                  <span className="text-lg opacity-70 mr-1">Rp</span>
                  <AnimatedNumber value={0} />{" "}
                  {/* TODO: Integrate Analytics Data */}
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <CardBg />
              <CardHeader className="pb-2 z-10">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Transaksi Hari Ini
                  <Receipt className="h-5 w-5 text-muted-foreground/50" />
                </CardTitle>
              </CardHeader>
              <CardContent className="z-10 text-primary">
                <div className="text-3xl font-bold">
                  <AnimatedNumber value={0} />
                </div>
              </CardContent>
            </Card>
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
              <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                <RefreshCcw className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-muted-foreground">
                  Mode Retur Belum Tersedia
                </h3>
                <p className="text-sm text-muted-foreground">
                  Silahkan gunakan menu Riwayat Penjualan untuk membatalkan
                  transaksi.
                </p>
              </div>
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
