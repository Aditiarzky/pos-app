/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { CardBg } from "@/assets/card-background/card-bg";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Receipt,
  CircleDollarSign,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { ReportSummary } from "@/services/reportService";
import { StickyCardStack } from "@/components/ui/sticky-card-wrapper";

interface OverviewSectionProps {
  summary: ReportSummary | undefined;
  dailyData: any[];
  isLoading: boolean;
}

const calcChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const PercentageBadge = ({ value }: { value: number }) => {
  if (value === 0) return null;
  const isPositive = value > 0;
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

export function OverviewSection({
  summary,
  dailyData,
  isLoading,
}: OverviewSectionProps) {
  const netCashFlow = summary?.netCashFlow ?? 0;

  return (
    <div className="space-y-6">
      {/* Layer 1: KPI Cards */}
      <StickyCardStack>
        <Card className="relative overflow-hidden border-none shadow-md text-primary">
          <CardBg />
          <CardHeader className="pb-2 z-10">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
              Pendapatan (Omset)
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="z-10 pt-0">
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold flex items-baseline gap-1">
                    <span className="text-sm font-medium text-muted-foreground">
                      Rp
                    </span>
                    <AnimatedNumber value={summary?.totalSales || 0} />
                  </div>
                  <PercentageBadge
                    value={calcChange(
                      summary?.totalSales || 0,
                      summary?.prevTotalSales || 0,
                    )}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 font-medium">
                  vs periode sebelumnya
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-md text-primary">
          <CardBg />
          <CardHeader className="pb-2 z-10">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
              Arus Kas Bersih
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="z-10 pt-0">
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold flex items-baseline gap-1">
                    <span className="text-sm font-medium text-muted-foreground">
                      Rp
                    </span>
                    <AnimatedNumber value={netCashFlow} />
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 font-medium">
                  Uang masuk bersih (Penjualan - Pembelian)
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-md text-primary">
          <CardBg />
          <CardHeader className="pb-2 z-10">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
              Total Transaksi
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Receipt className="h-4 w-4 text-blue-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="z-10 pt-0">
            {isLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    <AnimatedNumber value={summary?.totalTransactions || 0} />
                  </div>
                  <PercentageBadge
                    value={calcChange(
                      summary?.totalTransactions || 0,
                      summary?.prevTotalTransactions || 0,
                    )}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                  Gabungan penjualan & pembelian
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-md text-primary">
          <CardBg />
          <CardHeader className="pb-2 z-10">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
              Estimasi Laba Bersih
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CircleDollarSign className="h-4 w-4 text-emerald-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="z-10 pt-0">
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold flex items-baseline gap-1">
                    <span className="text-sm font-medium text-muted-foreground">
                      Rp
                    </span>
                    <AnimatedNumber value={summary?.netProfit || 0} />
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 font-medium">
                  Setelah HPP, Biaya Ops & Pajak
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </StickyCardStack>

      {/* Layer 2: Breakdown (Main Chart) */}
      <ChartAreaInteractive
        title="Tren Pendapatan vs Pembelian"
        description="Perbandingan aliran dana masuk dan keluar harian"
        data={dailyData}
        config={{
          totalSales: { label: "Pendapatan", color: "var(--chart-1)" },
          totalPurchases: { label: "Pembelian", color: "var(--destructive)" },
        }}
      />

      {/* Layer 3: Interpretation */}
      {!isLoading && summary && (
        <Card className="border-dashed p-0 bg-muted/20">
          <CardContent className="p-4 flex gap-3">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-sm space-y-1">
              <p className="font-bold text-primary">Insight Cepat</p>
              <p className="text-muted-foreground leading-relaxed">
                {summary.totalSales > summary.totalPurchases
                  ? `Bisnis memiliki aliran kas positif sebesar Rp${(summary.totalSales - summary.totalPurchases).toLocaleString()}. `
                  : `Pengeluaran pembelian lebih besar dari pendapatan sebesar Rp${(summary.totalPurchases - summary.totalSales).toLocaleString()}. `}
                {summary.prevTotalSales &&
                summary.totalSales > summary.prevTotalSales
                  ? "Terdapat kenaikan pendapatan dibandingkan periode sebelumnya. "
                  : "Pendapatan cenderung menurun atau stabil dibandingkan periode sebelumnya. "}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
