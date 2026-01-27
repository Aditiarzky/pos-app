"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSuppliers } from "@/hooks/master/use-suppliers";
import { useProducts } from "@/hooks/products/use-products";
import {
  useCreatePurchase,
  useUpdatePurchase,
} from "@/hooks/purchases/use-purchases";
import { usePurchaseForm } from "../_hooks/use-purchase-form";
import { SupplierSelect } from "@/components/ui/supplier-select";
import { NumericInput } from "@/components/ui/numeric-input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Trash2, Loader2, Search, X, QrCode, Package } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import BarcodeScannerCamera from "@/components/barcode-scanner-camera";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface PurchaseFormProps {
  onCancel: () => void;
  initialData?: any;
}

export function PurchaseForm({ onCancel, initialData }: PurchaseFormProps) {
  const createMutation = useCreatePurchase();
  const updateMutation = useUpdatePurchase();
  const { data: suppliersResult } = useSuppliers();
  const suppliers = suppliersResult?.data ?? [];

  const { form, fields, append, remove, total, isEdit, onSubmit } =
    usePurchaseForm({
      onSuccess: () => {
        toast.success(
          isEdit ? "Pembelian diperbarui" : "Pembelian berhasil dicatat",
        );
        onCancel();
      },
      createMutation,
      updateMutation,
      initialData,
    });

  const [productSearch, setProductSearch] = useState("");
  const debouncedSearch = useDebounce(productSearch, 300); // Percepat debounce
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: productsResult, isLoading: isSearchLoading } = useProducts({
    params: { search: debouncedSearch, limit: 10 },
    queryConfig: { enabled: debouncedSearch.length > 1 }, // Lebih cepat muncul
  });
  const searchResults = productsResult?.data ?? [];

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleAddProduct = (product: any, variant: any) => {
    const existingIndex = fields.findIndex(
      (f: any) => f.variantId === variant.id,
    );

    if (existingIndex > -1) {
      const currentQty = Number(form.getValues(`items.${existingIndex}.qty`));
      form.setValue(`items.${existingIndex}.qty`, currentQty + 1);
      toast.info(`Qty ${product.name} diperbarui`);
    } else {
      append({
        productId: product.id,
        variantId: variant.id,
        qty: 1,
        price: Number(variant.sellPrice),
        productName: product.name,
        variantName: variant.name,
      } as any);
    }

    setProductSearch("");
    searchInputRef.current?.focus();
  };

  const handleScanSuccess = (barcode: string) => {
    setIsScannerOpen(false);
    setProductSearch(barcode);
    toast.success("Barcode terbaca");
  };

  return (
    <Card className="border-border shadow-none w-full mx-auto">
      <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0 border-b">
        <div>
          <CardTitle className="text-lg font-bold">
            {isEdit ? "Edit Pembelian" : "Catat Pembelian"}
          </CardTitle>
          {isEdit && (
            <p className="text-xs text-muted-foreground mt-1">
              No. {initialData.orderNumber}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Header Section: Supplier & Search */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4 space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Supplier
              </Label>
              <SupplierSelect
                suppliers={suppliers}
                value={form.watch("supplierId")}
                onValueChange={(v) => form.setValue("supplierId", v)}
              />
            </div>

            <div className="md:col-span-8 space-y-1.5 relative">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cari Produk
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  className={cn(
                    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    "pr-20",
                  )}
                  placeholder="Nama / SKU / Scan..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                <div className="absolute right-1 top-1.5 flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsScannerOpen(true)}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Search Results Dropdown */}
                {debouncedSearch.length > 1 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1.5 max-h-60 overflow-y-auto rounded-md border bg-popover shadow-md text-sm">
                    {isSearchLoading ? (
                      <div className="flex items-center justify-center p-4 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-xs">Mencari...</span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Tidak ditemukan.
                      </div>
                    ) : (
                      searchResults.map((product: any) => (
                        <div key={product.id} className="group">
                          {/* Product Header */}
                          <div className="px-3 py-1.5 bg-muted/50 text-xs font-bold text-muted-foreground uppercase">
                            {product.name}
                          </div>
                          {/* Variants List */}
                          {product.variants?.map((variant: any) => (
                            <button
                              key={variant.id}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-muted/50 border-l-2 border-transparent hover:border-primary transition-all flex justify-between items-center"
                              onClick={() => handleAddProduct(product, variant)}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">
                                  {variant.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  SKU: {variant.sku}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-xs text-foreground">
                                  {formatCurrency(variant.sellPrice)}
                                </div>
                                <div className="flex flex-col items-end">
                                  <div className="text-[9px] text-emerald-600 font-bold">
                                    Stok: {Number(product.stock).toFixed(0)}
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
            </div>
          </div>

          {/* Items List Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Item Pembelian
              </Label>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5">
                {fields.length} Item
              </Badge>
            </div>

            {/* Responsive Table Container */}
            <div className="rounded-md border border-border bg-card overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-[11px] uppercase min-w-[200px]">
                        Produk
                      </th>
                      <th className="px-2 py-2 text-center font-medium text-[11px] uppercase w-20">
                        Qty
                      </th>
                      <th className="px-2 py-2 text-right font-medium text-[11px] uppercase min-w-[120px]">
                        Harga Beli
                      </th>
                      <th className="px-2 py-2 text-right font-medium text-[11px] uppercase min-w-[120px]">
                        Subtotal
                      </th>
                      <th className="px-2 py-2 text-center font-medium text-[11px] uppercase w-10">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {fields.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Package className="h-6 w-6 opacity-20" />
                            <p className="text-xs italic">Belum ada item.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      fields.map((field: any, index) => {
                        const qty =
                          Number(form.watch(`items.${index}.qty`)) || 0;
                        const price =
                          Number(form.watch(`items.${index}.price`)) || 0;
                        const subtotal = qty * price;

                        return (
                          <tr
                            key={field.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            {/* Nama Produk & Variant */}
                            <td className="px-4 py-2">
                              <div className="font-medium text-foreground text-xs">
                                {field.productName}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                <span className="bg-muted px-1 rounded py-0.5">
                                  {field.variantName}
                                </span>
                              </div>
                            </td>

                            {/* Qty Input (Compact) */}
                            <td className="px-2 py-2">
                              <Controller
                                name={`items.${index}.qty`}
                                control={form.control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    type="number"
                                    className="h-8 w-full text-center text-xs font-medium"
                                    min={1}
                                  />
                                )}
                              />
                            </td>

                            {/* Price Input (Compact) */}
                            <td className="px-2 py-2">
                              <Controller
                                name={`items.${index}.price`}
                                control={form.control}
                                render={({ field }) => (
                                  <CurrencyInput
                                    {...field}
                                    className="h-8 w-full text-right text-xs font-medium"
                                    placeholder="0"
                                  />
                                )}
                              />
                            </td>

                            {/* Subtotal */}
                            <td className="px-2 py-2 text-right">
                              <span className="text-xs font-bold text-foreground">
                                {formatCurrency(subtotal)}
                              </span>
                            </td>

                            {/* Action */}
                            <td className="px-2 py-2 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Summary (Compact) */}
            <div className="flex items-center justify-end border-t pt-3">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                  Total Pembayaran
                </span>
                <span className="text-xl font-bold text-foreground">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              className="min-w-[140px]"
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                fields.length === 0
              }
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isEdit ? "Update Data" : "Simpan"}
            </Button>
          </div>
        </form>
      </CardContent>

      {/* Scanner Dialog */}
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogTitle hidden>Scan barcode</DialogTitle>
        <DialogContent className="p-0 border-none max-w-lg max-h-[90vh]">
          <BarcodeScannerCamera
            onScanSuccess={handleScanSuccess}
            onClose={() => setIsScannerOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
