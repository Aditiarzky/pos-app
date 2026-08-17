"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  Printer,
  Share2,
  PlusCircle,
  Loader2,
  XCircle,
  Receipt,
} from "lucide-react";
import { SaleReceipt } from "./sale-receipt";
import { SaleResponse } from "../../_types/sale-type";
import {
  usePrintReceipt,
  ReceiptShareInfo,
} from "../../_hooks/use-print-receipt";
import { useUpdateSaleStatus } from "@/hooks/sales/use-sale";
import { useGetStoreSetting } from "@/hooks/store-setting/use-setting";
import { toast } from "sonner";
import { useRef, useEffect } from "react";

interface SaleSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewTransaction: () => void;
  sale: SaleResponse | null;
}

export function SaleSuccessModal({
  isOpen,
  onClose,
  onNewTransaction,
  sale,
}: SaleSuccessModalProps) {
  const { receiptRef, handlePrint, isPrinting, handleShareAsImage, isSharing } =
    usePrintReceipt();

  const updateStatus = useUpdateSaleStatus();
  const isProcessing = useRef(false);
  const { data: settingResult } = useGetStoreSetting();

  // Reset processing flag saat sale baru dibuka
  useEffect(() => {
    if (sale?.id) isProcessing.current = false;
  }, [sale?.id]);

  if (!sale) return null;

  const isQris = sale.paymentMethod === "qris";
  const isPendingQris = sale.status === "pending_payment" && isQris;
  const canCancel = sale.status !== "cancelled" && !isQris;

  const handleComplete = async () => {
    if (!sale.id || isProcessing.current) return;
    isProcessing.current = true;
    try {
      await updateStatus.mutateAsync({ id: sale.id, action: "complete" });
      toast.success("Transaksi berhasil diselesaikan");
      onNewTransaction();
    } catch (err) {
      toast.error(
        (err as { error?: string })?.error || "Gagal menyelesaikan transaksi",
      );
      isProcessing.current = false;
    }
  };

  const handleCancel = async () => {
    if (!sale.id || isProcessing.current) return;
    isProcessing.current = true;
    try {
      await updateStatus.mutateAsync({ id: sale.id, action: "cancel" });
      toast.success("Transaksi berhasil dibatalkan");
      onClose();
      onNewTransaction();
    } catch (err) {
      toast.error(
        (err as { error?: string })?.error || "Gagal membatalkan transaksi",
      );
      isProcessing.current = false;
    }
  };

  // Auto-complete saat modal ditutup (X, klik luar, Escape) untuk QRIS pending
  const handleModalClose = (open: boolean) => {
    if (!open) {
      if (isPendingQris && sale.id && !isProcessing.current) {
        isProcessing.current = true;
        updateStatus.mutateAsync(
          { id: sale.id, action: "complete" },
          {
            onSuccess: () => toast.success("Transaksi otomatis diselesaikan"),
            onError: () => toast.error("Gagal menyelesaikan transaksi"),
          },
        );
      }
      onNewTransaction();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-md sm:max-w-lg h-[92vh] flex flex-col overflow-hidden p-0 gap-0 border-border/50 shadow-2xl sm:rounded-3xl">
        {/* Header gradient banner */}
        <div className="bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent pt-7 pb-4 px-6 text-center space-y-3 relative shrink-0">
          <div className="h-16 w-16 bg-emerald-500/15 text-emerald-600 ring-8 ring-emerald-500/10 shadow-inner rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-300">
            <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
          </div>
          <DialogHeader className="items-center text-center space-y-1">
            <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Transaksi Berhasil
            </DialogTitle>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/80 border text-xs font-mono font-bold text-muted-foreground">
              <Receipt className="h-3.5 w-3.5 text-primary" />
              {sale.invoiceNumber}
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable area — receipt paper + print & share */}
        <ScrollArea className="flex-1 min-h-0 bg-muted/20 px-4 sm:px-6 py-4">
          <div className="space-y-5 max-w-full">
            {/* Receipt Preview Card */}
            <div className="relative mx-auto w-full">
              <div className="bg-white text-slate-900 p-3 sm:p-4 rounded-2xl shadow-lg border border-slate-200/80 relative overflow-hidden transition-all w-full">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />
                <SaleReceipt ref={receiptRef} sale={sale} />
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
                    invoiceNumber: sale.invoiceNumber,
                    transactionDate: sale.createdAt ?? new Date(),
                    cashierName: sale.user?.name,
                    totalAmount:
                      Number(sale.totalPrice) -
                      Number(sale.totalBalanceUsed ?? 0),
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
          {isPendingQris && (
            <div
              className={cn(
                "grid gap-3",
                isQris ? "grid-cols-1" : "grid-cols-2",
              )}
            >
              {!isQris && (
                <Button
                  variant="outline"
                  className="h-12 border-2 border-destructive/80 text-destructive hover:bg-destructive/10 gap-2 font-bold rounded-xl"
                  onClick={handleCancel}
                  disabled={updateStatus.isPending}
                >
                  {updateStatus.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  Batalkan Transaksi
                </Button>
              )}

              <Button
                className="h-12 gap-2 font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 rounded-xl"
                onClick={handleComplete}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                Selesai
              </Button>
            </div>
          )}

          {!isPendingQris && (
            <div
              className={cn(
                "grid gap-3",
                canCancel ? "grid-cols-2" : "grid-cols-1",
              )}
            >
              {canCancel && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 border-2 border-destructive/80 text-destructive hover:bg-destructive/10 gap-2 font-bold rounded-xl"
                      disabled={updateStatus.isPending}
                    >
                      {updateStatus.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                      Batalkan Transaksi
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Batalkan transaksi ini?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Stok akan dikembalikan dan transaksi akan dihapus dari
                        riwayat.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">
                        Tidak
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        className="bg-destructive hover:bg-destructive/90 rounded-xl"
                      >
                        Ya, Batalkan
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Button
                className="h-12 gap-2 font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-xl"
                onClick={onNewTransaction}
              >
                <PlusCircle className="h-5 w-5" /> Transaksi Baru
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
