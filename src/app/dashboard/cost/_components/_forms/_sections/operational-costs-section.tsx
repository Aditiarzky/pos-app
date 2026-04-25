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
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { OperationalCost } from "@/services/costService";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  PERIOD_LABELS,
} from "../../../_types/cost-types";
import { useOperationalCostList } from "../../../_hooks/use-operational-cost-list";
import { OperationalCostForm } from "../operational-cost-form";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { FilterWrap } from "@/components/filter-wrap";
import { OperationalCostFilterForm } from "../../_ui/operational-cost-filter-form";
import { AppPagination } from "@/components/app-pagination";
import { ViewModeSwitch } from "@/components/ui/view-mode-switch";

type ViewMode = "table" | "card";

interface Props {
  hook: ReturnType<typeof useOperationalCostList>;
}

export function OperationalCostsSection({ hook }: Props) {
  const {
    costs,
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
    editingCost,
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
          placeholder="Cari nama biaya..."
          value={search}
          onChange={setSearch}
        />

        <div className="flex items-center gap-2 shrink-0">
          <FilterWrap hasActiveFilters={hasActiveFilters}>
            <OperationalCostFilterForm
              isActiveFilter={isActiveFilter}
              setIsActiveFilter={setIsActiveFilter}
              setPage={setPage}
              resetFilters={resetFilters}
            />
          </FilterWrap>

          <ViewModeSwitch value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        viewMode === "table" ? (
          <TableSkeleton />
        ) : (
          <CardSkeleton />
        )
      ) : !costs?.length ? (
        <EmptyState search={search} />
      ) : viewMode === "table" ? (
        <CostTable costs={costs} onEdit={handleOpenEdit} onDelete={handleDelete} />
      ) : (
        <CostCardGrid costs={costs} onEdit={handleOpenEdit} onDelete={handleDelete} />
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

      <OperationalCostForm
        open={isFormOpen}
        onClose={handleCloseForm}
        editingCost={editingCost}
      />
    </div>
  );
}

// ── Table View ────────────────────────────────────────────────────────────────

function CostTable({
  costs,
  onEdit,
  onDelete,
}: {
  costs: OperationalCost[];
  onEdit: (c: OperationalCost) => void;
  onDelete: (c: OperationalCost) => void;
}) {
  return (
    <div className="border-y overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b">
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 pl-4">
                Nama Biaya
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3">
                Kategori
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 text-right">
                Nominal
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3">
                Frekuensi
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
            {costs.map((cost, idx) => (
              <TableRow
                key={cost.id}
                className={cn(
                  "transition-colors hover:bg-muted/20 border-b last:border-0",
                  !cost.isActive && "opacity-60",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/10",
                )}
              >
                <TableCell className="py-3 pl-4">
                  <div>
                    <p className="font-semibold text-sm">{cost.name}</p>
                    {cost.notes && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[180px]">
                        {cost.notes}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] font-medium", CATEGORY_COLORS[cost.category])}
                  >
                    {CATEGORY_LABELS[cost.category]}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-right font-bold text-primary tabular-nums">
                  {formatCurrency(Number(cost.amount))}
                </TableCell>
                <TableCell className="py-3 text-sm text-muted-foreground">
                  {PERIOD_LABELS[cost.period]}
                </TableCell>
                <TableCell className="py-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {format(new Date(cost.effectiveFrom), "d MMM yyyy", { locale: id })}
                    {cost.effectiveTo && (
                      <span className="text-[10px]">
                        — {format(new Date(cost.effectiveTo), "d MMM yyyy", { locale: id })}
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-center">
                  <StatusBadge isActive={cost.isActive} />
                </TableCell>
                <TableCell className="py-3 pr-4">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => onEdit(cost)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(cost)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Card Grid View ────────────────────────────────────────────────────────────

function CostCardGrid({
  costs,
  onEdit,
  onDelete,
}: {
  costs: OperationalCost[];
  onEdit: (c: OperationalCost) => void;
  onDelete: (c: OperationalCost) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {costs.map((cost) => (
        <CostCard key={cost.id} cost={cost} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

function CostCard({
  cost,
  onEdit,
  onDelete,
}: {
  cost: OperationalCost;
  onEdit: (c: OperationalCost) => void;
  onDelete: (c: OperationalCost) => void;
}) {
  return (
    <Card
      className={cn(
        "border hover:shadow-md p-0 transition-all duration-200 group",
        !cost.isActive && "opacity-60",
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">{cost.name}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Badge
                variant="outline"
                className={cn("text-[10px] font-medium", CATEGORY_COLORS[cost.category])}
              >
                {CATEGORY_LABELS[cost.category]}
              </Badge>
              <StatusBadge isActive={cost.isActive} />
            </div>
          </div>
          {/* Action buttons — visible on hover */}
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={() => onEdit(cost)}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(cost)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Nominal */}
        <div className="bg-muted/40 rounded-lg px-3 py-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
            Nominal
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-primary tabular-nums">
              {formatCurrency(Number(cost.amount))}
            </span>
            <span className="text-xs text-muted-foreground">
              / {PERIOD_LABELS[cost.period].toLowerCase().replace("per ", "")}
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="space-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>
              Sejak {format(new Date(cost.effectiveFrom), "d MMM yyyy", { locale: id })}
              {cost.effectiveTo &&
                ` — ${format(new Date(cost.effectiveTo), "d MMM yyyy", { locale: id })}`}
            </span>
          </span>
          {cost.notes && (
            <span className="flex items-start gap-1.5">
              <StickyNote className="h-3 w-3 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{cost.notes}</span>
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
      <p className="font-semibold text-foreground">Belum ada biaya operasional</p>
      <p className="text-sm mt-1 max-w-xs">
        {search
          ? "Tidak ada biaya yang cocok dengan pencarian."
          : 'Klik "+ Tambah Biaya" di atas untuk mulai mencatat pengeluaran rutin.'}
      </p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="bg-muted/40 px-4 py-3 flex gap-6">
        {[180, 100, 80, 80, 100, 60, 60].map((w, i) => (
          <Skeleton key={i} className={`h-4`} style={{ width: w }} />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-4 py-3.5 flex gap-6 border-t items-center">
          <Skeleton className="h-4 w-[180px]" />
          <Skeleton className="h-5 w-[80px] rounded-full" />
          <Skeleton className="h-4 w-[80px] ml-auto" />
          <Skeleton className="h-4 w-[80px]" />
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
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-3 w-1/2" />
        </Card>
      ))}
    </div>
  );
}
