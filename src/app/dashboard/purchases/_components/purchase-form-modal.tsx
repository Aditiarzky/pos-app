"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSuppliers } from "@/hooks/master/use-suppliers";
import { useProducts } from "@/hooks/products/use-products";
import { useCreatePurchase } from "@/hooks/purchases/use-purchases";
import { usePurchaseForm } from "../_hooks/use-purchase-form";
import { SupplierSelect } from "@/components/ui/supplier-select";
import { NumericInput } from "@/components/ui/numeric-input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Trash2, Plus, Loader2, Search, QrCode, ScanIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import BarcodeScannerCamera from "@/components/barcode-scanner-camera";
import { useDebounce } from "@/hooks/use-debounce";
import { Separator } from "@/components/ui/separator";

interface PurchaseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseFormModal({
  open,
  onOpenChange,
}: PurchaseFormModalProps) {
  const createMutation = useCreatePurchase();
  const { data: suppliersResult } = useSuppliers();
  const suppliers = suppliersResult?.data ?? [];

  const { form, fields, append, remove, total, onSubmit } = usePurchaseForm({
    onSuccess: () => {
      onOpenChange(false);
      toast.success("Pembelian berhasil dicatat");
    },
    createMutation,
  });

  const [productSearch, setProductSearch] = useState("");
  const debouncedSearch = useDebounce(productSearch, 500);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const { data: productsResult, isLoading: isSearchLoading } = useProducts({
    params: { search: debouncedSearch, limit: 10 },
    queryConfig: { enabled: debouncedSearch.length > 2 },
  });
  const searchResults = productsResult?.data ?? [];

  const handleAddProduct = (product: any, variant: any) => {
    // Check if already in list
    const existingIndex = fields.findIndex(
      (f: any) => f.variantId === variant.id,
    );

    if (existingIndex > -1) {
      const currentQty = Number(form.getValues(`items.${existingIndex}.qty`));
      form.setValue(`items.${existingIndex}.qty`, currentQty + 1);
      toast.info(`Kuantitas ${product.name} diperbarui`);
    } else {
      append({
        productId: product.id,
        variantId: variant.id,
        qty: 1,
        price: Number(variant.sellPrice), // Use sellPrice as default purchase price? or HPP?
        productName: product.name,
        variantName: variant.name,
      } as any);
    }

    setProductSearch("");
  };

  const handleScanSuccess = (barcode: string) => {
    setIsScannerOpen(false);
    setProductSearch(barcode);
    toast.success("Barcode berhasil di-scan");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Catat Pembelian Baru</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Supplier <span className="text-red-500">*</span>
              </Label>
              <SupplierSelect
                suppliers={suppliers}
                value={form.watch("supplierId")}
                onValueChange={(v) => form.setValue("supplierId", v)}
              />
              {form.formState.errors.supplierId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.supplierId.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Item Pembelian</Label>
              <div className="flex gap-2">
                <div className="relative w-72 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-transparent pl-9 pr-10 py-1 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Cari produk / sku / barcode..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <ScanIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
                  </div>

                  {debouncedSearch.length > 2 && (
                    <div className="absolute top-full left-0 right-0 z-[100] mt-1 bg-popover border-2 border-primary/10 rounded-xl shadow-2xl p-2 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                      {isSearchLoading ? (
                        <div className="p-4 text-center">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                          <p className="text-[10px] text-muted-foreground mt-2">
                            Mencari...
                          </p>
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <p className="text-xs italic">
                            Produk tidak ditemukan
                          </p>
                        </div>
                      ) : (
                        searchResults.map((product: any) => (
                          <div key={product.id} className="p-1">
                            <p className="text-[10px] font-black uppercase text-muted-foreground px-2 py-1 tracking-widest bg-muted/50 rounded mb-1">
                              {product.name}
                            </p>
                            {product.variants?.map((variant: any) => (
                              <button
                                key={variant.id}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10 rounded-lg flex justify-between items-center transition-all border border-transparent hover:border-primary/20 hover:scale-[1.02]"
                                onClick={() =>
                                  handleAddProduct(product, variant)
                                }
                              >
                                <div className="flex flex-col">
                                  <span className="font-bold text-primary">
                                    {variant.name}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground font-mono">
                                    {variant.sku}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="font-black text-xs text-foreground">
                                    {formatCurrency(variant.sellPrice)}
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <div className="text-[10px] text-emerald-600 font-bold">
                                      STOK: {Number(product.stock).toFixed(0)}
                                    </div>
                                    {Number(product.averageCost) > 0 && (
                                      <div className="text-[8px] text-muted-foreground bg-muted px-1 rounded mt-0.5">
                                        HPP:{" "}
                                        {formatCurrency(
                                          Number(product.averageCost) *
                                            Number(variant.conversionToBase),
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10 shrink-0 shadow-sm hover:bg-primary hover:text-primary-foreground transition-all"
                  onClick={() => setIsScannerOpen(true)}
                >
                  <QrCode className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Produk</th>
                    <th className="px-4 py-2 text-center w-24">Qty</th>
                    <th className="px-4 py-2 text-right w-40">
                      Harga Beli (@)
                    </th>
                    <th className="px-4 py-2 text-right w-40">Subtotal</th>
                    <th className="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fields.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground italic"
                      >
                        Belum ada item ditambahkan.
                      </td>
                    </tr>
                  ) : (
                    fields.map((field: any, index) => {
                      const qty = Number(form.watch(`items.${index}.qty`)) || 0;
                      const price =
                        Number(form.watch(`items.${index}.price`)) || 0;
                      const subtotal = qty * price;

                      return (
                        <tr key={field.id}>
                          <td className="px-4 py-2">
                            <div className="font-medium">
                              {field.productName || `Item #${index + 1}`}
                            </div>
                            <div className="text-[10px] text-muted-foreground italic">
                              {field.variantName}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <Controller
                              name={`items.${index}.qty`}
                              control={form.control}
                              render={({ field }) => (
                                <NumericInput
                                  {...field}
                                  className="h-8 text-center"
                                  min={1}
                                />
                              )}
                            />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Controller
                              name={`items.${index}.price`}
                              control={form.control}
                              render={({ field }) => (
                                <CurrencyInput
                                  {...field}
                                  className="h-8 text-right"
                                  placeholder="0"
                                />
                              )}
                            />
                          </td>
                          <td className="px-4 py-2 text-right font-semibold">
                            {formatCurrency(subtotal)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end p-4 bg-muted/30 rounded-lg">
              <div className="text-right space-y-1">
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-tight">
                  Total Pembelian
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(total)}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || fields.length === 0}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Simpan Pembelian
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="p-0 border-none max-w-lg max-h-[90vh]">
          <BarcodeScannerCamera
            onScanSuccess={handleScanSuccess}
            onClose={() => setIsScannerOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
