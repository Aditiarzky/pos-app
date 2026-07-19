"use client";
import { CardBg } from "@/assets/card-background/card-bg";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertSkeleton,
  DashboardSummarySkeleton,
} from "@/components/ui/loading";
import { useDashboardSummary } from "@/hooks/dashboard/use-dashboard-summary";
import { useAuth } from "@/hooks/use-auth";
import { fillDailyGaps } from "@/lib/chart-utils";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  buildLowStockAlertHref,
  buildUnpaidDebtAlertHref,
} from "@/lib/business-alert-routes";
import { BUSINESS_TERMS } from "@/lib/business-terms";
import {
  AlertCircle,
  ArrowRight,
  CircleDollarSign,
  CreditCard,
  PackageSearch,
  ReceiptText,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Users,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { format, subDays } from "date-fns";
import { RoleGuard } from "@/components/role-guard";
import { AccessDenied } from "@/components/access-denied";

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

// Card operasional (bukan KPI finansial). Status "bisa ditindaklanjuti atau
// tidak" dikomunikasikan lewat affordance visual (hover, ikon panah, gaya
// border), bukan lewat kalimat penjelas — supaya tidak terasa canggung
// menegur user soal wewenangnya.
const OperationalCard = ({
  title,
  value,
  icon,
  description,
  href,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  description: string;
  href?: string;
}) => {
  const isActionable = Boolean(href);

  const iconBadge = (
    <div
      className={cn(
        "p-2 rounded-lg",
        isActionable
          ? "bg-blue-500/10 text-blue-600"
          : "bg-muted text-muted-foreground",
      )}
    >
      {icon}
    </div>
  );

  const content = (
    <>
      <CardHeader className="pb-2 z-10">
        <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
          {title}
          {iconBadge}
        </CardTitle>
      </CardHeader>
      <CardContent className="z-10 pt-0 space-y-1">
        <div className="text-2xl font-bold text-primary">
          <AnimatedNumber value={value} />
        </div>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </CardContent>
    </>
  );

  if (isActionable) {
    return (
      <Link href={href!} className="group block rounded-xl">
        <Card className="relative overflow-hidden border-none shadow-md transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary/40">
          <CardBg />
          <ArrowRight className="absolute right-3 top-3 z-10 h-3.5 w-3.5 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
          {content}
        </Card>
      </Link>
    );
  }

  return (
    <Card className="relative overflow-hidden border border-dashed shadow-none bg-muted/10">
      {content}
    </Card>
  );
};

export default function DashboardPage() {
  const dashboardQuery = useDashboardSummary();
  const { roles } = useAuth();
  const summary = dashboardQuery.data?.data?.summary;
  const salesTrend = dashboardQuery.data?.data?.salesTrend ?? [];
  const alerts = dashboardQuery.data?.data?.alerts;
  const isSystemAdmin = roles.includes("admin sistem");

  const today = new Date();
  const endDate = format(today, "yyyy-MM-dd");
  const startDate = format(subDays(today, 29), "yyyy-MM-dd");

  // fillDailyGaps dari @/lib/chart-utils — sudah handle range 1 hari (min 2 titik)
  const filledSalesTrend = fillDailyGaps(salesTrend, startDate, endDate, [
    "totalSales",
  ]) as Array<{ date: string;[key: string]: string | number }>;

  const lowStockProducts = alerts?.lowStockProducts ?? [];
  const unpaidDebts = alerts?.unpaidDebts ?? [];

  // Batasi tampilan — sisanya diakses via tombol "Lihat selengkapnya"
  const visibleLowStock = lowStockProducts.slice(0, ALERT_DISPLAY_LIMIT);
  const visibleDebts = unpaidDebts.slice(0, ALERT_DISPLAY_LIMIT);
  const hasMoreLowStock = lowStockProducts.length > ALERT_DISPLAY_LIMIT;
  const hasMoreDebts = unpaidDebts.length > ALERT_DISPLAY_LIMIT;

  // Card operasional disesuaikan per role — jangan tampilkan angka yang
  // sudah ada di KPI row (khusus admin sistem) supaya tidak dobel, dan
  // jangan tampilkan card kalkulasi turunan yang tidak actionable.
  const operationalData = [
    // "Transaksi Bulan Ini" hanya relevan untuk admin toko, karena admin
    // sistem sudah melihat angka yang sama di KPI row ("Total Transaksi
    // Bulan Ini").
    ...(!isSystemAdmin
      ? [
        {
          title: "Transaksi Bulan Ini",
          value: summary?.totalTransactionsMonth ?? 0,
          icon: <ReceiptText className="h-4 w-4" />,
          description: "Total transaksi kasir berjalan",
          href: "/dashboard/sales",
        },
      ]
      : []),
    // Produk Stok Kritis hanya untuk admin sistem — mereka yang berwenang
    // restock. Admin toko sudah dapat sinyal stok rendah secara real-time
    // lewat badge status stok di pencarian produk kasir, jadi menampilkan
    // ulang ringkasannya di dashboard cuma pengulangan info tanpa guna baru.
    ...(isSystemAdmin
      ? [
        {
          title: "Produk Stok Kritis",
          value: lowStockProducts.length,
          icon: <PackageSearch className="h-4 w-4" />,
          description: "Perlu restock prioritas",
          href: "/dashboard/products?filter=low",
        },
      ]
      : []),
    {
      title: "Piutang Aktif",
      value: unpaidDebts.length,
      icon: <Users className="h-4 w-4" />,
      description: "Perlu tindak lanjut tagihan",
      href: "/dashboard/sales?tab=history-sales&status=debt",
    },
  ];

  const kpiData = summary
    ? [
      {
        title: `${BUSINESS_TERMS.revenueShort} Bulan Ini`,
        value: summary.totalSalesMonth,
        growth: calculateGrowth(
          summary.totalSalesMonth,
          summary.prevTotalSalesMonth,
        ),
        icon: <ShoppingCart className="h-4 w-4" />,
        color: "primary" as const,
      },
      {
        title: `${BUSINESS_TERMS.grossProfit} Bulan Ini`,
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
        title: `Total ${BUSINESS_TERMS.receivables} Aktif`,
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

  // Kedua role sekarang selalu punya 2 card operasional (beda konten,
  // sama jumlah), jadi grid-nya konsisten tanpa perlu logic dinamis.
  const operationalGridClass = "grid grid-cols-1 md:grid-cols-2 gap-4";

  return (
    <RoleGuard
      allowedRoles={["admin toko", "admin sistem"]}
      fallback={<AccessDenied />}
    >
      <div className="container mx-auto space-y-4">
        <header className="sticky top-6 mx-auto container z-10 flex flex-row px-4 sm:px-6 justify-between w-full items-center gap-4 pb-16">
          <div className="flex items-center gap-4">
            <div className="h-12 w-1.5 bg-primary rounded-app-pill shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
            <div className="flex flex-col">
              <h1 className="text-3xl text-primary font-bold tracking-tight">
                Beranda
              </h1>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-80">
                Ringkasan Kondisi Bisnis • Analitik Harian
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

          {isSystemAdmin ? (
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
          ) : null}

          <section className={operationalGridClass}>
            {dashboardQuery.isLoading
              ? Array.from({ length: 2 }).map(
                (_, index) => (
                  <Card
                    key={`operational-${index}`}
                    className="p-4 space-y-3"
                  >
                    <DashboardSummarySkeleton />
                  </Card>
                ),
              )
              : operationalData.map((item) => (
                <OperationalCard key={item.title} {...item} />
              ))}
          </section>

          {/* Chart & Alerts */}
          <section className="flex flex-col gap-4">
            {isSystemAdmin ? (
              <div className="w-full">
                <ChartAreaInteractive
                  data={filledSalesTrend}
                  config={{
                    totalSales: {
                      label: BUSINESS_TERMS.revenueShort,
                      color: "var(--chart-1)",
                    },
                  }}
                  title={`Tren ${BUSINESS_TERMS.revenueShort} 30 Hari Terakhir`}
                  description={`${BUSINESS_TERMS.revenueShort} Harian`}
                  showTimeRange={false}
                />
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Fokus Operasional</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link
                    href="/dashboard/sales"
                    className="rounded-app-lg border p-3 hover:bg-muted/30 transition-colors"
                  >
                    <p className="text-sm font-semibold">Kasir & Transaksi</p>
                    <p className="text-xs text-muted-foreground">
                      Input transaksi, cek histori, dan proses retur.
                    </p>
                  </Link>
                  <Link
                    href="/dashboard/sales?tab=history-sales"
                    className="rounded-app-lg border p-3 hover:bg-muted/30 transition-colors"
                  >
                    <p className="text-sm font-semibold">Piutang & Tagihan</p>
                    <p className="text-xs text-muted-foreground">
                      Cek pelanggan yang belum lunas dan tindak lanjuti.
                    </p>
                  </Link>
                  <Link
                    href="/dashboard/notifications"
                    className="rounded-app-lg border p-3 hover:bg-muted/30 transition-colors md:col-span-2"
                  >
                    <p className="text-sm font-semibold">Notifikasi</p>
                    <p className="text-xs text-muted-foreground">
                      Tindak lanjuti alert operasional prioritas.
                    </p>
                  </Link>
                </CardContent>
              </Card>
            )}

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
              <CardContent
                className={cn(
                  "grid grid-cols-1 gap-4",
                  isSystemAdmin && "md:grid-cols-2",
                )}
              >
                {dashboardQuery.isLoading ? (
                  <AlertSkeleton />
                ) : (
                  <>
                    {/* ── Stok di bawah minimum — khusus admin sistem, karena
                        hanya mereka yang berwenang menindaklanjuti (restock).
                        Admin toko sudah dapat sinyal ini secara real-time di
                        layar kasir saat mencari produk. ── */}
                    {isSystemAdmin && (
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
                              <li key={product.productId}>
                                <Link
                                  href={buildLowStockAlertHref(product)}
                                  className="flex gap-2 rounded-app-lg border p-2.5 text-xs hover:bg-muted/30 transition-colors"
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
                                    {lowStockProducts.length -
                                      ALERT_DISPLAY_LIMIT}{" "}
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
                    )}

                    {/* ── Piutang belum lunas — relevan untuk kedua role,
                        karena siapa pun yang melayani pelanggan wajar untuk
                        tahu & mengingatkan soal tagihan yang belum lunas. ── */}
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
                            <li key={debt.debtId}>
                              <Link
                                href={buildUnpaidDebtAlertHref(debt)}
                                className="block rounded-app-lg border p-2.5 text-xs hover:bg-muted/30 transition-colors"
                              >
                                {/* Baris 1: nama pelanggan + umur hutang */}
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-sm truncate">
                                    {debt.customerName}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="shrink-0 text-[10px]"
                                  >
                                    {debt.ageDays} hari
                                  </Badge>
                                </div>
                                {/* Baris 2: nomor invoice sebagai referensi */}
                                <p className="text-[11px] text-muted-foreground font-mono">
                                  {debt.invoiceNumber}
                                </p>
                                {/* Baris 3: sisa tagihan vs total awal */}
                                <div className="flex items-center justify-between gap-2">
                                  {isSystemAdmin ? (
                                    <>
                                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                        <span>
                                          {debt.originalAmount !==
                                            debt.remainingAmount
                                            ? "Sisa"
                                            : "Hutang"}
                                        </span>
                                        <span className="font-semibold text-rose-600">
                                          {formatCurrency(debt.remainingAmount)}
                                        </span>
                                      </div>
                                      {debt.originalAmount !==
                                        debt.remainingAmount && (
                                          <span className="text-[10px] text-muted-foreground">
                                            dari{" "}
                                            {formatCurrency(debt.originalAmount)}
                                          </span>
                                        )}
                                    </>
                                  ) : (
                                    <span className="text-[11px] text-muted-foreground">
                                      Tagihan perlu ditindaklanjuti
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
                                <Link href="/dashboard/sales?tab=history-sales&status=debt">
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
    </RoleGuard>
  );
}
