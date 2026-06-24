"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Printer,
  Share2,
  PlusCircle,
  Loader2,
  XCircle,
} from "lucide-react";
import { SaleReceipt } from "./sale-receipt";
import { SaleResponse } from "../../_types/sale-type";
import { usePrintReceipt } from "../../_hooks/use-print-receipt";
import { useUpdateSaleStatus } from "@/hooks/sales/use-sale";
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

  // Reset processing flag saat sale baru dibuka
  useEffect(() => {
    if (sale?.id) isProcessing.current = false;
  }, [sale?.id]);

  if (!sale) return null;

  const isPending = sale.status === "pending_payment";

  const handleComplete = async () => {
    if (!sale.id || isProcessing.current) return;
    isProcessing.current = true;
    toast.promise(
      updateStatus.mutateAsync({ id: sale.id, action: "complete" }),
      {
        loading: "Menyelesaikan transaksi...",
        success: "Transaksi berhasil diselesaikan",
        error: (err) => err?.error || "Gagal menyelesaikan transaksi",
      },
    );
    onNewTransaction();
  };

  const handleCancel = async () => {
    if (!sale.id || isProcessing.current) return;
    isProcessing.current = true;
    toast.promise(
      updateStatus.mutateAsync({ id: sale.id, action: "cancel" }),
      {
        loading: "Membatalkan transaksi...",
        success: "Transaksi berhasil dibatalkan",
        error: (err) => err?.error || "Gagal membatalkan transaksi",
      },
    );
    onNewTransaction();
  };

  // Auto-complete saat modal ditutup (X, klik luar, Escape) saat masih pending
  const handleModalClose = (open: boolean) => {
    if (!open) {
      if (isPending && sale.id && !isProcessing.current) {
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
      <DialogContent
        className="max-w-xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 gap-0 border-none sm:rounded-3xl"
      >
        <div className="p-6 md:p-8 space-y-6">
          <DialogHeader className="items-center text-center space-y-4">
            <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black">
                Nota Pembayaran
              </DialogTitle>
              <p className="text-muted-foreground text-sm">
                Periksa nota, lalu konfirmasi atau batalkan transaksi.
              </p>
            </div>
          </DialogHeader>

          {/* Receipt Preview */}
          <div className="bg-muted/30 bg-white p-2 md:p-4 rounded-2xl border border-dashed border-muted-foreground/20">
            <SaleReceipt ref={receiptRef} sale={sale} />
          </div>

          {/* Print / Share */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-11 border-2 gap-2 font-bold"
              onClick={handlePrint}
              disabled={isPrinting}
            >
              {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              {isPrinting ? "Mencetak..." : "Cetak Nota"}
            </Button>

            <Button
              variant="outline"
              className="h-11 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 gap-2 font-bold"
              onClick={handleShareAsImage}
              disabled={isSharing}
            >
              {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              {isSharing ? "Menyiapkan..." : "Share WA"}
            </Button>
          </div>

          {/* Confirm / Cancel actions */}
          {isPending && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <Button
                variant="outline"
                className="h-12 border-2 border-destructive text-destructive hover:bg-destructive/10 gap-2 font-bold"
                onClick={handleCancel}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-5 w-5" />}
                Batalkan Transaksi
              </Button>

              <Button
                className="h-12 gap-2 font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                onClick={handleComplete}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                Selesai
              </Button>
            </div>
          )}

          {/* Jika sudah bukan pending (misal QRIS completed via webhook) */}
          {!isPending && (
            <Button
              className="w-full h-12 gap-2 font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              onClick={onNewTransaction}
            >
              <PlusCircle className="h-5 w-5" /> Transaksi Baru
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
