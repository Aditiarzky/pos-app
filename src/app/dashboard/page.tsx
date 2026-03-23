"use client";
import { CardBg } from "@/assets/card-background/card-bg";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertSkeleton, DashboardSummarySkeleton } from "@/components/ui/loading";
import { useDashboardSummary } from "@/hooks/dashboard/use-dashboard-summary";
import { fillDailyGaps } from "@/lib/chart-utils";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowRight,
  CircleDollarSign,
  CreditCard,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { format, subDays } from "date-fns";

// Maksimal item yang ditampilkan di alert sebelum tombol "Lihat selengkapnya"
const ALERT_DISPLAY_LIMIT = 5;

const calculateGrowth = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const GrowthBadge = ({ value }: { value: number }) => {
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

const KpiCard = ({
  title,
  value,
  growth,
  icon,
  color,
  isCurrency = true,
}: {
  title: string;
  value: number;
  growth: number;
  icon: ReactNode;
  color: "primary" | "emerald" | "blue" | "rose" | "amber";
  isCurrency?: boolean;
}) => {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600",
    blue: "bg-blue-500/10 text-blue-600",
    rose: "bg-rose-500/10 text-rose-600",
    amber: "bg-amber-500/10 text-amber-600",
  };
  return (
    <Card className="relative overflow-hidden border-none shadow-md">
      <CardBg />
      <CardHeader className="pb-2 z-10">
        <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
          {title}
          <div className={cn("p-2 rounded-lg", colorMap[color])}>{icon}</div>
        </CardTitle>
      </CardHeader>
      <CardContent className="z-10 pt-0">
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold flex items-baseline gap-1 text-primary">
              {isCurrency && (
                <span className="text-sm font-medium text-muted-foreground">
                  Rp
                </span>
              )}
              <AnimatedNumber value={value} />
            </div>
            <GrowthBadge value={growth} />
          </div>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground font-medium">
            vs bulan lalu
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const dashboardQuery = useDashboardSummary();
  const summary = dashboardQuery.data?.data?.summary;
  const salesTrend = dashboardQuery.data?.data?.salesTrend ?? [];
  const alerts = dashboardQuery.data?.data?.alerts;

  const today = new Date();
  const endDate = format(today, "yyyy-MM-dd");
  const startDate = format(subDays(today, 29), "yyyy-MM-dd");

  // fillDailyGaps dari @/lib/chart-utils — sudah handle range 1 hari (min 2 titik)
  const filledSalesTrend = fillDailyGaps(
    salesTrend,
    startDate,
    endDate,
    ["totalSales"],
  ) as Array<{ date: string;[key: string]: string | number }>;

  const lowStockProducts = alerts?.lowStockProducts ?? [];
  const unpaidDebts = alerts?.unpaidDebts ?? [];

  // Batasi tampilan — sisanya diakses via tombol "Lihat selengkapnya"
  const visibleLowStock = lowStockProducts.slice(0, ALERT_DISPLAY_LIMIT);
  const visibleDebts = unpaidDebts.slice(0, ALERT_DISPLAY_LIMIT);
  const hasMoreLowStock = lowStockProducts.length > ALERT_DISPLAY_LIMIT;
  const hasMoreDebts = unpaidDebts.length > ALERT_DISPLAY_LIMIT;

  const kpiData = summary
    ? [
      {
        title: "Omset Bulan Ini",
        value: summary.totalSalesMonth,
        growth: calculateGrowth(
          summary.totalSalesMonth,
          summary.prevTotalSalesMonth,
        ),
        icon: <ShoppingCart className="h-4 w-4" />,
        color: "primary" as const,
      },
      {
        title: "Laba Kotor Bulan Ini",
        value: summary.totalProfitMonth,
        growth: calculateGrowth(
          summary.totalProfitMonth,
          summary.prevTotalProfitMonth,
        ),
        icon: <CircleDollarSign className="h-4 w-4" />,
        color: "emerald" as const,
      },
      {
        title: "Total Transaksi Bulan Ini",
        value: summary.totalTransactionsMonth,
        growth: calculateGrowth(
          summary.totalTransactionsMonth,
          summary.prevTotalTransactionsMonth,
        ),
        icon: <CreditCard className="h-4 w-4" />,
        color: "blue" as const,
        asNumber: true,
      },
      {
        title: "Total Piutang Aktif",
        value: summary.totalActiveDebt,
        growth: calculateGrowth(
          summary.totalActiveDebt,
          summary.prevTotalActiveDebt,
        ),
        icon: <Wallet className="h-4 w-4" />,
        color: "rose" as const,
      },
    ]
    : [];

  return (
    <div className="container mx-auto space-y-4">
      <header className="sticky top-6 mx-auto container z-10 flex flex-row px-4 justify-between w-full items-center gap-4 pb-16">
        <div className="overflow-hidden flex gap-2">
          <span className="w-2 bg-primary" />
          <div className="flex flex-col">
            <h1 className="text-2xl text-primary font-geist font-semibold truncate">
              Beranda
            </h1>
            <p className="text-sm text-muted-foreground">
              Ringkasan kondisi bisnis anda
            </p>
          </div>
        </div>
      </header>

      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t">
        {dashboardQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Gagal memuat dashboard</AlertTitle>
            <AlertDescription>
              Terjadi kendala saat mengambil data ringkasan. Silakan coba
              beberapa saat lagi.
            </AlertDescription>
          </Alert>
        ) : null}

        {/* KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {dashboardQuery.isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="p-4 space-y-3">
                <DashboardSummarySkeleton />
              </Card>
            ))
            : kpiData.map((item) => (
              <KpiCard
                key={item.title}
                title={item.title}
                value={item.value}
                growth={item.growth}
                icon={item.icon}
                color={item.color}
                isCurrency={!item.asNumber}
              />
            ))}
        </section>

        {/* Chart & Alerts */}
        <section className="flex flex-col gap-4">
          <div className="w-full">
            <ChartAreaInteractive
              data={filledSalesTrend}
              config={{
                totalSales: {
                  label: "Omset",
                  color: "var(--chart-1)",
                },
              }}
              title="Tren Omset 30 Hari Terakhir"
              description="Omset Harian"
              showTimeRange={false}
            />
          </div>

          {/* Business Alerts */}
          <Card className="xl:col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Business Alerts
                <Badge variant="destructive" className="gap-1">
                  <TriangleAlert className="h-3.5 w-3.5" /> Prioritas
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardQuery.isLoading ? (
                <AlertSkeleton />
              ) : (
                <>
                  {/* ── Stok di bawah minimum ── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        Stok di bawah minimum
                      </p>
                      {lowStockProducts.length > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-destructive/30 text-destructive bg-destructive/5"
                        >
                          {lowStockProducts.length} produk
                        </Badge>
                      )}
                    </div>

                    {visibleLowStock.length ? (
                      <ul className="space-y-2">
                        {visibleLowStock.map((product) => (
                          <li
                            key={product.productId}
                          >
                            <Link
                              href="/dashboard/products"
                              className="flex gap-2 rounded-lg border p-2.5 text-xs hover:bg-muted/30 transition-colors"
                            >
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                                <Image
                                  src={product.image}
                                  alt={product.productName}
                                  fill
                                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                                  sizes="48px"
                                />
                              </div>
                              <div className="flex flex-1 flex-col min-w-0">
                                <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                                  {product.productName}
                                </span>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                  ID: {product.productId}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge
                                  variant="outline"
                                  className="font-mono text-[11px] font-bold border-destructive/30 bg-destructive/5"
                                >
                                  {formatNumber(product.stock)} /{" "}
                                  {formatNumber(product.minStock)}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  Stok Sisa
                                </span>
                              </div>
                            </Link>
                          </li>
                        ))}

                        {hasMoreLowStock && (
                          <li>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full h-9 text-xs text-muted-foreground hover:text-primary border border-dashed gap-1.5"
                              asChild
                            >
                              <Link href="/dashboard/products">
                                Lihat{" "}
                                {lowStockProducts.length - ALERT_DISPLAY_LIMIT}{" "}
                                produk lainnya
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Tidak ada stok kritis saat ini.
                      </p>
                    )}
                  </div>

                  {/* ── Piutang belum lunas ── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        Daftar Piutang Belum Lunas
                      </p>
                      {unpaidDebts.length > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-amber-300 text-amber-700 bg-amber-50"
                        >
                          {unpaidDebts.length} pelanggan
                        </Badge>
                      )}
                    </div>

                    {visibleDebts.length ? (
                      <ul className="space-y-2">
                        {visibleDebts.map((debt) => (
                          <li
                            key={debt.debtId}
                          >
                            <Link
                              href="/dashboard/sales?tab=history-sales"
                              className="block rounded-lg border p-2.5 text-xs hover:bg-muted/30 transition-colors"
                            >
                              {/* Baris 1: nama pelanggan + umur hutang */}
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-sm truncate">
                                  {debt.customerName}
                                </span>
                                <Badge variant="outline" className="shrink-0 text-[10px]">
                                  {debt.ageDays} hari
                                </Badge>
                              </div>
                              {/* Baris 2: nomor invoice sebagai referensi */}
                              <p className="text-[11px] text-muted-foreground font-mono">
                                {debt.invoiceNumber}
                              </p>
                              {/* Baris 3: sisa tagihan vs total awal */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <span>{debt.originalAmount !== debt.remainingAmount ? "Sisa" : "Hutang"}</span>
                                  <span className="font-semibold text-rose-600">
                                    {formatCurrency(debt.remainingAmount)}
                                  </span>
                                </div>
                                {debt.originalAmount !== debt.remainingAmount && (
                                  <span className="text-[10px] text-muted-foreground">
                                    dari {formatCurrency(debt.originalAmount)}
                                  </span>
                                )}
                              </div>
                            </Link>
                          </li>
                        ))}

                        {hasMoreDebts && (
                          <li>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full h-9 text-xs text-muted-foreground hover:text-primary border border-dashed gap-1.5"
                              asChild
                            >
                              <Link href="/dashboard/sales?tab=history-sales">
                                Lihat{" "}
                                {unpaidDebts.length - ALERT_DISPLAY_LIMIT}{" "}
                                piutang lainnya
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Tidak ada piutang belum lunas.
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
