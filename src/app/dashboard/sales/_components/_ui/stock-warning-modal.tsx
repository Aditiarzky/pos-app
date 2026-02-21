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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertCircle className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold">
              Stok Tidak Mencukupi
            </DialogTitle>
          </div>
          <DialogDescription>
            Beberapa produk di keranjang memiliki stok yang kurang di sistem.
            Silakan pilih tindakan untuk melanjutkan.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Tersedia</TableHead>
                  <TableHead className="text-right">Diminta</TableHead>
                  <TableHead className="text-right">Kurang</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={`${item.productId}-${index}`}>
                    <TableCell>
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.variantName}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {item.currentStock}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {item.requestedQty}
                    </TableCell>
                    <TableCell className="text-right font-bold text-destructive">
                      {item.difference}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
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
                Menyesuaikan Stok...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Sesuaikan Stok Otomatis
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
