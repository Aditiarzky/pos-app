"use client";

import { Suspense, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useReports,
  useSalesReport,
  usePurchaseReport,
} from "@/hooks/report/use-report";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  Loader2,
  Printer,
  CalendarDays,
  CalendarIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fillDailyGaps } from "@/lib/chart-utils";
import { RoleGuard } from "@/components/role-guard";
import { formatCurrency } from "@/lib/format";
import { PrintReport } from "@/components/print-report";

// Components
import { OverviewSection } from "./_components/overview-section";
import { SalesSection } from "./_components/sales-section";
import { PurchaseSection } from "./_components/purchase-section";
import { FinancialSection } from "./_components/financial-section";

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
    case "today":
      break;
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

// ── Main ReportContent ────────────────────────────────────────────────────────

export function ReportContent() {
  const [selectedFilter, setSelectedFilter] = useState("thisMonth");
  const [appliedFilter, setAppliedFilter] = useState(getDefaultDateFilter());
  const [activeTab, setActiveTab] = useState("overview");

  const reportQuery = useReports({ params: appliedFilter });
  const salesQuery = useSalesReport({
    params: appliedFilter,
    queryConfig: { enabled: true },
  });
  const purchaseQuery = usePurchaseReport({
    params: appliedFilter,
    queryConfig: { enabled: true },
  });

  const handleFilterChange = (option: string) => {
    setSelectedFilter(option);
    const range = getRangeFromOption(option);
    if (range) setAppliedFilter(range);
  };

  const handleCustomDateChange = (start: string, end: string) => {
    if (start && end) setAppliedFilter({ startDate: start, endDate: end });
  };

  const filterLabel =
    FILTER_OPTIONS.find((o) => o.value === selectedFilter)?.label ?? "Kustom";

  const dailySummary = useMemo(() => {
    const raw = (reportQuery.data?.data?.daily ?? []) as Record<
      string,
      string | number
    >[];
    return fillDailyGaps(raw, appliedFilter.startDate, appliedFilter.endDate, [
      "totalSales",
      "totalPurchases",
    ]) as { date: string; [key: string]: number | string }[];
  }, [reportQuery.data?.data?.daily, appliedFilter]);

  const dailySalesTable = useMemo(() => {
    const raw = (salesQuery.data?.data?.daily ?? []) as Record<
      string,
      string | number
    >[];
    return fillDailyGaps(raw, appliedFilter.startDate, appliedFilter.endDate, [
      "totalSales",
    ]) as { date: string; [key: string]: number | string }[];
  }, [salesQuery.data?.data?.daily, appliedFilter]);

  const dailyPurchaseTable = useMemo(() => {
    const raw = (purchaseQuery.data?.data?.daily ?? []) as Record<
      string,
      string | number
    >[];
    return fillDailyGaps(raw, appliedFilter.startDate, appliedFilter.endDate, [
      "totalPurchases",
      "totalTransactions",
    ]) as { date: string; [key: string]: number | string }[];
  }, [purchaseQuery.data?.data?.daily, appliedFilter]);

  // Flatten breakdown rows once
  const breakdownRows = useMemo(
    () => [
      ...(
        reportQuery.data?.data?.netProfitBreakdown?.operationalCosts ?? []
      ).map((c) => ({
        type: "Biaya Operasional" as const,
        name: c.name,
        amount: c.normalizedAmount,
      })),
      ...(reportQuery.data?.data?.netProfitBreakdown?.taxes ?? []).map((t) => ({
        type: "Pajak" as const,
        name: t.name,
        amount: t.amount,
      })),
    ],
    [reportQuery.data?.data?.netProfitBreakdown],
  );

  // Derived totals for footer rows
  const totalPurchase = dailyPurchaseTable.reduce(
    (s, r) => s + Number(r.totalPurchases ?? 0),
    0,
  );
  const totalPurchaseTx = dailyPurchaseTable.reduce(
    (s, r) => s + Number(r.totalTransactions ?? 0),
    0,
  );

  return (
    <>
      <style jsx global>{`
        @media screen {
          .print-only {
            display: none !important;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 14mm 14mm 18mm 14mm;
          }

          /* ── Counters ── */
          @page {
            @bottom-right {
              content: "Hal. " counter(page) " / " counter(pages);
              font-size: 8pt;
              color: #71717a;
            }
          }

          body * {
            visibility: hidden !important;
          }
          #print-area,
          #print-area * {
            visibility: visible !important;
          }

          #print-area {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: white !important;
            overflow: visible !important;
            height: auto !important;
          }

          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
        }
      `}</style>

      <div className="container mx-auto space-y-4">
        {/* ── Screen header ── */}
        <header className="no-print sticky top-6 mx-auto container z-10 flex flex-row px-4 sm:px-6 justify-between w-full items-center gap-4 pb-16">
          <div className="flex items-center gap-4">
            <div className="h-12 w-1.5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
            <div className="flex flex-col">
              <h1 className="text-3xl text-primary font-bold tracking-tight">
                Laporan
              </h1>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-80">
                Analisis Bisnis Terintegrasi
              </p>
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
          className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t print:shadow-none print:rounded-none print:mt-0 print:p-0 print:border-none print:min-h-0 print:space-y-0"
        >
          {/* ── Screen filters ── */}
          <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Rentang Waktu
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/40 rounded-xl w-fit border border-border/50">
                {FILTER_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      selectedFilter === option.value ? "default" : "ghost"
                    }
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-2 border-primary/20 bg-primary/5 text-xs font-semibold ml-1"
                      >
                        <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                        {appliedFilter.startDate} — {appliedFilter.endDate}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-4 flex flex-col gap-4"
                      align="start"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Mulai
                          </label>
                          <Input
                            type="date"
                            value={appliedFilter.startDate}
                            onChange={(e) =>
                              handleCustomDateChange(
                                e.target.value,
                                appliedFilter.endDate,
                              )
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Sampai
                          </label>
                          <Input
                            type="date"
                            value={appliedFilter.endDate}
                            onChange={(e) =>
                              handleCustomDateChange(
                                appliedFilter.startDate,
                                e.target.value,
                              )
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-xs text-muted-foreground font-medium">
                Periode Terpilih:
              </p>
              <p className="text-sm font-bold text-primary">{filterLabel}</p>
            </div>
          </div>

          {/* ── Screen tabs ── */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full no-print"
          >
            <TabsList className="no-print grid grid-cols-2 lg:grid-cols-4 w-full lg:w-fit mb-8 bg-background p-1 rounded-2xl border h-auto">
              {[
                { value: "overview", label: "Ikhtisar Performa" },
                { value: "sales", label: "Analisis Penjualan" },
                { value: "purchase", label: "Analisis Pembelian" },
                { value: "financial", label: "Laporan Laba Rugi" },
              ].map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="rounded-xl py-2 px-6 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none font-bold cursor-pointer transition-all"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {(reportQuery.isError ||
              salesQuery.isError ||
              purchaseQuery.isError) && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Gagal memuat beberapa kategori</AlertTitle>
                <AlertDescription>
                  Terjadi kesalahan saat mengambil detail data. Silakan coba
                  segarkan halaman.
                </AlertDescription>
              </Alert>
            )}

            <TabsContent value="overview" className="mt-0">
              <OverviewSection
                summary={reportQuery.data?.data?.summary}
                dailyData={dailySummary}
                isLoading={reportQuery.isLoading}
              />
            </TabsContent>
            <TabsContent value="sales" className="mt-0">
              <SalesSection
                data={salesQuery.data?.data}
                dailyData={dailySalesTable}
                isLoading={salesQuery.isLoading}
              />
            </TabsContent>
            <TabsContent value="purchase" className="mt-0">
              <PurchaseSection
                data={purchaseQuery.data?.data}
                dailyData={dailyPurchaseTable}
                isLoading={purchaseQuery.isLoading}
              />
            </TabsContent>
            <TabsContent value="financial" className="mt-0">
              <FinancialSection
                summary={reportQuery.data?.data?.summary}
                breakdown={reportQuery.data?.data?.netProfitBreakdown}
                isLoading={reportQuery.isLoading}
              />
            </TabsContent>
          </Tabs>

          {/* ════════════════════════════════════════════════════════════════
              PRINT-ONLY CONTENT
              ────────────────────────────────────────────────────────────
════════════════════════════════════════════════════════════════ */}
          <div className="print-only" style={{ color: "black" }}>
            <PrintReport
              appliedFilter={appliedFilter}
              summary={reportQuery.data?.data?.summary}
              topProducts={salesQuery.data?.data?.topProducts ?? []}
              topCategories={salesQuery.data?.data?.topCategories ?? []}
              dailyData={dailySummary}
              breakdownRows={breakdownRows}
            />
          </div>
        </main>
      </div>
    </>
  );
}

export default function ReportPage() {
  return (
    <RoleGuard allowedRoles={["admin sistem", "admin toko"]}>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Menyiapkan data laporan...
            </p>
          </div>
        }
      >
        <ReportContent />
      </Suspense>
    </RoleGuard>
  );
}
