"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { Debt } from "@/services/debtService";
import { usePayDebt } from "@/hooks/debt/use-debts";
import { useState, useEffect } from "react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ApiResponse } from "@/services/productService";

interface DebtPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debt | null;
}

export function DebtPaymentDialog({
  open,
  onOpenChange,
  debt,
}: DebtPaymentDialogProps) {
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const payMutation = usePayDebt();

  useEffect(() => {
    if (open) {
      setAmount(0);
      setNote("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debt) return;

    if (amount <= 0) {
      toast.error("Jumlah pembayaran harus lebih dari 0");
      return;
    }

    if (amount > Number(debt.remainingAmount)) {
      toast.error("Jumlah pembayaran melebihi sisa hutang");
      return;
    }

    try {
      await payMutation.mutateAsync({
        debtId: debt.id,
        data: {
          amount,
          note,
          paymentDate: new Date(),
        },
      });
      toast.success("Pembayaran berhasil dicatat");
      onOpenChange(false);
    } catch (error) {
      toast.error((error as ApiResponse).error || "Gagal mencatat pembayaran");
    }
  };

  if (!debt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pelunasan Hutang</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-semibold">{debt.customer?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invoice</span>
              <span className="font-mono">{debt.sale?.invoiceNumber}</span>
            </div>
            <div className="border-t my-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Hutang</span>
              <span>{formatCurrency(Number(debt.originalAmount))}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-destructive">
              <span>Sisa Hutang</span>
              <span>{formatCurrency(Number(debt.remainingAmount))}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Jumlah Pembayaran</Label>
            <CurrencyInput
              value={amount}
              onChange={(val) => setAmount(Number(val))}
              placeholder="Rp 0"
              className="font-bold text-lg"
              autoFocus
            />
            <div className="flex gap-2 mt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(Number(debt.remainingAmount))}
              >
                Bayar Lunas
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(Number(debt.remainingAmount) / 2)}
              >
                50%
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Catatan (Opsional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Transfer BCA"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={payMutation.isPending || amount <= 0}
            >
              {payMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Simpan Pembayaran
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
