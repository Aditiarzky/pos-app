"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { CardBg } from "@/assets/card-background/card-bg";
import { Receipt, ArrowUpRight, Info } from "lucide-react";
import { PurchaseReportResponse } from "@/services/reportService";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";

interface PurchaseSectionProps {
  data: PurchaseReportResponse | undefined;
  isLoading: boolean;
  dailyData: { date: string; [key: string]: number | string }[];
}

export function PurchaseSection({
  data,
  isLoading,
  dailyData,
}: PurchaseSectionProps) {
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      {/* Layer 1: Core Purchase Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="relative overflow-hidden border-none shadow-md text-primary">
          <CardBg />
          <CardHeader className="pb-2 z-10">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
              Total Pengeluaran Pembelian
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Receipt className="h-4 w-4 text-amber-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="z-10 pt-0">
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="text-2xl font-bold flex items-baseline gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Rp
                </span>
                <AnimatedNumber value={summary?.totalPurchases || 0} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-md text-primary">
          <CardBg />
          <CardHeader className="pb-2 z-10">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
              Transaksi Pembelian
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ArrowUpRight className="h-4 w-4 text-blue-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="z-10 pt-0">
            {isLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                <AnimatedNumber value={summary?.totalTransactions || 0} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Layer 2: Breakdown (Daily trend) */}
      <ChartAreaInteractive
        title="Tren Pengeluaran Pembelian"
        description="Statistik pembelian stok harian"
        data={dailyData}
        config={{
          totalPurchases: { label: "Pembelian", color: "var(--destructive)" },
        }}
      />

      {/* Layer 3: Interpretation */}
      {!isLoading && summary && (
        <Card className="border-dashed p-0 bg-muted/20">
          <CardContent className="p-4 flex gap-3">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-sm space-y-1">
              <p className="font-bold text-primary">Insight Pembelian</p>
              <p className="text-muted-foreground leading-relaxed">
                Rata-rata pengeluaran per restock adalah sebesar Rp
                {(
                  summary.totalPurchases / (summary.totalTransactions || 1)
                ).toLocaleString()}
                .
                {summary.prevTotalPurchases &&
                summary.totalPurchases > summary.prevTotalPurchases
                  ? " Terdapat peningkatan pengadaan stok dibandingkan periode lalu."
                  : " Pengadaan stok cenderung stabil atau menurun."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
