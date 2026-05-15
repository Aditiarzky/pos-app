"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CircleDollarSign, ChevronDown, ChevronUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportSummary, NetProfitBreakdown } from "@/services/reportService";
import { formatCurrency } from "@/lib/format";

interface FinancialSectionProps {
  summary: ReportSummary | undefined;
  breakdown: NetProfitBreakdown | undefined;
  isLoading: boolean;
}

export function FinancialSection({
  summary,
  breakdown,
  isLoading,
}: FinancialSectionProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const grossProfit = summary?.grossProfit ?? 0;
  const totalOperationalCost = summary?.totalOperationalCost ?? 0;
  const totalTax = summary?.totalTax ?? 0;
  const netProfit = summary?.netProfit ?? 0;

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
    <div className="space-y-6">
      <Card className="shadow-md border border-border/60 pt-0 gap-0">
        <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b py-4 px-5">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4 text-emerald-600" />
            Laporan Laba Rugi (P&L)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {/* Layer 1: Financial Rows */}
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-2"
            >
              <div>
                <p className="text-sm font-medium">{row.label}</p>
                <p className="text-[11px] text-muted-foreground">{row.note}</p>
              </div>
              <span
                className={cn(
                  "font-bold text-sm tabular-nums shrink-0",
                  row.color,
                )}
              >
                {row.prefix}
                {formatCurrency(row.value)}
              </span>
            </div>
          ))}

          <div className="border-t border-dashed pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Laba Bersih Akhir</p>
                <p className="text-[11px] text-muted-foreground">
                  Estimasi setelah semua potongan
                </p>
              </div>
              <Badge
                variant={netProfit >= 0 ? "default" : "destructive"}
                className={cn(
                  "px-4 py-1.5 text-base font-bold tabular-nums",
                  netProfit >= 0 ? "bg-emerald-600 hover:bg-emerald-700" : "",
                )}
              >
                {formatCurrency(netProfit)}
              </Badge>
            </div>
          </div>

          {/* Layer 2: Detailed Breakdown Collapsible */}
          {breakdown &&
            (breakdown.operationalCosts.length > 0 ||
              breakdown.taxes.length > 0) && (
              <Collapsible
                open={showBreakdown}
                onOpenChange={setShowBreakdown}
                className="mt-4"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground gap-1"
                  >
                    {showBreakdown ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    {showBreakdown
                      ? "Sembunyikan detail pengeluaran"
                      : "Lihat rincian biaya & pajak"}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  {/* Costs table */}
                  {breakdown.operationalCosts.length > 0 && (
                    <div className="rounded-lg border bg-muted/20 overflow-hidden">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-2 border-b bg-muted/50">
                        Biaya Operasional
                      </p>
                      {breakdown.operationalCosts.map((cost) => (
                        <div
                          key={cost.id}
                          className="flex items-center justify-between px-3 py-2 border-b last:border-0"
                        >
                          <span className="text-xs">{cost.name}</span>
                          <span className="text-xs font-semibold text-rose-500 tabular-nums">
                            −{formatCurrency(cost.normalizedAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Taxes table */}
                  {breakdown.taxes.length > 0 && (
                    <div className="rounded-lg border bg-muted/20 overflow-hidden">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-2 border-b bg-muted/50">
                        Pajak
                      </p>
                      {breakdown.taxes.map((tax) => (
                        <div
                          key={tax.id}
                          className="flex items-center justify-between px-3 py-2 border-b last:border-0"
                        >
                          <span className="text-xs">{tax.name}</span>
                          <span className="text-xs font-semibold text-rose-500 tabular-nums">
                            −{formatCurrency(tax.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}

          {/* Layer 3: Interpretation */}
          {!isLoading && summary && (
            <div className="flex items-start gap-2 rounded-xl bg-primary/5 border border-primary/10 p-4 mt-6">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-primary">Analisis Margin</p>
                <p className="text-muted-foreground leading-relaxed">
                  Margin Laba Kotor Anda adalah{" "}
                  {(
                    (summary.grossProfit / (summary.totalSales || 1)) *
                    100
                  ).toFixed(1)}
                  %. Setelah dikurangi operasional and pajak, margin laba bersih
                  menjadi{" "}
                  {(
                    (summary.netProfit / (summary.totalSales || 1)) *
                    100
                  ).toFixed(1)}
                  %.
                  {netProfit > 0
                    ? " Bisnis Anda menghasilkan keuntungan yang sehat periode ini."
                    : " Perhatian diperlukan untuk menyeimbangkan pengeluaran and pendapatan."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
