"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export interface InsufficientStockItem {
  variantId?: number;
  productId: number;
  productName: string;
  variantName: string;
  qty: number;
  requestedQty: number;
  currentStock: number;
  difference: number;
  conversionToBase: number;
}

interface StockWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InsufficientStockItem[];
  onAdjustStock: () => Promise<void>;
  isAdjusting: boolean;
}

export function StockWarningModal({
  isOpen,
  onClose,
  items,
  onAdjustStock,
  isAdjusting,
}: StockWarningModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !isAdjusting && !open && onClose()}
    >
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-4 sm:p-6">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            <DialogTitle className="text-lg sm:text-xl font-bold">
              Stok Tidak Mencukupi
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm">
            Beberapa produk di keranjang memiliki stok yang kurang di sistem.
            Silakan pilih tindakan untuk melanjutkan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-2">
          <div className="rounded-md border overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Produk</TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Tersedia
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Diminta
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Kurang
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={`${item.productId}-${index}`}>
                    <TableCell>
                      <div className="font-medium text-xs sm:text-sm">
                        {item.productName}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        {item.variantName}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-xs sm:text-sm">
                      {item.currentStock / item.conversionToBase}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary text-xs sm:text-sm">
                      {item.requestedQty / item.conversionToBase}
                    </TableCell>
                    <TableCell className="text-right font-bold text-destructive text-xs sm:text-sm">
                      {item.difference / item.conversionToBase}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-6 shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isAdjusting}
            className="w-full sm:w-auto"
          >
            Batal & Edit Keranjang
          </Button>
          <Button
            onClick={onAdjustStock}
            disabled={isAdjusting}
            className="w-full sm:w-auto font-bold"
          >
            {isAdjusting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyesuaikan...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Sesuaikan Stok
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
