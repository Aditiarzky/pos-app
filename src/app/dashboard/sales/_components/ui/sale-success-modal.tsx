"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Printer, Share2, PlusCircle } from "lucide-react";
import { SaleReceipt } from "./sale-receipt";
import { SaleResponse } from "../../_types/sale-type";
import { formatCurrency } from "@/lib/format";
import { usePrintReceipt } from "../../_hooks/use-print-receipt";

interface SaleSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleResponse | null;
}

export function SaleSuccessModal({
  isOpen,
  onClose,
  sale,
}: SaleSuccessModalProps) {
  const { receiptRef, handlePrint } = usePrintReceipt();

  if (!sale) return null;

  const handleShareWhatsApp = () => {
    const totalAmount = formatCurrency(
      Number(sale.totalPrice) - Number(sale.totalBalanceUsed),
    );
    const itemsList =
      sale.items
        ?.map(
          (item) => `- ${item.product?.name} (${Number(item.qty).toFixed(0)}x)`,
        )
        .join("%0A") || "";

    const message =
      `*NOTA PENJUALAN - TOKO ADITIARZKY*%0A%0A` +
      `No: ${sale.invoiceNumber}%0A` +
      `Total: *${totalAmount}*%0A%0A` +
      `Items:%0A${itemsList}%0A%0A` +
      `Terima kasih telah berbelanja!`;

    window.open(`https://wa.me/?text=${message}`, "_blank");
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
                Transaksi Berhasil!
              </DialogTitle>
              <p className="text-muted-foreground">
                Pembayaran telah diterima dan stok telah diperbarui.
              </p>
            </div>
          </DialogHeader>

          {/* Receipt Preview */}
          <div className="bg-muted/30 p-2 md:p-4 rounded-2xl border border-dashed border-muted-foreground/20">
            <SaleReceipt ref={receiptRef} sale={sale} />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 border-2 gap-2 font-bold"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" /> Cetak Nota
            </Button>
            <Button
              variant="outline"
              className="h-12 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 gap-2 font-bold"
              onClick={handleShareWhatsApp}
            >
              <Share2 className="h-4 w-4" /> Share WA
            </Button>
            <Button
              className="h-12 md:col-span-2 gap-2 font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              onClick={onClose}
            >
              <PlusCircle className="h-5 w-5" /> Transaksi Baru
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
