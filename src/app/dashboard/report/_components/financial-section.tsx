"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const totalSales = summary?.totalSales ?? 0;
  const grossProfit = summary?.grossProfit ?? 0;
  const totalOperationalCost = summary?.totalOperationalCost ?? 0;
  const totalTax = summary?.totalTax ?? 0;
  const netProfit = summary?.netProfit ?? 0;

  // HPP = Pendapatan − Laba Kotor
  const hpp = totalSales - grossProfit;

  // Total beban = HPP + Biaya Operasional + Pajak
  const totalBeban = hpp + totalOperationalCost + totalTax;

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
          {/* ── Laba Kotor ── */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Laba Kotor
            </p>

            {/* Penjualan */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Penjualan</p>
                <p className="text-[11px] text-muted-foreground">
                  Omset periode ini
                </p>
              </div>
              <span className="font-bold text-sm tabular-nums text-emerald-600 shrink-0">
                {formatCurrency(totalSales)}
              </span>
            </div>

            {/* HPP */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  Harga Pokok Penjualan (HPP)
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Biaya modal barang terjual
                </p>
              </div>
              <span className="font-bold text-sm tabular-nums text-rose-500 shrink-0">
                −{formatCurrency(hpp)}
              </span>
            </div>

            {/* Subtotal Laba Kotor */}
            <div className="flex items-center justify-between border-t border-border/50 pt-2">
              <p className="text-sm font-semibold">Laba Kotor</p>
              <span
                className={cn(
                  "font-bold text-sm tabular-nums",
                  grossProfit >= 0 ? "text-emerald-600" : "text-rose-500",
                )}
              >
                {formatCurrency(grossProfit)}
              </span>
            </div>
          </div>

          {/* ── Beban ── */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Beban
            </p>

            {/* Biaya Operasional */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Biaya Operasional</p>
                <p className="text-[11px] text-muted-foreground">
                  {breakdown?.operationalCosts?.length ?? 0} pos biaya
                </p>
              </div>
              <span className="font-bold text-sm tabular-nums text-rose-500 shrink-0">
                −{formatCurrency(totalOperationalCost)}
              </span>
            </div>

            {/* Pajak */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Pajak</p>
                <p className="text-[11px] text-muted-foreground">
                  {breakdown?.taxes?.length ?? 0} jenis pajak
                </p>
              </div>
              <span className="font-bold text-sm tabular-nums text-rose-500 shrink-0">
                −{formatCurrency(totalTax)}
              </span>
            </div>
          </div>

          {/* ── Laba/Rugi Bersih ── */}
          <div className="border-t border-dashed pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Laba/Rugi Bersih</p>
                <p className="text-[11px] text-muted-foreground">
                  Laba Kotor − Beban
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

          {/* Analisis Margin */}
          {!isLoading && summary && (
            <div className="flex items-start gap-2 rounded-xl bg-primary/5 border border-primary/10 p-4 mt-6">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-primary">Analisis Margin</p>
                <p className="text-muted-foreground leading-relaxed">
                  Dari total pendapatan{" "}
                  {formatCurrency(totalSales)}, beban usaha sebesar{" "}
                  {formatCurrency(totalBeban)} ({" "}
                  {(
                    (totalBeban / (totalSales || 1)) *
                    100
                  ).toFixed(1)}
                  %). Margin laba bersih Anda adalah{" "}
                  {(
                    (netProfit / (totalSales || 1)) *
                    100
                  ).toFixed(1)}
                  %.
                  {netProfit > 0
                    ? " Bisnis Anda menghasilkan keuntungan yang sehat periode ini."
                    : " Perhatian diperlukan untuk menyeimbangkan pengeluaran dan pendapatan."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
