"use client";

import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

type ChangeEntry = {
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
};

type AuditLog = {
  id: number;
  action: string;
  changes: ChangeEntry[] | null;
  snapshot: Record<string, unknown> | null;
  createdAt: string;
  userName: string | null;
  userId: number | null;
};

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

const PRICE_FIELDS = new Set(["sellPrice", "averageCost"]);

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (PRICE_FIELDS.has(field) || field.includes("sellPrice") || field.includes("Price")) {
    return formatCurrency(String(value));
  }
  if (field === "isActive") {
    const isActive = value === true || value === "true";
    return isActive ? "Aktif" : "Nonaktif";
  }
  return String(value);
}

function ChangeList({ changes }: { changes: ChangeEntry[] }) {
  return (
    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
      {changes.map((c, i) => (
        <li key={i} className="flex flex-wrap gap-1 items-center">
          <span className="font-medium text-foreground">{c.label}:</span>
          <span className="line-through opacity-60">{formatValue(c.field, c.oldValue)}</span>
          <span>→</span>
          <span>{formatValue(c.field, c.newValue)}</span>
        </li>
      ))}
    </ul>
  );
}

export function ProductAuditLogTab({ productId }: { productId: number }) {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["product-audit-logs", productId, page],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/products/${productId}/audit-logs?page=${page}&limit=${limit}`,
      );
      return res.data as { data: AuditLog[]; meta: { totalPages: number; total: number } };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const logs = data?.data ?? [];
  const meta = data?.meta;

  if (logs.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        Belum ada riwayat perubahan.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div
          key={log.id}
          className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-1"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge variant={ACTION_VARIANTS[log.action] ?? "secondary"} className="text-[10px]">
                {ACTION_LABELS[log.action] ?? log.action}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {log.userName ?? "Sistem"}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: localeId })}
            </span>
          </div>

          {log.changes && log.changes.length > 0 && (
            <ChangeList changes={log.changes} />
          )}
        </div>
      ))}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            {meta.total} entri
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="text-xs flex items-center px-2">
              {page} / {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
