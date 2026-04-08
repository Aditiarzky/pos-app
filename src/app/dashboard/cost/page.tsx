"use client";

import { Suspense, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { CardBg } from "@/assets/card-background/card-bg";
import {
  Loader2,
  Plus,
  Receipt,
  Landmark,
  Info,
  Zap,
  User,
  Home,
  Truck,
  Percent,
  Banknote,
  PieChart,
  CalendarClock,
} from "lucide-react";
import { useOperationalCostList } from "./_hooks/use-operational-cost-list";
import { useTaxConfigList } from "./_hooks/use-tax-config-list";
import { OperationalCostsSection } from "./_components/_forms/_sections/operational-costs-section";
import { TaxConfigsSection } from "./_components/_forms/_sections/tax-configs-section";
import { useQueryState } from "@/hooks/use-query-state";
import { useCostAnalytics } from "@/hooks/cost/use-cost";
import { CATEGORY_LABELS } from "./_types/cost-types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { RoleGuard } from "@/components/role-guard";
import { AccessDenied } from "@/components/access-denied";

// function InfoBanner() {
//   return (
//     <Alert className="bg-blue-50 border-blue-200">
//       <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
//       <AlertDescription className="text-blue-800 text-sm space-y-1">
//         <p className="font-semibold">Apa fungsi halaman ini?</p>
//         <p>
//           Halaman ini digunakan untuk mencatat <strong>pengeluaran rutin</strong> toko
//           (seperti listrik, gaji, sewa) dan <strong>pajak</strong> yang berlaku.
//           Data ini akan digunakan secara otomatis untuk menghitung{" "}
//           <strong>Laba Bersih</strong> di halaman Laporan.
//         </p>
//         <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
//           <ArrowRight className="h-3 w-3 shrink-0" />
//           Laba Bersih = Laba Kotor − Biaya Operasional − Pajak
//         </p>
//       </AlertDescription>
//     </Alert>
//   );
// }

const AnalyticsCard = ({
  title,
  value,
  subtitle,
  icon,
  color,
  isCurrency = false,
  isLoading = false,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: ReactNode;
  color: "primary" | "emerald" | "blue" | "rose" | "amber";
  isCurrency?: boolean;
  isLoading?: boolean;
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
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-32 rounded-lg" />
            <Skeleton className="h-4 w-44 rounded-lg" />
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="text-2xl font-bold flex items-baseline gap-1 text-primary">
              {isCurrency ? (
                <span className="text-sm font-medium text-muted-foreground">Rp</span>
              ) : null}
              <AnimatedNumber value={value} />
            </div>
            {subtitle ? (
              <div className="mt-1 text-[11px] text-muted-foreground font-medium">
                {subtitle}
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

function CostsContent() {
  const [tab, setTab] = useQueryState<string>("tab", "operational");

  // Hook diinstansiasi di sini agar tombol "+ Tambah" di header bisa memanggil
  // handleOpenCreate dari hook yang sama dengan yang dipakai section
  const operationalHook = useOperationalCostList();
  const taxHook = useTaxConfigList();
  const analyticsQuery = useCostAnalytics();
  const analytics = analyticsQuery.analytics;

  const handleAdd = () => {
    if (tab === "operational") {
      operationalHook.handleOpenCreate();
    } else {
      taxHook.handleOpenCreate();
    }
  };

  const addLabel = tab === "operational" ? "Tambah Biaya" : "Tambah Pajak";

  return (
    <>
      {/* Header */}
      <header className="sticky top-6 mx-auto container z-10 flex flex-row px-4 sm:px-6 justify-between w-full items-center gap-4 pb-16">
        <div className="flex items-center gap-4">
          <div className="h-12 w-1.5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
          <div className="flex flex-col">
            <h1 className="text-3xl text-primary font-bold tracking-tight">
              Biaya & Pajak
            </h1>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-80">
              Pengeluaran Toko • Pajak & Operasional
            </p>
          </div>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-gradient-to-br from-primary to-green-600 dark:to-green-400 hover:brightness-90 rounded-xl"
        >
          <Plus className="mr-0 sm:mr-2 h-4 w-4" />
          <p className="hidden sm:block">{addLabel}</p>
        </Button>
      </header>

      {/* Main */}
      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-5 min-h-screen border-t">
        {/* Analytics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <AnalyticsCard
            title="Biaya Ops Aktif"
            value={analytics?.operational.activeCount ?? 0}
            subtitle={
              analytics
                ? `Berakhir 30 hari: ${analytics.operational.expiringNext30DaysCount}`
                : undefined
            }
            icon={<Receipt className="h-4 w-4" />}
            color="blue"
            isLoading={analyticsQuery.isLoading}
          />
          <AnalyticsCard
            title="Estimasi Biaya/Bulan"
            value={analytics?.operational.activeMonthlyEstimate ?? 0}
            subtitle={
              analytics?.operational.topCategories?.[0]
                ? `Top: ${CATEGORY_LABELS[analytics.operational.topCategories[0].category]} (${formatCurrency(analytics.operational.topCategories[0].monthlyEstimate)}/bln)`
                : analytics
                  ? `One-time aktif: ${analytics.operational.activeOneTimeCount}`
                  : undefined
            }
            icon={<PieChart className="h-4 w-4" />}
            color="primary"
            isCurrency
            isLoading={analyticsQuery.isLoading}
          />
          <AnalyticsCard
            title="Pajak Aktif"
            value={analytics?.tax.activeCount ?? 0}
            subtitle={
              analytics
                ? `%: ${analytics.tax.activePercentageCount}, tetap: ${analytics.tax.activeFixedCount}`
                : undefined
            }
            icon={<Landmark className="h-4 w-4" />}
            color="amber"
            isLoading={analyticsQuery.isLoading}
          />
          <AnalyticsCard
            title="Pajak Tetap/Bulan"
            value={analytics?.tax.activeFixedMonthlyEstimate ?? 0}
            subtitle={
              analytics
                ? `Berakhir 30 hari: ${analytics.tax.expiringNext30DaysCount}`
                : undefined
            }
            icon={<CalendarClock className="h-4 w-4" />}
            color="emerald"
            isCurrency
            isLoading={analyticsQuery.isLoading}
          />
        </section>

        <Tabs value={tab} onValueChange={setTab} className="gap-4">
          <TabsList className="bg-background">
            <TabsTrigger
              value="operational"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 data-[state=active]:shadow-none cursor-pointer"
            >
              <Receipt className="mr-2 h-4 w-4" />
              Biaya Operasional
            </TabsTrigger>
            <TabsTrigger
              value="tax"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 data-[state=active]:shadow-none cursor-pointer"
            >
              <Landmark className="mr-2 h-4 w-4" />
              Pajak
            </TabsTrigger>
          </TabsList>

          {/* Tab Biaya Operasional */}
          <TabsContent value="operational" className="animate-in fade-in duration-300 space-y-4">
            <Card className="border-dashed p-0 bg-muted/20">
              <CardContent className="p-4 flex gap-3">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Catat semua pengeluaran rutin toko Anda di sini. Contohnya:</p>
                  <ul className="text-xs space-y-1 ml-1">
                    <li className="flex items-center gap-2">
                      <Zap className="h-3 w-3 shrink-0 text-yellow-500" />
                      <span><strong>Listrik PLN</strong> — Rp500.000 per bulan</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <User className="h-3 w-3 shrink-0 text-blue-500" />
                      <span><strong>Gaji Karyawan</strong> — Rp2.000.000 per bulan</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Home className="h-3 w-3 shrink-0 text-green-500" />
                      <span><strong>Sewa Ruko</strong> — Rp1.500.000 per bulan</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Truck className="h-3 w-3 shrink-0 text-orange-500" />
                      <span><strong>Ongkos Bensin</strong> — Rp100.000 per minggu</span>
                    </li>
                  </ul>
                  <p className="text-xs">
                    Biaya yang <strong>Aktif</strong> akan otomatis diperhitungkan dalam laporan laba bersih.
                  </p>
                </div>
              </CardContent>
            </Card>
            {/* Teruskan hook sebagai prop — bukan instansiasi baru */}
            <OperationalCostsSection hook={operationalHook} />
          </TabsContent>

          {/* Tab Pajak */}
          <TabsContent value="tax" className="animate-in fade-in duration-300 space-y-4">
            <Card className="border-dashed p-0 bg-muted/20">
              <CardContent className="p-4 flex gap-3">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Catat pajak yang berlaku untuk usaha Anda. Ada dua jenis:</p>
                  <ul className="text-xs space-y-1.5 ml-1">
                    <li className="flex items-start gap-2">
                      <Percent className="h-3 w-3 shrink-0 text-violet-500 mt-0.5" />
                      <span>
                        <strong>Persentase (%):</strong> Dihitung otomatis dari omset atau laba kotor.
                        Contoh: PPh Final UMKM 0.5%, PPN 11%.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Banknote className="h-3 w-3 shrink-0 text-amber-500 mt-0.5" />
                      <span>
                        <strong>Nominal Tetap (Rp):</strong> Jumlah tetap setiap periode.
                        Contoh: Retribusi kebersihan Rp50.000/bulan.
                      </span>
                    </li>
                  </ul>
                  <p className="text-xs">
                    Jika tidak yakin tentang pajak yang berlaku,{" "}
                    <strong>konsultasikan dengan akuntan atau konsultan pajak</strong> Anda.
                  </p>
                </div>
              </CardContent>
            </Card>
            <TaxConfigsSection hook={taxHook} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}

export default function CostsPage() {
  return (
    <RoleGuard allowedRoles={["admin sistem"]} fallback={<AccessDenied />}>
      <Suspense
        fallback={
          <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <CostsContent />
      </Suspense>
    </RoleGuard>
  );
}
