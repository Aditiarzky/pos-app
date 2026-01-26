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
import { Trash2, Plus, Loader2, Search } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

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

  const { form, fields, append, remove, totalAmount, onSubmit } =
    usePurchaseForm({
      onSuccess: () => {
        onOpenChange(false);
        toast.success("Pembelian berhasil dicatat");
      },
      createMutation,
    });

  const [productSearch, setProductSearch] = useState("");
  const { data: productsResult } = useProducts({
    params: { search: productSearch, limit: 5 },
    queryConfig: { enabled: productSearch.length > 2 },
  });
  const searchResults = productsResult?.data ?? [];

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
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-8 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Cari produk untuk ditambah..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />

                {searchResults.length > 0 && productSearch.length > 2 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg p-1 max-h-48 overflow-y-auto">
                    {searchResults.map((product: any) => (
                      <button
                        key={product.id}
                        type="button"
                        className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm flex flex-col"
                        onClick={() => {
                          const variant = product.variants?.[0];
                          if (variant) {
                            append({
                              productId: product.id,
                              variantId: variant.id,
                              qty: 1,
                              price: variant.sellPrice,
                              // Extra info for display
                              productName: product.name,
                              variantName: variant.name,
                            } as any);
                            setProductSearch("");
                          }
                        }}
                      >
                        <span className="font-medium">{product.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {product.sku} - {product.variants?.[0]?.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
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
                  {formatCurrency(totalAmount)}
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
    </Dialog>
  );
}
