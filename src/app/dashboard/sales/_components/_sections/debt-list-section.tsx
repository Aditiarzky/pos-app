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

interface DebtListSectionProps {
  viewMode?: "table" | "card";
  search?: string;
}

export function DebtListSection({
  viewMode = "table",
  search = "",
}: DebtListSectionProps) {
  const { debts, isLoading } = useDebts({
    status: "active",
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

  if (activeDebts.length === 0) {
    if (search) {
      return (
        <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
          Tidak ada piutang ditemukan untuk pencarian ini.
        </div>
      );
    }
    return null;
  }

  const totalDebt = activeDebts.reduce(
    (acc, curr) => acc + Number(curr.remainingAmount),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          Piutang Belum Lunas
        </h3>
        <div className="text-sm font-medium">
          Total Piutang:{" "}
          <span className="text-destructive font-bold">
            {formatCurrency(totalDebt)}
          </span>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="rounded-md border overflow-hidden bg-background shadow-sm">
          <Table>
            <TableHeader className="bg-destructive/5 text-destructive-foreground">
              <TableRow>
                <TableHead className="text-destructive">Tanggal</TableHead>
                <TableHead className="text-destructive">Invoice</TableHead>
                <TableHead className="text-destructive">Customer</TableHead>
                <TableHead className="text-right text-destructive">
                  Total Hutang
                </TableHead>
                <TableHead className="text-right text-destructive">
                  Sisa
                </TableHead>
                <TableHead className="text-center text-destructive">
                  Status
                </TableHead>
                <TableHead className="text-right text-destructive w-24">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeDebts.map((debt) => (
                <TableRow key={debt.id}>
                  <TableCell>{formatDate(debt.createdAt)}</TableCell>
                  <TableCell className="font-medium font-mono text-xs">
                    {debt.sale?.invoiceNumber}
                  </TableCell>
                  <TableCell>{debt.customer?.name}</TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {formatCurrency(Number(debt.originalAmount))}
                  </TableCell>
                  <TableCell className="text-right font-bold text-destructive tabular-nums">
                    {formatCurrency(Number(debt.remainingAmount))}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        debt.status === "partial" ? "secondary" : "destructive"
                      }
                      className="capitalize"
                    >
                      {getStatusName(debt.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeDebts.map((debt) => (
            <div
              key={debt.id}
              className="p-4 bg-background rounded-xl border border-destructive/10 hover:shadow-md transition-all space-y-3 relative group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono text-xs font-bold text-destructive bg-destructive/5 px-2 py-0.5 rounded-full inline-block mb-1">
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
                <div className="text-sm font-bold truncate">
                  {debt.customer?.name || "-"}
                </div>
                <div className="flex justify-between items-end mt-2">
                  <div className="grid gap-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                      Sisa Tagihan
                    </span>
                    <span className="text-lg font-black text-destructive tabular-nums">
                      {formatCurrency(Number(debt.remainingAmount))}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 bg-destructive hover:bg-destructive/90 text-xs font-bold px-4"
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
