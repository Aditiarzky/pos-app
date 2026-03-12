"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { useDebts } from "@/hooks/debt/use-debts";
import { useState } from "react";
import { Debt } from "@/services/debtService";
import { DebtPaymentDialog } from "../debt-payment-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { FilterWrap } from "@/components/filter-wrap";
import { DebtFilterForm } from "../_ui/debt-filter-form";

interface DebtListSectionProps {
  viewMode?: "table" | "card";
  search?: string;
}

export function DebtListSection({
  viewMode = "table",
  search = "",
}: DebtListSectionProps) {
  const [statusFilter, setStatusFilter] = useState<"active" | "unpaid" | "partial">(
    "active",
  );
  const [customerId, setCustomerId] = useState<number | undefined>();

  const { debts, isLoading } = useDebts({
    status: statusFilter,
    customerId,
    search: search || undefined,
  });

  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handlePay = (debt: Debt) => {
    setSelectedDebt(debt);
    setIsDialogOpen(true);
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case "unpaid":
        return "Belum Lunas";
      case "partial":
        return "Nyicil";
      case "paid":
        return "Lunas";
      default:
        return status;
    }
  };

  if (isLoading) {
    return <DebtLoading />;
  }

  const activeDebts = debts || [];

  const hasActiveFilters = statusFilter !== "active" || !!customerId;

  const resetFilters = () => {
    setStatusFilter("active");
    setCustomerId(undefined);
  };

  const totalDebt = activeDebts.reduce(
    (acc, curr) => acc + Number(curr.remainingAmount),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2 w-full text-destructive">
          <AlertCircle className="h-5 w-5" />
          Piutang Belum Lunas
        </h3>
        <div className="flex items-center gap-2 md:justify-end justify-between w-full">
          <FilterWrap hasActiveFilters={hasActiveFilters}>
            <DebtFilterForm
              status={statusFilter}
              setStatus={setStatusFilter}
              customerId={customerId}
              setCustomerId={setCustomerId}
              resetFilters={resetFilters}
              isDropdown
            />
          </FilterWrap>
          <div className="text-sm font-medium">
            Total Piutang:{" "}
            <span className="text-destructive font-bold">
              {formatCurrency(totalDebt)}
            </span>
          </div>
        </div>
      </div>
      {activeDebts.length === 0 && <DebtEmpty searchInput={search} />}
      {activeDebts.length > 0 && viewMode === "table" ? (
        <div className="overflow-hidden bg-background">
          <Table>
            <TableHeader className="bg-muted/20 border-t border-b border-border/50">
              <TableRow className="border-none">
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Tanggal</TableHead>
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Invoice</TableHead>
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Customer</TableHead>
                <TableHead className="text-right text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                  Total Hutang
                </TableHead>
                <TableHead className="text-right text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                  Sisa
                </TableHead>
                <TableHead className="text-center text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </TableHead>
                <TableHead className="text-right w-24 text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeDebts.map((debt) => (
                <TableRow key={debt.id} className="hover:bg-muted/50 transition-colors border-b border-border/30 last:border-none">
                  <TableCell className="text-[12px] sm:text-xs px-2 sm:px-4 py-2 font-semibold text-muted-foreground">{formatDate(debt.createdAt)}</TableCell>
                  <TableCell className="font-medium font-mono text-[12px] sm:text-xs px-2 sm:px-4 py-2">
                    {debt.sale?.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-[12px] sm:text-sm px-2 sm:px-4 py-2 font-semibold">{debt.customer?.name}</TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums text-[12px] sm:text-sm px-2 sm:px-4 py-2">
                    {formatCurrency(Number(debt.originalAmount))}
                  </TableCell>
                  <TableCell className="text-right font-bold text-destructive tabular-nums text-[12px] sm:text-sm px-2 sm:px-4 py-2">
                    {formatCurrency(Number(debt.remainingAmount))}
                  </TableCell>
                  <TableCell className="text-center px-2 sm:px-4 py-2">
                    <Badge
                      variant={
                        debt.status === "partial" ? "secondary" : "destructive"
                      }
                      className="capitalize"
                    >
                      {getStatusName(debt.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-2 sm:px-4 py-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 bg-destructive hover:bg-destructive/90"
                      onClick={() => handlePay(debt)}
                    >
                      Bayar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* CARD VIEW FOR DEBT */
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {activeDebts.map((debt) => (
            <div
              key={debt.id}
              className="p-2.5 sm:p-4 bg-background rounded-xl border border-destructive/10 shadow-sm hover:shadow-md transition-all space-y-2 sm:space-y-3 relative group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono text-[10px] sm:text-xs font-bold text-destructive bg-destructive/5 px-2 py-0.5 rounded-full inline-block mb-1">
                    {debt.sale?.invoiceNumber}
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    {formatDate(debt.createdAt)}
                  </div>
                </div>
                <Badge
                  variant={
                    debt.status === "partial" ? "secondary" : "destructive"
                  }
                  className="text-[10px]"
                >
                  {getStatusName(debt.status)}
                </Badge>
              </div>

              <div>
                <div className="text-xs sm:text-sm font-bold truncate">
                  {debt.customer?.name || "-"}
                </div>
                <div className="flex justify-between items-end mt-2">
                  <div className="grid gap-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                      Sisa Tagihan
                    </span>
                    <span className="text-sm sm:text-lg font-black text-destructive tabular-nums">
                      {formatCurrency(Number(debt.remainingAmount))}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="h-7 sm:h-8 bg-destructive hover:bg-destructive/90 text-[10px] sm:text-xs font-bold px-2.5 sm:px-4"
                    onClick={() => handlePay(debt)}
                  >
                    BAYAR
                  </Button>
                </div>
              </div>

              {/* Original Amount Indicator */}
              <div className="text-[10px] text-muted-foreground pt-2 border-t border-dashed flex justify-between">
                <span>Total Awal:</span>
                <span className="tabular-nums">
                  {formatCurrency(Number(debt.originalAmount))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <DebtPaymentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        debt={selectedDebt}
      />
    </div>
  );
}

function DebtLoading() {
  return <Skeleton className="h-32 w-full" />;
}

function DebtEmpty({ searchInput }: { searchInput?: string }) {
  return (
    <div className="p-12 text-center text-muted-foreground border border-dashed rounded-xl">
      {searchInput
        ? `Tidak ada data piutang ditemukan untuk "${searchInput}"`
        : "Tidak ada data piutang."}
    </div>
  );
}
