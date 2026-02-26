"use client";

import { Suspense, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { useReports } from "@/hooks/report/use-report";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  ChartBar,
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ShoppingCart,
  Receipt,
  CircleDollarSign,
  PieChart as PieChartIcon,
} from "lucide-react";
import { IconReport } from "@tabler/icons-react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { ReportPieChart } from "./_components/report-pie-chart";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { CardBg } from "@/assets/card-background/card-bg";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS = [
  { label: "7 Hari", value: "7d" },
  { label: "30 Hari", value: "30d" },
  { label: "Bulan Ini", value: "thisMonth" },
  { label: "Tahun Ini", value: "thisYear" },
];

const getRangeFromOption = (option: string) => {
  const now = new Date();
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
  let start = new Date();

  switch (option) {
    case "7d":
      start.setDate(now.getDate() - 7);
      break;
    case "30d":
      start.setDate(now.getDate() - 30);
      break;
    case "thisMonth":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "thisYear":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
};

const getDefaultDateFilter = () => {
  return getRangeFromOption("thisMonth");
};

const calculatePercentageChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const PercentageBadge = ({ value }: { value: number }) => {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  if (isNeutral) return null;

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

export function ReportContent() {
  const [selectedFilter, setSelectedFilter] = useState("thisMonth");
  const [appliedFilter, setAppliedFilter] = useState(getDefaultDateFilter());

  const reportQuery = useReports({ params: appliedFilter });

  const summary = reportQuery.data?.data?.summary;
  const topProducts = reportQuery.data?.data?.topProducts ?? [];
  const dailySummary = reportQuery.data?.data?.daily ?? [];

  const netFlow = useMemo(() => {
    if (!summary) return 0;
    return (summary.totalSales || 0) - (summary.totalPurchases || 0);
  }, [summary]);

  const handleFilterChange = (option: string) => {
    setSelectedFilter(option);
    setAppliedFilter(getRangeFromOption(option));
  };

  return (
    <div className="container mx-auto space-y-4">
      <header className="sticky top-6 mx-auto container z-10 flex flex-row px-4 justify-between w-full items-center gap-4 pb-16">
        {" "}
        <div className="overflow-hidden flex items-end gap-2">
          <IconReport className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-semibold text-primary">Laporan</h1>
        </div>
      </header>
      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t">
        <div className="flex flex-wrap gap-2 mb-6 p-1 bg-muted/50 rounded-lg w-fit">
          {FILTER_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={selectedFilter === option.value ? "default" : "ghost"}
              size="sm"
              onClick={() => handleFilterChange(option.value)}
              className={cn(
                "rounded-md px-4 py-1.5 text-xs font-medium transition-all",
                selectedFilter === option.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {reportQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Gagal memuat laporan</AlertTitle>
            <AlertDescription>
              Terjadi kesalahan saat mengambil data laporan. Coba ulangi
              beberapa saat lagi.
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Sales */}
          <Card className="relative overflow-hidden border-none shadow-md">
            <CardBg />
            <CardHeader className="pb-2 z-10">
              <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                Total Penjualan
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="z-10 pt-0">
              {reportQuery.isLoading ? (
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
                      value={calculatePercentageChange(
                        summary?.totalSales || 0,
                        summary?.prevTotalSales || 0,
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground font-medium">
                    <span>vs periode sebelumnya</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Purchases */}
          <Card className="relative overflow-hidden border-none shadow-md">
            <CardBg />
            <CardHeader className="pb-2 z-10">
              <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                Total Pembelian
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Receipt className="h-4 w-4 text-amber-600" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="z-10 pt-0">
              {reportQuery.isLoading ? (
                <Skeleton className="h-9 w-32" />
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold flex items-baseline gap-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        Rp
                      </span>
                      <AnimatedNumber value={summary?.totalPurchases || 0} />
                    </div>
                    <PercentageBadge
                      value={calculatePercentageChange(
                        summary?.totalPurchases || 0,
                        summary?.prevTotalPurchases || 0,
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground font-medium">
                    <span>vs periode sebelumnya</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Transactions */}
          <Card className="relative overflow-hidden border-none shadow-md">
            <CardBg />
            <CardHeader className="pb-2 z-10">
              <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                Total Transaksi
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <ArrowUpRight className="h-4 w-4 text-blue-600" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="z-10 pt-0">
              {reportQuery.isLoading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      <AnimatedNumber value={summary?.totalTransactions || 0} />
                    </div>
                    <PercentageBadge
                      value={calculatePercentageChange(
                        summary?.totalTransactions || 0,
                        summary?.prevTotalTransactions || 0,
                      )}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                    vs periode sebelumnya
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Profit */}
          <Card className="relative overflow-hidden border-none shadow-md bg-primary/5">
            <CardBg />
            <CardHeader className="pb-2 z-10">
              <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                Total Laba Bersih
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <CircleDollarSign className="h-4 w-4 text-emerald-600" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="z-10 pt-0">
              {reportQuery.isLoading ? (
                <Skeleton className="h-9 w-32" />
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold flex items-baseline gap-1 text-primary">
                      <span className="text-sm font-medium text-primary/70">
                        Rp
                      </span>
                      <AnimatedNumber value={summary?.totalProfit || 0} />
                    </div>
                    <PercentageBadge
                      value={calculatePercentageChange(
                        summary?.totalProfit || 0,
                        summary?.prevTotalProfit || 0,
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-primary/60 font-medium italic">
                    <span>Laba Bersih Estimasi</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartAreaInteractive
              title="Tren Transaksi"
              description="Perbandingan Penjualan vs Pembelian harian"
              data={dailySummary}
              config={{
                totalSales: {
                  label: "Penjualan",
                  color: "var(--chart-1)",
                },
                totalPurchases: {
                  label: "Pembelian",
                  color: "var(--destructive)",
                },
              }}
            />
          </div>
          <div>
            <ReportPieChart
              data={topProducts}
              title="Kontribusi Produk"
              description="5 Produk terlaris berdasarkan revenue"
            />
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 shadow-md pt-0 gap-0">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="flex items-center justify-between pt-6">
                <div className="flex items-center gap-2">
                  <ChartBar className="h-5 w-5 text-primary" />
                  <span>Produk Terlaris</span>
                </div>
                <PieChartIcon className="h-4 w-4 text-muted-foreground/40" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="py-4 pl-6">Produk</TableHead>
                    <TableHead className="text-right py-4">
                      Qty Terjual
                    </TableHead>
                    <TableHead className="text-right py-4 pr-6">
                      Revenue
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportQuery.isLoading ? (
                    [...Array(4)].map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell colSpan={3} className="py-4 px-6">
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : topProducts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-10 text-muted-foreground italic"
                      >
                        Belum ada data produk terlaris pada rentang tanggal ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    topProducts.map((item) => (
                      <TableRow
                        key={item.productId}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <TableCell className="font-medium py-4 pl-6">
                          {item.productName}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.qtySold}
                        </TableCell>
                        <TableCell className="text-right py-4 pr-6 text-primary font-bold">
                          {formatCurrency(item.revenue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-md h-fit pt-0 gap-0">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="flex items-center gap-2 pt-6">
                <Wallet className="h-5 w-5 text-primary" />
                Ringkasan Cashflow
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between group">
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  Penjualan
                </span>
                <span className="font-bold text-emerald-600">
                  {formatCurrency(summary?.totalSales ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between group">
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  Pembelian
                </span>
                <span className="font-bold text-rose-600">
                  -{formatCurrency(summary?.totalPurchases ?? 0)}
                </span>
              </div>
              <div className="my-2 border-t border-dashed" />
              <div className="flex items-center justify-between py-2">
                <span className="font-semibold">Net Flow</span>
                <Badge
                  variant={netFlow >= 0 ? "default" : "destructive"}
                  className={cn(
                    "px-3 py-1 text-sm font-bold shadow-sm",
                    netFlow >= 0 ? "bg-emerald-500 hover:bg-emerald-600" : "",
                  )}
                >
                  {formatCurrency(netFlow)}
                </Badge>
              </div>
              <div className="pt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-muted-foreground mb-1">TX Sales</p>
                  <p className="font-bold text-lg">
                    {summary?.totalSalesTransactions ?? 0}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-muted-foreground mb-1">TX Purchase</p>
                  <p className="font-bold text-lg">
                    {summary?.totalPurchaseTransactions ?? 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
