import { useState, useEffect } from "react";
import { useProductAuditLogs } from "@/hooks/products/use-product-audit-logs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AppPagination } from "@/components/app-pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Loader2, SearchX, History } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { SearchInput } from "@/components/ui/search-input";
import { formatCurrency } from "@/lib/format";
import { FilterWrap } from "@/components/filter-wrap";
import { ViewModeSwitch } from "@/components/ui/view-mode-switch";
import { AuditLogFilterForm } from "../ui/audit-log-filter-form";
import { ChangeEntry } from "@/services/productService";

type ViewMode = "table" | "card";

const ACTION_LABELS: Record<string, string> = {
  create: "Dibuat",
  update: "Diperbarui",
  delete: "Dihapus",
  hard_delete: "Dihapus Permanen",
  restore: "Dipulihkan",
  stock_adjustment: "Penyesuaian Stok",
};

const ACTION_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
  hard_delete: "destructive",
  restore: "outline",
  stock_adjustment: "secondary",
};

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (field.includes("sellPrice") || field.includes("Price") || field.includes("Cost")) {
    return formatCurrency(String(value));
  }
  if (field === "isActive") return value ? "Aktif" : "Nonaktif";
  return String(value);
}

function ChangeSummary({ changes }: { changes: ChangeEntry[] }) {
  const shown = changes.slice(0, 2);
  const rest = changes.length - 2;
  return (
    <span className="text-xs text-muted-foreground">
      {shown.map((c, i) => (
        <span key={i}>
          {i > 0 && ", "}
          <span className="font-medium text-foreground">{c.label}</span>:{" "}
          <span className="line-through opacity-60">{formatValue(c.field, c.oldValue)}</span>
          {" → "}
          {formatValue(c.field, c.newValue)}
        </span>
      ))}
      {rest > 0 && <span className="text-muted-foreground"> +{rest} lainnya</span>}
    </span>
  );
}

export const ProductAuditLogSection = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [limit, setLimit] = useState(12);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, actionFilter, dateFrom, dateTo]);

  const { data, isLoading } = useProductAuditLogs({
    params: {
      page,
      limit,
      search: debouncedSearch,
      action: actionFilter !== "all" ? actionFilter : undefined,
      dateFrom,
      dateTo,
    },
  });

  const logs = data?.data || [];
  const meta = data?.meta;

  const hasActiveFilters =
    actionFilter !== "all" || dateFrom !== "" || dateTo !== "";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 bg-background rounded-md">
        <div className="relative flex-1">
          <SearchInput
            placeholder="Cari nama produk..."
            value={searchInput}
            onChange={setSearchInput}
          />
        </div>

        <div className="flex justify-between gap-2">
          <FilterWrap hasActiveFilters={hasActiveFilters}>
            <AuditLogFilterForm
              actionFilter={actionFilter}
              setActionFilter={setActionFilter}
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              setPage={setPage}
            />
          </FilterWrap>

          <div className="h-10 w-[1px] bg-border mx-1 hidden sm:block" />
          <ViewModeSwitch value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {viewMode === "table" ? (
        <div className=" overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/20 border-t border-b border-border/50">
              <TableRow className="border-none">
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">No.</TableHead>
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Waktu</TableHead>
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Produk</TableHead>
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Aksi</TableHead>
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Ringkasan</TableHead>
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Oleh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-b border-border/30 last:border-none">
                  <TableCell colSpan={6} className="text-center py-8">
                    <span className="flex items-center justify-center w-full">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memuat data...
                    </span>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow className="border-none">
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <SearchX className="h-8 w-8 mb-2 opacity-20" />
                      <p>Tidak ada data riwayat produk</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, index) => (
                  <TableRow
                    key={log.id}
                    className="hover:bg-muted/50 transition-colors border-b border-border/30 last:border-none"
                  >
                    <TableCell className="text-[12px] sm:text-xs px-2 sm:px-4 py-2 font-semibold text-muted-foreground">
                      {(page - 1) * limit + index + 1}
                    </TableCell>
                    <TableCell className="text-[12px] sm:text-xs px-2 sm:px-4 py-2 font-semibold text-muted-foreground">
                      <div className="flex flex-col">
                        <span className="sm:hidden text-[9px] text-muted-foreground">
                          {format(new Date(log.createdAt), "dd/MM/yy", {
                            locale: id,
                          })}
                        </span>
                        <span>
                          {format(new Date(log.createdAt), "HH:mm", {
                            locale: id,
                          })}
                        </span>
                        <span className="hidden sm:block">
                          {format(new Date(log.createdAt), "dd/MM/yy", {
                            locale: id,
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 sm:px-4 py-2 font-semibold text-muted-foreground">
                      <div className="flex flex-col min-w-[120px]">
                        <span className="font-bold text-[12px] sm:text-sm leading-tight">
                          {log.productName || "—"}
                        </span>
                        {log.productSku && (
                          <span className="text-[9px] sm:text-xs text-muted-foreground font-mono">
                            {log.productSku}
                          </span>
                        )}
                        {!log.productId && (
                           <Badge variant="destructive" className="w-fit text-[8px] sm:text-[10px] px-1 py-0 mt-1">Dihapus Permanen</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 sm:px-4 py-2 font-semibold text-muted-foreground">
                      <Badge
                        variant={ACTION_VARIANTS[log.action] ?? "secondary"}
                        className="text-[8px] sm:text-[12px] px-1 py-0 h-4 sm:h-5 sm:px-2 font-semibold whitespace-nowrap"
                      >
                        {ACTION_LABELS[log.action] ?? log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-2 sm:px-4 py-2 min-w-[200px] max-w-xs">
                       {log.changes && log.changes.length > 0 ? (
                        <ChangeSummary changes={log.changes} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[12px] sm:text-sm px-2 sm:px-4 py-2 font-semibold text-muted-foreground">
                      {log.userName ? log.userName.split(" ")[0] : "System"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center w-full py-8">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Memuat data...
              </CardContent>
            </Card>
          ) : logs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                Tidak ada data riwayat produk
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {logs.map((log) => (
                <Card
                  key={log.id}
                  className="overflow-hidden py-2 border-muted/50"
                >
                  <CardContent className="p-2.5 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-start gap-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[12px] sm:text-sm truncate leading-tight">
                          {log.productName || "—"}
                        </div>
                        <div className="text-[9px] sm:text-xs text-muted-foreground font-mono truncate">
                          {log.productSku || "-"}
                        </div>
                      </div>
                      <Badge
                        variant={ACTION_VARIANTS[log.action] ?? "secondary"}
                        className="shrink-0 text-[8px] sm:text-[12px] px-1 py-0 h-4 sm:h-5 sm:px-2 sm:py-0.5"
                      >
                        {ACTION_LABELS[log.action] ?? log.action}
                      </Badge>
                    </div>

                    <div className="pt-1.5 border-t border-muted/50">
                       <div className="text-[8px] sm:text-xs text-muted-foreground uppercase font-bold tracking-tighter mb-1">
                          Perubahan
                        </div>
                       {log.changes && log.changes.length > 0 ? (
                        <ChangeSummary changes={log.changes} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[12px] sm:text-sm pt-1.5 border-t border-muted/50">
                      <div>
                        <div className="text-[8px] sm:text-xs text-muted-foreground uppercase font-bold tracking-tighter">
                          Oleh
                        </div>
                        <div className="font-medium truncate">
                          {log.userName || "System"}
                        </div>
                      </div>
                       <div>
                        <div className="text-[8px] sm:text-xs text-muted-foreground uppercase font-bold tracking-tighter">
                          Waktu
                        </div>
                        <div className="truncate">
                           {format(new Date(log.createdAt), "dd/MM/yy HH:mm", {
                              locale: id,
                            })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {meta && (
        <div className="pt-4">
          <AppPagination
            currentPage={page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
};
