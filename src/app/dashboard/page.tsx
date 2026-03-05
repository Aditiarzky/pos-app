"use client";

import { CardBg } from "@/assets/card-background/card-bg";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardSummary } from "@/hooks/dashboard/use-dashboard-summary";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { IconLayout, IconLayoutDashboard } from "@tabler/icons-react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  ShoppingCart,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { ReactNode } from "react";

const calculateGrowth = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const GrowthBadge = ({ value }: { value: number }) => {
  const isPositive = value >= 0;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium gap-1",
        isPositive
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
          : "border-rose-500/30 bg-rose-500/10 text-rose-600",
      )}
    >
      {isPositive ? (
        <ArrowUpRight className="h-3.5 w-3.5" />
      ) : (
        <ArrowDownRight className="h-3.5 w-3.5" />
      )}
      {Math.abs(value).toFixed(1)}%
    </Badge>
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
  color: "primary" | "emerald" | "blue" | "rose";
  isCurrency?: boolean;
}) => {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600",
    blue: "bg-blue-500/10 text-blue-600",
    rose: "bg-rose-500/10 text-rose-600",
  };

  return (
    <Card className="relative overflow-hidden border-none shadow-md">
      <CardBg />
      <CardHeader className="pb-2 z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          {title}
          <div className={cn("rounded-lg p-2", colorMap[color])}>{icon}</div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 z-10 space-y-2">
        <p className="text-2xl font-bold text-primary">
          {isCurrency ? formatCurrency(value) : formatNumber(value)}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">vs bulan lalu</p>
          <GrowthBadge value={growth} />
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

  const kpiData = summary
    ? [
        {
          title: "Total Sales Bulan Ini",
          value: summary.totalSalesMonth,
          growth: calculateGrowth(
            summary.totalSalesMonth,
            summary.prevTotalSalesMonth,
          ),
          icon: <ShoppingCart className="h-4 w-4" />,
          color: "primary" as const,
        },
        {
          title: "Total Profit Bulan Ini",
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

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {dashboardQuery.isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="p-4 space-y-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-36" />
                  <Skeleton className="h-5 w-24" />
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

        <section className="flex flex-col gap-4">
          <div className="w-full">
            <ChartAreaInteractive
              data={salesTrend}
              config={{
                totalSales: {
                  label: "Penjualan",
                  color: "var(--chart-1)", // ini yang bikin warna keluar + responsive
                },
              }}
              title="Tren Penjualan 30 Hari Terakhir"
              description="Daily Sales"
              showTimeRange={false}
            />
          </div>
          <div>
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
                  <>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">
                        Stok di bawah minimum
                      </p>
                      {alerts?.lowStockProducts?.length ? (
                        <ul className="space-y-2">
                          {alerts.lowStockProducts.map((product) => (
                            <li
                              key={product.productId}
                              className="group relative flex items-center gap-3 overflow-hidden rounded-xl border bg-card p-2 pr-3 transition-all hover:bg-accent/50 hover:shadow-sm"
                            >
                              {/* Container Gambar - Dibuat aspek rasio kotak agar presisi */}
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                                <Image
                                  src={product.image}
                                  alt={product.productName}
                                  fill // Menggunakan fill agar gambar pas di dalam box 12x12
                                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                                  sizes="48px"
                                />
                              </div>

                              {/* Info Produk - Menggunakan flex-1 agar teks mengambil sisa ruang */}
                              <div className="flex flex-1 flex-col min-w-0">
                                <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                                  {product.productName}
                                </span>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                  ID: {product.productId}{" "}
                                </p>
                              </div>

                              {/* Status Stok - Badge dengan styling yang lebih tegas */}
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
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Tidak ada stok kritis saat ini.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">
                        Daftar Piutang Belum Lunas
                      </p>
                      {alerts?.unpaidDebts?.length ? (
                        <ul className="space-y-2">
                          {alerts.unpaidDebts.map((debt) => (
                            <li
                              key={debt.debtId}
                              className="rounded-lg border p-2.5 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">
                                  {debt.customerName}
                                </span>
                                <Badge variant="outline">
                                  {debt.ageDays} hari
                                </Badge>
                              </div>
                              <p className="text-rose-600 font-semibold">
                                {formatCurrency(debt.remainingAmount)}
                              </p>
                            </li>
                          ))}
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
          </div>
        </section>
      </main>
    </div>
  );
}
