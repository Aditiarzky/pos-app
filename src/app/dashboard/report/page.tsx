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
  BarChart3,
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ShoppingCart,
  Receipt,
  CircleDollarSign,
  PieChart as PieChartIcon,
  Printer,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import {
  ChartAreaInteractive,
} from "@/components/chart-area-interactive";
import { ReportPieChart } from "./_components/report-pie-chart";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { CardBg } from "@/assets/card-background/card-bg";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";
import { id } from "date-fns/locale";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { fillDailyGaps, ChartData as _ChartDataUtil } from "@/lib/chart-utils";
import { StickyCardStack } from "@/components/ui/sticky-card-wrapper";
import { NetProfitBreakdown, ReportSummary } from "@/services/reportService";

// ── Filter options ────────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { label: "Hari Ini", value: "today" },
  { label: "Kemarin", value: "yesterday" },
  { label: "7 Hari", value: "7d" },
  { label: "30 Hari", value: "30d" },
  { label: "Bulan Ini", value: "thisMonth" },
  { label: "Bulan Lalu", value: "lastMonth" },
  { label: "Tahun Ini", value: "thisYear" },
  { label: "Kustom", value: "custom" },
];

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getRangeFromOption = (option: string) => {
  const now = new Date();
  let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (option) {
    case "today": break;
    case "yesterday":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      break;
    case "7d":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case "30d":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      break;
    case "thisMonth":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "lastMonth":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case "thisYear":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case "custom":
      return null;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { startDate: formatLocalDate(start), endDate: formatLocalDate(end) };
};

const getDefaultDateFilter = () => getRangeFromOption("thisMonth")!;

const calcChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// fillDailyGaps diimpor dari @/lib/chart-utils — sudah handle range 1 hari

// ── Sub-components ────────────────────────────────────────────────────────────

const PercentageBadge = ({ value }: { value: number }) => {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <div className={cn(
      "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
      isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600",
    )}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </div>
  );
};

// ── Print components ──────────────────────────────────────────────────────────

const PrintHeader = ({ startDate, endDate, filterLabel }: {
  startDate: string; endDate: string; filterLabel: string;
}) => (
  <div className="hidden print:flex items-start justify-between mb-8 pb-5 border-b-2 border-gray-800">
    <div>
      <h1 className="text-xl font-bold text-gray-900">Laporan Keuangan</h1>
      <p className="text-sm text-gray-500 mt-1">
        Periode: <strong>{filterLabel}</strong> &nbsp;({startDate} s/d {endDate})
      </p>
    </div>
    <div className="text-right text-xs text-gray-400">
      <p>Dicetak pada</p>
      <p className="font-semibold text-gray-600">
        {format(new Date(), "d MMMM yyyy, HH:mm", { locale: id })}
      </p>
    </div>
  </div>
);

const PrintSummaryTable = ({ summary, netFlow }: {
  summary: ReportSummary | undefined;
  netFlow: number;
}) => {
  if (!summary) return null;
  const rows = [
    { label: "Total Pendapatan (Omset)", value: formatCurrency(summary.totalSales), prev: formatCurrency(summary.prevTotalSales ?? 0), note: `${summary.totalSalesTransactions} transaksi penjualan` },
    { label: "Total Pembelian", value: formatCurrency(summary.totalPurchases), prev: formatCurrency(summary.prevTotalPurchases ?? 0), note: `${summary.totalPurchaseTransactions} transaksi pembelian` },
    { label: "Arus Kas Bersih", value: formatCurrency(netFlow), prev: "—", note: "Pendapatan − Pembelian", bold: true },
    { label: "Laba Kotor", value: formatCurrency(summary.grossProfit), prev: formatCurrency(summary.prevGrossProfit ?? 0), note: "Pendapatan − HPP", bold: true },
    { label: "Biaya Operasional", value: `−${formatCurrency(summary.totalOperationalCost)}`, prev: "—", note: "Dinormalisasi ke periode ini" },
    { label: "Pajak", value: `−${formatCurrency(summary.totalTax)}`, prev: "—", note: "Semua pajak aktif" },
    { label: "Laba Bersih", value: formatCurrency(summary.netProfit), prev: "—", note: "Laba Kotor − Biaya Ops − Pajak", bold: true },
    { label: "Jumlah Transaksi", value: String(summary.totalTransactions), prev: String(summary.prevTotalTransactions ?? 0), note: "Penjualan + pembelian" },
  ];
  return (
    <div className="hidden print:block mb-8 break-inside-avoid">
      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 pb-1 border-b border-gray-300">
        Ikhtisar Keuangan
      </h2>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Metrik</th>
            <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-gray-700">Periode Ini</th>
            <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-gray-700">Periode Lalu</th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={row.bold ? "bg-gray-50 font-semibold" : i % 2 !== 0 ? "bg-white" : ""}>
              <td className="border border-gray-300 px-3 py-2 text-gray-800">{row.label}</td>
              <td className="border border-gray-300 px-3 py-2 text-right tabular-nums text-gray-900">{row.value}</td>
              <td className="border border-gray-300 px-3 py-2 text-right tabular-nums text-gray-500">{row.prev}</td>
              <td className="border border-gray-300 px-3 py-2 text-xs text-gray-500">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const PrintProductsTable = ({ products }: {
  products: { productId: number; productName: string; qtySold: number; revenue: number; grossProfit: number }[];
}) => {
  if (!products.length) return null;
  return (
    <div className="hidden print:block mt-6 break-inside-avoid">
      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 pb-1 border-b border-gray-300">
        Produk Terlaris
      </h2>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700 w-8">#</th>
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Produk</th>
            <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-gray-700">Qty</th>
            <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-gray-700">Pendapatan</th>
            <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-gray-700">Laba Kotor</th>
          </tr>
        </thead>
        <tbody>
          {products.map((item, i) => (
            <tr key={item.productId} className={i % 2 !== 0 ? "bg-gray-50" : ""}>
              <td className="border border-gray-300 px-3 py-2 text-center text-gray-500">{i + 1}</td>
              <td className="border border-gray-300 px-3 py-2 text-gray-800 font-medium">{item.productName}</td>
              <td className="border border-gray-300 px-3 py-2 text-right tabular-nums">{item.qtySold}</td>
              <td className="border border-gray-300 px-3 py-2 text-right tabular-nums font-semibold">{formatCurrency(item.revenue)}</td>
              <td className="border border-gray-300 px-3 py-2 text-right tabular-nums">{formatCurrency(item.grossProfit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Net Profit Breakdown Card ─────────────────────────────────────────────────

function NetProfitCard({
  summary,
  breakdown,
  isLoading,
}: {
  summary: ReportSummary | undefined;
  breakdown: NetProfitBreakdown | undefined;
  isLoading: boolean;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const grossProfit = summary.grossProfit ?? 0;
  const totalOperationalCost = summary.totalOperationalCost ?? 0;
  const totalTax = summary.totalTax ?? 0;
  const netProfit = summary.netProfit ?? 0;

  const rows = [
    {
      label: "Laba Kotor",
      value: grossProfit,
      color: "text-emerald-600",
      prefix: "",
      note: "Pendapatan − HPP",
    },
    {
      label: "Biaya Operasional",
      value: totalOperationalCost,
      color: "text-rose-500",
      prefix: "−",
      note: `${breakdown?.operationalCosts?.length ?? 0} pos biaya`,
    },
    {
      label: "Pajak",
      value: totalTax,
      color: "text-rose-500",
      prefix: "−",
      note: `${breakdown?.taxes?.length ?? 0} jenis pajak`,
    },
  ];

  return (
    <Card className="shadow-md border border-border/60 pt-0 gap-0">
      <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b py-4 px-5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CircleDollarSign className="h-4 w-4 text-emerald-600" />
          Kalkulasi Laba Bersih
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        {/* Formula rows */}
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium">{row.label}</p>
              <p className="text-[11px] text-muted-foreground">{row.note}</p>
            </div>
            <span className={cn("font-bold text-sm tabular-nums shrink-0", row.color)}>
              {row.prefix}{formatCurrency(row.value)}
            </span>
          </div>
        ))}

        {/* Divider & result */}
        <div className="border-t border-dashed pt-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Laba Bersih</p>
              <p className="text-[11px] text-muted-foreground">Estimasi setelah semua potongan</p>
            </div>
            <Badge
              variant={netProfit >= 0 ? "default" : "destructive"}
              className={cn(
                "px-3 py-1 text-sm font-bold tabular-nums",
                netProfit >= 0 ? "bg-emerald-600 hover:bg-emerald-700" : "",
              )}
            >
              {formatCurrency(netProfit)}
            </Badge>
          </div>
        </div>

        {/* Breakdown collapsible */}
        {breakdown && (breakdown.operationalCosts.length > 0 || breakdown.taxes.length > 0) && (
          <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                {showBreakdown ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showBreakdown ? "Sembunyikan detail" : "Lihat detail potongan"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {/* Biaya operasional */}
              {breakdown.operationalCosts.length > 0 && (
                <div className="rounded-lg border bg-muted/20 overflow-hidden">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-2 border-b">
                    Biaya Operasional
                  </p>
                  {breakdown.operationalCosts.map((cost) => (
                    <div key={cost.id} className="flex items-center justify-between px-3 py-1.5 border-b last:border-0">
                      <span className="text-xs text-muted-foreground truncate max-w-[60%]">{cost.name}</span>
                      <span className="text-xs font-semibold text-rose-500 tabular-nums shrink-0">
                        −{formatCurrency(cost.normalizedAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {/* Pajak */}
              {breakdown.taxes.length > 0 && (
                <div className="rounded-lg border bg-muted/20 overflow-hidden">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-2 border-b">
                    Pajak
                  </p>
                  {breakdown.taxes.map((tax) => (
                    <div key={tax.id} className="flex items-center justify-between px-3 py-1.5 border-b last:border-0">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{tax.name}</p>
                        {tax.type === "percentage" && tax.rate != null && (
                          <p className="text-[10px] text-muted-foreground/60">
                            {(tax.rate * 100).toFixed(2).replace(/\.?0+$/, "")}%
                            {tax.appliesTo === "revenue" ? " dari omset" : " dari laba kotor"}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-rose-500 tabular-nums shrink-0">
                        −{formatCurrency(tax.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Info jika tidak ada biaya/pajak terkonfigurasi */}
        {(!breakdown || (breakdown.operationalCosts.length === 0 && breakdown.taxes.length === 0)) && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5">
            <Info className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700">
              Belum ada biaya operasional atau pajak yang dikonfigurasi.
              Laba bersih sama dengan laba kotor.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main ReportContent ────────────────────────────────────────────────────────

export function ReportContent() {
  const [selectedFilter, setSelectedFilter] = useState("thisMonth");
  const [appliedFilter, setAppliedFilter] = useState(getDefaultDateFilter());

  const reportQuery = useReports({ params: appliedFilter });

  const handleFilterChange = (option: string) => {
    setSelectedFilter(option);
    const range = getRangeFromOption(option);
    if (range) setAppliedFilter(range);
  };

  const handleCustomDateChange = (start: string, end: string) => {
    if (start && end) setAppliedFilter({ startDate: start, endDate: end });
  };

  const filterLabel = FILTER_OPTIONS.find(o => o.value === selectedFilter)?.label ?? "Kustom";
  const summary = reportQuery.data?.data?.summary;
  const topProducts = reportQuery.data?.data?.topProducts ?? [];
  const breakdown = reportQuery.data?.data?.netProfitBreakdown;

  // Define a local interface that matches the ChartData type expected by ChartAreaInteractive.
  // The diagnostic indicates ChartAreaInteractive requires a 'date' property.
  interface ChartDataForInteractiveChart {
    date: string;
    [key: string]: number | string;
  }

  const dailySummary = useMemo(() => {
    const raw = (reportQuery.data?.data?.daily ?? []) as Record<string, string | number>[];
    // Cast the result of fillDailyGaps to ChartDataForInteractiveChart[]
    // to satisfy the ChartAreaInteractive component's data prop type requirement.
    // This assumes fillDailyGaps already includes a 'date' property in its output.
    return fillDailyGaps(raw, appliedFilter.startDate, appliedFilter.endDate, ["totalSales", "totalPurchases"]) as ChartDataForInteractiveChart[];
  }, [reportQuery.data?.data?.daily, appliedFilter]);

  const netCashFlow = summary?.netCashFlow ?? 0;

  return (
    <>
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: fixed !important; inset: 0 !important; overflow: visible !important; }
          .no-print { display: none !important; }
          .hidden.print\\:block { display: block !important; visibility: visible !important; }
          .hidden.print\\:flex { display: flex !important; visibility: visible !important; }
        }
      `}</style>

      <div className="container mx-auto space-y-4">
        {/* Header */}
        <header className="no-print sticky top-6 mx-auto container z-10 flex flex-row px-4 justify-between w-full items-center gap-4 pb-16">
          <div className="overflow-hidden flex gap-2">
            <span className="w-2 bg-primary" />
            <div className="flex flex-col">
              <h1 className="text-2xl text-primary font-geist font-semibold truncate">Laporan</h1>
              <p className="text-sm text-muted-foreground">Analisis performa bisnis & keuangan</p>
            </div>
          </div>
          <Button
            onClick={() => window.print()}
            variant="outline"
            size="sm"
            className="gap-2 border-primary/20 text-primary hover:bg-primary/5"
            disabled={reportQuery.isLoading}
          >
            <Printer className="h-4 w-4" />
            Cetak
          </Button>
        </header>

        <main
          id="print-area"
          className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t print:shadow-none print:rounded-none print:mt-0 print:p-0 print:border-none print:min-h-0"
        >
          {/* Print-only sections */}
          <PrintHeader startDate={appliedFilter.startDate} endDate={appliedFilter.endDate} filterLabel={filterLabel} />
          <PrintSummaryTable summary={summary} netFlow={netCashFlow} />
          <PrintProductsTable products={topProducts} />

          {/* Filter Bar */}
          <div className="no-print">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Rentang Waktu</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/40 rounded-xl w-fit border border-border/50">
              {FILTER_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedFilter === option.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleFilterChange(option.value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all h-7",
                    selectedFilter === option.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background hover:text-foreground",
                  )}
                >
                  {option.label}
                </Button>
              ))}
              {selectedFilter === "custom" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 gap-2 border-primary/20 bg-primary/5 text-xs font-semibold ml-1">
                      <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                      {appliedFilter.startDate} — {appliedFilter.endDate}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4 flex flex-col gap-4" align="start">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mulai</label>
                        <Input type="date" value={appliedFilter.startDate} onChange={(e) => handleCustomDateChange(e.target.value, appliedFilter.endDate)} className="h-8 text-xs" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sampai</label>
                        <Input type="date" value={appliedFilter.endDate} onChange={(e) => handleCustomDateChange(appliedFilter.startDate, e.target.value)} className="h-8 text-xs" />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          {reportQuery.isError && (
            <Alert variant="destructive" className="no-print">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Gagal memuat laporan</AlertTitle>
              <AlertDescription>Terjadi kesalahan. Coba ulangi beberapa saat lagi.</AlertDescription>
            </Alert>
          )}

          {/* KPI Cards — gaya asli dipertahankan */}
          <div className="no-print">
            <StickyCardStack>
              {/* Card 1: Pendapatan */}
              <Card className="relative overflow-hidden border-none shadow-md text-primary">
                <CardBg />
                <CardHeader className="pb-2 z-10">
                  <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                    Total Pendapatan
                    <div className="p-2 bg-primary/10 rounded-lg"><ShoppingCart className="h-4 w-4 text-primary" /></div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="z-10 pt-0">
                  {reportQuery.isLoading ? <Skeleton className="h-9 w-32" /> : (
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold flex items-baseline gap-1">
                          <span className="text-sm font-medium text-muted-foreground">Rp</span>
                          <AnimatedNumber value={summary?.totalSales || 0} />
                        </div>
                        <PercentageBadge value={calcChange(summary?.totalSales || 0, summary?.prevTotalSales || 0)} />
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1 font-medium">vs periode sebelumnya</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card 2: Pembelian */}
              <Card className="relative overflow-hidden border-none shadow-md text-primary">
                <CardBg />
                <CardHeader className="pb-2 z-10">
                  <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                    Total Pembelian
                    <div className="p-2 bg-amber-500/10 rounded-lg"><Receipt className="h-4 w-4 text-amber-600" /></div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="z-10 pt-0">
                  {reportQuery.isLoading ? <Skeleton className="h-9 w-32" /> : (
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold flex items-baseline gap-1">
                          <span className="text-sm font-medium text-muted-foreground">Rp</span>
                          <AnimatedNumber value={summary?.totalPurchases || 0} />
                        </div>
                        <PercentageBadge value={calcChange(summary?.totalPurchases || 0, summary?.prevTotalPurchases || 0)} />
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1 font-medium">vs periode sebelumnya</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card 3: Transaksi */}
              <Card className="relative overflow-hidden border-none shadow-md text-primary">
                <CardBg />
                <CardHeader className="pb-2 z-10">
                  <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                    Jumlah Transaksi
                    <div className="p-2 bg-blue-500/10 rounded-lg"><ArrowUpRight className="h-4 w-4 text-blue-600" /></div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="z-10 pt-0">
                  {reportQuery.isLoading ? <Skeleton className="h-9 w-20" /> : (
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">
                          <AnimatedNumber value={summary?.totalTransactions || 0} />
                        </div>
                        <PercentageBadge value={calcChange(summary?.totalTransactions || 0, summary?.prevTotalTransactions || 0)} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 font-medium">vs periode sebelumnya</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card 4: Laba Kotor */}
              <Card className="relative overflow-hidden border-none shadow-md bg-muted">
                <CardBg />
                <CardHeader className="pb-2 z-10">
                  <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                    Laba Kotor
                    <div className="p-2 bg-emerald-500/10 rounded-lg"><CircleDollarSign className="h-4 w-4 text-emerald-600" /></div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="z-10 pt-0">
                  {reportQuery.isLoading ? <Skeleton className="h-9 w-32" /> : (
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold flex items-baseline gap-1 text-primary">
                          <span className="text-sm font-medium text-primary/70">Rp</span>
                          <AnimatedNumber value={summary?.grossProfit || 0} />
                        </div>
                        <PercentageBadge value={calcChange(summary?.grossProfit || 0, summary?.prevGrossProfit || 0)} />
                      </div>
                      <div className="text-[10px] text-primary/60 mt-1 font-medium italic">
                        Pendapatan dikurangi HPP
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </StickyCardStack>
          </div>

          {/* Charts */}
          <section className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartAreaInteractive
                title="Tren Pendapatan vs Pembelian"
                description="Perbandingan harian dalam periode yang dipilih"
                data={dailySummary}
                config={{
                  totalSales: { label: "Pendapatan", color: "var(--chart-1)" },
                  totalPurchases: { label: "Pembelian", color: "var(--destructive)" },
                }}
              />
            </div>
            <div>
              <ReportPieChart
                data={topProducts}
                title="Distribusi Produk Terlaris"
                description="5 produk tertinggi berdasarkan pendapatan"
              />
            </div>
          </section>

          {/* Bottom section */}
          <section className="no-print grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Produk terlaris */}
            <Card className="xl:col-span-2 shadow-md pt-0 gap-0">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="flex items-center justify-between pt-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span>Produk Terlaris</span>
                  </div>
                  <PieChartIcon className="h-4 w-4 text-muted-foreground/40" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="py-3 pl-6">Produk</TableHead>
                      <TableHead className="text-right py-3">Qty</TableHead>
                      <TableHead className="text-right py-3">Pendapatan</TableHead>
                      <TableHead className="text-right py-3 pr-6">Laba Kotor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportQuery.isLoading ? (
                      [...Array(4)].map((_, i) => (
                        <TableRow key={i}><TableCell colSpan={4} className="py-4 px-6"><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                      ))
                    ) : topProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">
                          Belum ada data penjualan pada periode ini.
                        </TableCell>
                      </TableRow>
                    ) : (
                      topProducts.map((item, idx) => (
                        <TableRow key={item.productId} className="hover:bg-muted/10 transition-colors">
                          <TableCell className="font-medium py-3 pl-6">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                                idx === 0 ? "bg-amber-100 text-amber-700" :
                                  idx === 1 ? "bg-slate-100 text-slate-600" :
                                    idx === 2 ? "bg-orange-100 text-orange-700" :
                                      "bg-muted text-muted-foreground",
                              )}>{idx + 1}</span>
                              {item.productName}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm tabular-nums">{item.qtySold}</TableCell>
                          <TableCell className="text-right text-primary font-bold text-sm tabular-nums">{formatCurrency(item.revenue)}</TableCell>
                          <TableCell className="text-right pr-6 text-emerald-600 font-semibold text-sm tabular-nums">{formatCurrency(item.grossProfit)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Right column: Arus kas + Laba Bersih */}
            <div className="space-y-4">
              {/* Ringkasan Arus Kas */}
              <Card className="shadow-md pt-0 gap-0">
                <CardHeader className="bg-primary/5 border-b">
                  <CardTitle className="flex items-center gap-2 pt-6">
                    <Wallet className="h-5 w-5 text-primary" />
                    Arus Kas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pendapatan</span>
                    <span className="font-bold text-emerald-600 tabular-nums">{formatCurrency(summary?.totalSales ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pembelian</span>
                    <span className="font-bold text-rose-600 tabular-nums">−{formatCurrency(summary?.totalPurchases ?? 0)}</span>
                  </div>
                  <div className="border-t border-dashed pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Arus Kas Bersih</p>
                      <p className="text-[10px] text-muted-foreground">Bukan laba — ini aliran uang</p>
                    </div>
                    <Badge
                      variant={netCashFlow >= 0 ? "default" : "destructive"}
                      className={cn("px-3 py-1 text-sm font-bold tabular-nums", netCashFlow >= 0 ? "bg-emerald-600 hover:bg-emerald-700" : "")}
                    >
                      {formatCurrency(netCashFlow)}
                    </Badge>
                  </div>
                  <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-muted-foreground mb-1">TX Penjualan</p>
                      <p className="font-bold text-base">{summary?.totalSalesTransactions ?? 0}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-muted-foreground mb-1">TX Pembelian</p>
                      <p className="font-bold text-base">{summary?.totalPurchaseTransactions ?? 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Kalkulasi Laba Bersih */}
              <NetProfitCard
                summary={summary}
                breakdown={breakdown}
                isLoading={reportQuery.isLoading}
              />
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
