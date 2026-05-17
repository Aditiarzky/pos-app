"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { CardBg } from "@/assets/card-background/card-bg";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingCart,
  Receipt,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Info,
} from "lucide-react";
import { SalesReportResponse } from "@/services/reportService";
import { ReportPieChart } from "./report-pie-chart";
import { formatCurrency } from "@/lib/format";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";

interface SalesSectionProps {
  data: SalesReportResponse | undefined;
  isLoading: boolean;
  dailyData: { date: string; [key: string]: number | string }[];
}

export function SalesSection({
  data,
  isLoading,
  dailyData,
}: SalesSectionProps) {
  const summary = data?.summary;
  const topProducts = data?.topProducts ?? [];
  const topCategories = data?.topCategories ?? [];

  return (
    <div className="space-y-6">
      {/* Layer 1: Core Sales Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden border-none shadow-md text-primary">
          <CardBg />
          <CardHeader className="pb-2 z-10">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
              Pendapatan Penjualan
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-primary" />
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
                <AnimatedNumber value={summary?.totalSales || 0} />
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
              <div className="text-2xl font-bold">
                <AnimatedNumber value={summary?.totalTransactions || 0} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-md text-primary">
          <CardBg />
          <CardHeader className="pb-2 z-10">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
              Rata-rata Penjualan
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
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
                <AnimatedNumber
                  value={
                    summary?.totalTransactions
                      ? summary.totalSales / summary.totalTransactions
                      : 0
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Layer 2: Sales Trend (New) */}
      <ChartAreaInteractive
        title="Tren Pendapatan Penjualan"
        description="Statistik omset penjualan harian"
        data={dailyData}
        config={{
          totalSales: { label: "Penjualan", color: "var(--primary)" },
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Layer 2: Detailed Breakdowns */}
        {/* Layer 2: Detailed Breakdowns */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-md pt-0 gap-0">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="flex items-center justify-between pt-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>10 Produk Terlaris</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="py-3 pl-6">Produk</TableHead>
                    <TableHead className="text-right py-3">Qty</TableHead>
                    <TableHead className="text-right py-3 pr-6">
                      Pendapatan
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={3} className="py-4 px-6">
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : topProducts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-10 text-muted-foreground italic"
                      >
                        Belum ada data penjualan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    topProducts.slice(0, 10).map((item, idx) => (
                      <TableRow
                        key={item.productId}
                        className="hover:bg-muted/10"
                      >
                        <TableCell className="font-medium py-3 pl-6">
                          <span className="mr-2 text-xs font-bold text-muted-foreground">
                            {idx + 1}.
                          </span>
                          {item.productName}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.qtySold}
                        </TableCell>
                        <TableCell className="text-right pr-6 font-bold tabular-nums">
                          {formatCurrency(item.revenue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-md pt-0 gap-0">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="flex items-center gap-2 pt-6">
                <PieChartIcon className="h-5 w-5 text-primary" />
                <span>Kategori Terlaris</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="py-3 pl-6">Kategori</TableHead>
                    <TableHead className="text-right py-3">Qty</TableHead>
                    <TableHead className="text-right py-3 pr-6">
                      Pendapatan
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading
                    ? [...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={3} className="py-4 px-6">
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    : topCategories.map((cat, idx) => (
                        <TableRow
                          key={cat.categoryId}
                          className="hover:bg-muted/10"
                        >
                          <TableCell className="py-3 pl-6 font-medium">
                            <span className="mr-2 text-xs font-bold text-muted-foreground">
                              {idx + 1}.
                            </span>
                            {cat.categoryName}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {cat.qtySold}
                          </TableCell>
                          <TableCell className="text-right pr-6 font-bold tabular-nums">
                            {formatCurrency(cat.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <ReportPieChart
            data={topProducts}
            title="Distribusi Pendapatan"
            description="Berdasarkan 5 produk teratas"
          />
        </div>
      </div>

      {/* Layer 3: Interpretation */}
      {!isLoading && summary && (
        <Card className="border-dashed p-0 bg-muted/20">
          <CardContent className="p-4 flex gap-3">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-sm space-y-1">
              <p className="font-bold text-primary">Insight Penjualan</p>
              <p className="text-muted-foreground leading-relaxed">
                {topProducts[0]
                  ? `Produk "${topProducts[0].productName}" adalah penyumbang pendapatan terbesar dengan kontribusi ${((topProducts[0].revenue / summary.totalSales) * 100).toFixed(1)}% dari total omset. `
                  : ""}
                Rata-rata pelanggan berbelanja sebesar Rp
                {(
                  summary.totalSales / (summary.totalTransactions || 1)
                ).toLocaleString()}{" "}
                per transaksi.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
