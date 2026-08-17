"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  Printer,
  PlusCircle,
  Share2,
  Loader2,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { ReturnReceipt } from "./return-receipt";
import { ReturnResult } from "../../_hooks/use-return-form";
import { formatCurrency } from "@/lib/format";
import {
  usePrintReceipt,
  ReceiptShareInfo,
} from "../../_hooks/use-print-receipt";
import { useGetStoreSetting } from "@/hooks/store-setting/use-setting";

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
  const { receiptRef, handlePrint, isPrinting, handleShareAsImage, isSharing } =
    usePrintReceipt();
  const { data: settingResult } = useGetStoreSetting();

  if (!result) return null;

  const compensationLabels: Record<string, string> = {
    refund: "Refund Tunai",
    credit_note: "Saldo Pelanggan",
    exchange: "Tukar Barang",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg h-[92vh] flex flex-col overflow-hidden p-0 gap-0 border-border/50 shadow-2xl sm:rounded-3xl">
        {/* Header gradient banner */}
        <div className="bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent pt-7 pb-4 px-6 text-center space-y-3 relative shrink-0">
          <div className="h-16 w-16 bg-emerald-500/15 text-emerald-600 ring-8 ring-emerald-500/10 shadow-inner rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-300">
            <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
          </div>
          <DialogHeader className="items-center text-center space-y-1">
            <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Retur Berhasil Diproses
            </DialogTitle>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/80 border text-xs font-mono font-bold text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5 text-primary" />
              {result.returnNumber}
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable area — summary cards + receipt paper + actions */}
        <ScrollArea className="flex-1 min-h-0 bg-muted/20 px-4 sm:px-6 py-4">
          <div className="space-y-5 max-w-full">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 w-full mx-auto">
              <div className="p-3 bg-background border border-border/60 rounded-2xl text-center shadow-sm">
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                  {result.netRefundAmount >= 0 ? "Sisa Refund" : "Kekurangan"}
                </p>
                <p className="text-base sm:text-lg font-black text-primary tracking-tight mt-0.5">
                  {formatCurrency(Math.abs(result.netRefundAmount))}
                </p>
              </div>
              <div className="p-3 bg-background border border-border/60 rounded-2xl text-center shadow-sm">
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                  Kompensasi
                </p>
                <p className="text-xs sm:text-sm font-bold text-foreground mt-1 truncate">
                  {compensationLabels[result.compensationType] ||
                    result.compensationType}
                </p>
              </div>
            </div>

            {/* Receipt Preview Card */}
            <div className="relative mx-auto w-full">
              <div className="bg-white text-slate-900 p-3 sm:p-4 rounded-2xl shadow-lg border border-slate-200/80 relative overflow-hidden transition-all w-full">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />
                <ReturnReceipt ref={receiptRef} result={result} />
              </div>
            </div>

            {/* Quick Action Buttons: Cetak & Share */}
            <div className="grid grid-cols-2 gap-3 w-full mx-auto">
              <Button
                variant="outline"
                className="h-11 border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 gap-2 font-bold rounded-xl transition-all"
                onClick={handlePrint}
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Printer className="h-4 w-4 text-primary" />
                )}
                {isPrinting ? "Mencetak..." : "Cetak Nota"}
              </Button>

              <Button
                variant="outline"
                className="h-11 border-2 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-2 font-bold rounded-xl transition-all"
                onClick={() => {
                  const shareInfo: ReceiptShareInfo = {
                    invoiceNumber: result.returnNumber,
                    transactionDate: new Date(),
                    totalAmount: Math.abs(result.netRefundAmount),
                    storeName: settingResult?.data?.storeName,
                  };
                  handleShareAsImage(shareInfo);
                }}
                disabled={isSharing}
              >
                {isSharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                {isSharing ? "Menyiapkan..." : "Share WA"}
              </Button>
            </div>
          </div>
        </ScrollArea>

        {/* Sticky action buttons — selalu terlihat di bawah */}
        <div className="shrink-0 p-4 sm:p-5 border-t bg-background/95 backdrop-blur">
          <Button
            className="w-full h-12 gap-2 font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-xl"
            onClick={onClose}
          >
            <PlusCircle className="h-5 w-5" /> Selesai
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
