"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/ui/search-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Edit2,
  Trash2,
  SearchX,
  Calendar,
  StickyNote,
  LayoutGrid,
  Table2,
  Percent,
  Banknote,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { TaxConfig } from "@/services/costService";
import { TAX_APPLIES_TO_LABELS, PERIOD_LABELS } from "../../_types/cost-types";
import { useTaxConfigList } from "../../_hooks/use-tax-config-list";
import { TaxConfigForm } from "../_forms/tax-config-form";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { FilterWrap } from "@/components/filter-wrap";
import { TaxConfigFilterForm } from "../_ui/tax-config-filter-form";
import { AppPagination } from "@/components/app-pagination";

type ViewMode = "table" | "card";

interface Props {
  hook: ReturnType<typeof useTaxConfigList>;
}

export function TaxConfigsSection({ hook }: Props) {
  const {
    taxConfigs,
    meta,
    isLoading,
    search,
    setSearch,
    isActiveFilter,
    setIsActiveFilter,
    page,
    setPage,
    limit,
    setLimit,
    hasActiveFilters,
    resetFilters,
    editingTax,
    isFormOpen,
    handleOpenEdit,
    handleCloseForm,
    handleDelete,
  } = hook;

  const [viewMode, setViewMode] = useState<ViewMode>("table");

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-background rounded-md">
        <SearchInput
          placeholder="Cari nama pajak..."
          value={search}
          onChange={setSearch}
        />

        <div className="flex items-center gap-2 shrink-0">
          <FilterWrap hasActiveFilters={hasActiveFilters}>
            <TaxConfigFilterForm
              isActiveFilter={isActiveFilter}
              setIsActiveFilter={setIsActiveFilter}
              setPage={setPage}
              resetFilters={resetFilters}
            />
          </FilterWrap>

          {/* View toggle */}
          <div className="flex rounded-lg border overflow-hidden h-9">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "px-2.5 transition-colors",
                viewMode === "table"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted",
              )}
              title="Tampilan Tabel"
            >
              <Table2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={cn(
                "px-2.5 transition-colors",
                viewMode === "card"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted",
              )}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        viewMode === "table" ? (
          <TableSkeleton />
        ) : (
          <CardSkeleton />
        )
      ) : !taxConfigs?.length ? (
        <EmptyState search={search} />
      ) : viewMode === "table" ? (
        <TaxTable configs={taxConfigs} onEdit={handleOpenEdit} onDelete={handleDelete} />
      ) : (
        <TaxCardGrid configs={taxConfigs} onEdit={handleOpenEdit} onDelete={handleDelete} />
      )}

      {meta && meta.totalPages > 1 && (
        <div className="pt-2">
          <AppPagination
            currentPage={page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={setLimit}
          />
        </div>
      )}

      <TaxConfigForm
        open={isFormOpen}
        onClose={handleCloseForm}
        editingTax={editingTax}
      />
    </div>
  );
}

// ── Table View ────────────────────────────────────────────────────────────────

function TaxTable({
  configs,
  onEdit,
  onDelete,
}: {
  configs: TaxConfig[];
  onEdit: (t: TaxConfig) => void;
  onDelete: (t: TaxConfig) => void;
}) {
  return (
    <div className="border-y overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-[620px]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b">
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 pl-4">
                Nama Pajak
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3">
                Jenis
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 text-right">
                Nilai
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3">
                Basis / Periode
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3">
                Berlaku Sejak
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 text-center">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 pr-4 text-right">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map((tax, idx) => {
              const isPercentage = tax.type === "percentage";
              const rateDisplay =
                isPercentage && tax.rate != null
                  ? `${(Number(tax.rate) * 100).toFixed(2).replace(/\.?0+$/, "")}%`
                  : null;

              return (
                <TableRow
                  key={tax.id}
                  className={cn(
                    "transition-colors hover:bg-muted/20 border-b last:border-0",
                    !tax.isActive && "opacity-60",
                    idx % 2 === 0 ? "bg-background" : "bg-muted/10",
                  )}
                >
                  <TableCell className="py-3 pl-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "p-1.5 rounded-md shrink-0",
                          isPercentage
                            ? "bg-violet-100 text-violet-600"
                            : "bg-amber-100 text-amber-600",
                        )}
                      >
                        {isPercentage ? (
                          <Percent className="h-3 w-3" />
                        ) : (
                          <Banknote className="h-3 w-3" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{tax.name}</p>
                        {tax.notes && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[160px]">
                            {tax.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-medium",
                        isPercentage
                          ? "bg-violet-50 text-violet-700 border-violet-200"
                          : "bg-amber-50 text-amber-700 border-amber-200",
                      )}
                    >
                      {isPercentage ? "Persentase" : "Nominal Tetap"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right font-bold text-primary tabular-nums">
                    {isPercentage
                      ? rateDisplay
                      : formatCurrency(Number(tax.fixedAmount))}
                  </TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground">
                    {isPercentage && tax.appliesTo
                      ? TAX_APPLIES_TO_LABELS[tax.appliesTo]
                      : tax.period
                        ? PERIOD_LABELS[tax.period]
                        : "—"}
                  </TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {format(new Date(tax.effectiveFrom), "d MMM yyyy", { locale: id })}
                      {tax.effectiveTo && (
                        <span className="text-[10px]">
                          — {format(new Date(tax.effectiveTo), "d MMM yyyy", { locale: id })}
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <StatusBadge isActive={tax.isActive} />
                  </TableCell>
                  <TableCell className="py-3 pr-4">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => onEdit(tax)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(tax)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Card Grid View ────────────────────────────────────────────────────────────

function TaxCardGrid({
  configs,
  onEdit,
  onDelete,
}: {
  configs: TaxConfig[];
  onEdit: (t: TaxConfig) => void;
  onDelete: (t: TaxConfig) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {configs.map((tax) => (
        <TaxCard key={tax.id} tax={tax} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

function TaxCard({
  tax,
  onEdit,
  onDelete,
}: {
  tax: TaxConfig;
  onEdit: (t: TaxConfig) => void;
  onDelete: (t: TaxConfig) => void;
}) {
  const isPercentage = tax.type === "percentage";
  const rateDisplay =
    isPercentage && tax.rate != null
      ? `${(Number(tax.rate) * 100).toFixed(2).replace(/\.?0+$/, "")}%`
      : null;

  return (
    <Card
      className={cn(
        "border hover:shadow-md p-0 transition-all duration-200 group",
        !tax.isActive && "opacity-60",
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div
              className={cn(
                "p-2 rounded-lg shrink-0 mt-0.5",
                isPercentage
                  ? "bg-violet-100 text-violet-600"
                  : "bg-amber-100 text-amber-600",
              )}
            >
              {isPercentage ? (
                <Percent className="h-3.5 w-3.5" />
              ) : (
                <Banknote className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight truncate">{tax.name}</p>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-medium",
                    isPercentage
                      ? "bg-violet-50 text-violet-700 border-violet-200"
                      : "bg-amber-50 text-amber-700 border-amber-200",
                  )}
                >
                  {isPercentage ? "Persentase" : "Nominal Tetap"}
                </Badge>
                <StatusBadge isActive={tax.isActive} />
              </div>
            </div>
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={() => onEdit(tax)}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(tax)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Nilai pajak */}
        <div
          className={cn(
            "rounded-lg px-3 py-2",
            isPercentage ? "bg-violet-50/60" : "bg-amber-50/60",
          )}
        >
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
            {isPercentage ? "Tarif Pajak" : "Nominal Tetap"}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "text-lg font-bold tabular-nums",
                isPercentage ? "text-violet-700" : "text-amber-700",
              )}
            >
              {isPercentage
                ? rateDisplay
                : formatCurrency(Number(tax.fixedAmount))}
            </span>
            {isPercentage && tax.appliesTo && (
              <span className="text-xs text-muted-foreground">
                dari {TAX_APPLIES_TO_LABELS[tax.appliesTo].toLowerCase()}
              </span>
            )}
            {!isPercentage && tax.period && (
              <span className="text-xs text-muted-foreground">
                / {PERIOD_LABELS[tax.period].toLowerCase().replace("per ", "")}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="space-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>
              Sejak {format(new Date(tax.effectiveFrom), "d MMM yyyy", { locale: id })}
              {tax.effectiveTo &&
                ` — ${format(new Date(tax.effectiveTo), "d MMM yyyy", { locale: id })}`}
            </span>
          </span>
          {tax.notes && (
            <span className="flex items-start gap-1.5">
              <StickyNote className="h-3 w-3 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{tax.notes}</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
      <CheckCircle2 className="h-2.5 w-2.5" />
      Aktif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">
      <XCircle className="h-2.5 w-2.5" />
      Nonaktif
    </span>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground rounded-xl border border-dashed bg-muted/10">
      <SearchX className="h-10 w-10 mb-3 opacity-20" />
      <p className="font-semibold text-foreground">Belum ada konfigurasi pajak</p>
      <p className="text-sm mt-1 max-w-xs">
        {search
          ? "Tidak ada pajak yang cocok dengan pencarian."
          : 'Klik "+ Tambah Pajak" di atas untuk menambahkan pajak.'}
      </p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="bg-muted/40 px-4 py-3 flex gap-6">
        {[160, 90, 80, 120, 100, 60, 60].map((w, i) => (
          <Skeleton key={i} className="h-4" style={{ width: w }} />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="px-4 py-3.5 flex gap-6 border-t items-center">
          <div className="flex items-center gap-2 w-[160px]">
            <Skeleton className="h-7 w-7 rounded-md shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
          <Skeleton className="h-5 w-[90px] rounded-full" />
          <Skeleton className="h-4 w-[80px] ml-auto" />
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-5 w-[60px] rounded-full" />
          <Skeleton className="h-7 w-[60px]" />
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-1/2 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-3 w-2/3" />
        </Card>
      ))}
    </div>
  );
}
