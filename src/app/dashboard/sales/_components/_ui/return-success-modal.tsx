"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Printer, PlusCircle } from "lucide-react";
import { ReturnReceipt } from "./return-receipt";
import { ReturnResult } from "../../_hooks/use-return-form";
import { formatCurrency } from "@/lib/format";
import { usePrintReceipt } from "../../_hooks/use-print-receipt";

interface ReturnSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ReturnResult | null;
}

export function ReturnSuccessModal({
  isOpen,
  onClose,
  result,
}: ReturnSuccessModalProps) {
  const { receiptRef, handlePrint } = usePrintReceipt();

  if (!result) return null;

  const compensationLabels: Record<string, string> = {
    refund: "Refund Tunai",
    credit_note: "Credit Note (Saldo)",
    exchange: "Tukar Barang",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none sm:rounded-3xl">
        <div className="p-6 md:p-8 space-y-6">
          <DialogHeader className="items-center text-center space-y-4">
            <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black">
                Retur Berhasil!
              </DialogTitle>
              <p className="text-muted-foreground text-sm">{result.message}</p>
            </div>
          </DialogHeader>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-xl text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Nilai Kompensasi
              </p>
              <p className="text-lg font-black text-primary">
                {formatCurrency(result.totalValueReturned)}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-xl text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Kompensasi
              </p>
              <p className="text-sm font-bold text-primary mt-1">
                {compensationLabels[result.compensationType]}
              </p>
            </div>
          </div>

          {/* Receipt Preview */}
          <div className="bg-muted/30 p-2 md:p-4 rounded-2xl border border-dashed border-muted-foreground/20">
            <ReturnReceipt ref={receiptRef} result={result} />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 border-2 gap-2 font-bold"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" /> Cetak Nota Retur
            </Button>
            <Button
              className="h-12 gap-2 font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              onClick={onClose}
            >
              <PlusCircle className="h-5 w-5" /> Selesai
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
