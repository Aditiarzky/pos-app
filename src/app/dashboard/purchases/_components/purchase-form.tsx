"use client";

import { useState } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { SupplierSelect } from "@/components/ui/supplier-select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Trash2, Loader2, Search, X, QrCode, Package } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import BarcodeScannerCamera from "@/components/barcode-scanner-camera";
import { useSuppliers } from "@/hooks/master/use-suppliers";
import {
  useCreatePurchase,
  useUpdatePurchase,
} from "@/hooks/purchases/use-purchases";
import { usePurchaseForm } from "../_hooks/use-purchase-form";
import { useProductSearch } from "../_hooks/use-product-search";
import { PurchaseFormItem, PurchaseFormProps } from "../_types/purchase-type";
import { ProductResponse } from "@/services/productService";
import { Switch } from "@/components/ui/switch";

export function PurchaseForm({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: PurchaseFormProps) {
  const [isMassMode, setIsMassMode] = useState(false);

  // Mutations
  const createMutation = useCreatePurchase();
  const updateMutation = useUpdatePurchase();

  // Suppliers data
  const { data: suppliersResult } = useSuppliers();
  const suppliers = suppliersResult?.data ?? [];

  // Purchase form hook
  const {
    form,
    fields,
    append,
    remove,
    total,
    isEdit,
    isSubmitting,
    onSubmit,
  } = usePurchaseForm({
    onSuccess: () => {
      toast.success(
        isEdit ? "Pembelian diperbarui" : "Pembelian berhasil dicatat",
      );

      onSuccess?.();

      if (!isMassMode || isEdit) {
        onClose();
      } else {
        // Enforce focus to search input for next entry in mass mode
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    },
    createMutation,
    updateMutation,
    initialData,
    isOpen,
  });

  // Product search hook
  const {
    searchInput,
    setSearchInput,
    debouncedSearch,
    searchResults,
    isSearching,
    isScannerOpen,
    openScanner,
    closeScanner,
    handleScanSuccess,
    searchInputRef,
  } = useProductSearch({ isOpen });

  // ============================================
  // HANDLERS
  // ============================================

  const handleAddProduct = (
    product: ProductResponse,
    variant: ProductResponse["variants"][0],
  ) => {
    const existingIndex = fields.findIndex((f) => f.variantId === variant.id);

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
      });
    }

    setSearchInput("");
    searchInputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="max-w-full sm:max-w-[95vw] md:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden "
          showCloseButton={false}
        >
          <DialogHeader className="px-6 py-4 border-b shrink-0 flex flex-row items-center justify-between space-y-0 bg-card">
            <div className="flex flex-col gap-0.5">
              <DialogTitle className="text-lg font-bold">
                {isEdit ? "Edit Pembelian" : "Catat Pembelian"}
              </DialogTitle>
              {isEdit && initialData && (
                <p className="text-xs text-muted-foreground font-medium">
                  Order:{" "}
                  <span className="text-primary">
                    {initialData.orderNumber}
                  </span>
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
            <form id="purchase-form" onSubmit={onSubmit} className="space-y-8">
              {/* Header Section: Supplier & Search */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-2">
                {/* Supplier Select */}
                <div className="md:col-span-5 space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    Supplier
                    <span className="text-destructive">*</span>
                  </Label>
                  <SupplierSelect
                    suppliers={suppliers}
                    value={form.watch("supplierId")}
                    onValueChange={(v) => form.setValue("supplierId", v)}
                  />
                  {form.formState.errors.supplierId && (
                    <p className="text-xs text-destructive font-medium">
                      {form.formState.errors.supplierId.message}
                    </p>
                  )}
                </div>

                {/* Product Search */}
                <div className="md:col-span-7 space-y-2 relative">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Cari Produk
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      ref={searchInputRef}
                      className={cn(
                        "flex h-10 w-full rounded-xl border border-input bg-muted/40 px-3 py-1 pl-10 text-sm shadow-none transition-all",
                        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20",
                        "disabled:cursor-not-allowed disabled:opacity-50 pr-12",
                      )}
                      placeholder="Nama / SKU / Scan..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full hover:bg-background/50"
                        onClick={openScanner}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Search Results Dropdown */}
                    {debouncedSearch.length > 1 && (
                      <SearchResultsDropdown
                        isSearching={isSearching}
                        searchResults={searchResults}
                        onSelectProduct={handleAddProduct}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table Section */}
              <div className="space-y-4">
                <ItemsTable
                  fields={fields}
                  form={form as unknown as UseFormReturn<PurchaseFormItem>}
                  onRemove={remove}
                />
              </div>
            </form>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/20 shrink-0 sm:flex-row items-center justify-between gap-4">
            {/* Mass Mode Toggle (Desktop only in footer, or both) */}
            {!isEdit ? (
              <div className="flex items-center gap-3 bg-white/50 dark:bg-black/50 px-3 py-1.5 rounded-full border border-border/50">
                <Label
                  htmlFor="mass-mode"
                  className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider cursor-pointer"
                >
                  Mass Mode
                </Label>
                <Switch
                  id="mass-mode"
                  checked={isMassMode}
                  onCheckedChange={setIsMassMode}
                  className="scale-75 origin-right"
                />
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
              {/* Total Summary */}
              <div className="flex flex-col items-end">
                <span className="text-[9px] uppercase text-muted-foreground font-black tracking-widest">
                  Grand Total
                </span>
                <span className="text-xl font-black text-primary leading-tight">
                  {formatCurrency(total)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  form="purchase-form"
                  type="submit"
                  className="px-8 font-black text-xs uppercase tracking-widest h-10 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isSubmitting || fields.length === 0}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEdit ? "Update" : "Simpan"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scanner Dialog */}
      <Dialog open={isScannerOpen} onOpenChange={closeScanner}>
        <DialogTitle hidden>Scan barcode</DialogTitle>
        <DialogContent className="p-0 border-none max-w-lg max-h-[90vh]">
          <BarcodeScannerCamera
            onScanSuccess={handleScanSuccess}
            onClose={closeScanner}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

// Search Results Dropdown
interface SearchResultsDropdownProps {
  isSearching: boolean;
  searchResults: ProductResponse[];
  onSelectProduct: (
    product: ProductResponse,
    variant: ProductResponse["variants"][0],
  ) => void;
}

function SearchResultsDropdown({
  isSearching,
  searchResults,
  onSelectProduct,
}: SearchResultsDropdownProps) {
  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1.5 max-h-60 overflow-y-auto rounded-md border bg-popover shadow-md text-sm">
      {isSearching ? (
        <div className="flex items-center justify-center p-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-xs">Mencari...</span>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          Tidak ditemukan.
        </div>
      ) : (
        searchResults.map((product) => (
          <div key={product.id} className="group">
            {/* Product Header */}
            <div className="px-3 py-1.5 bg-muted/50 text-xs font-bold text-muted-foreground uppercase">
              {product.name}
            </div>
            {/* Variants List */}
            {product.variants?.map((variant) => (
              <button
                key={variant.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-muted/50 border-l-2 border-transparent hover:border-primary transition-all flex justify-between items-center"
                onClick={() => onSelectProduct(product, variant)}
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
                    {formatCurrency(Number(variant.sellPrice))}
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
  );
}

// Items Table
interface ItemsTableProps {
  fields: PurchaseFormItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  onRemove: (index: number) => void;
}

function ItemsTable({ fields, form, onRemove }: ItemsTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Item Pembelian
        </Label>
        <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5">
          {fields.length} Item
        </Badge>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border border-border bg-card overflow-hidden">
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
                fields.map((field, index) => {
                  const qty = Number(form.watch(`items.${index}.qty`)) || 0;
                  const price = Number(form.watch(`items.${index}.price`)) || 0;
                  const subtotal = qty * price;

                  return (
                    <tr
                      key={field.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Product Name */}
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

                      {/* Qty Input */}
                      <td className="px-2 py-2">
                        <Controller
                          name={`items.${index}.qty`}
                          control={form.control}
                          render={({
                            field: { value, onChange },
                            fieldState,
                          }) => (
                            <div className="w-full max-w-[80px] mx-auto">
                              <Input
                                type="number"
                                min={1}
                                className="h-8 text-center text-xs px-1"
                                value={value ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "") {
                                    onChange(0);
                                    return;
                                  }
                                  const num = parseFloat(val);
                                  onChange(num);
                                }}
                              />
                              {fieldState.error && (
                                <p className="text-[10px] text-destructive mt-1 leading-tight">
                                  {fieldState.error.message}
                                </p>
                              )}
                            </div>
                          )}
                        />
                      </td>

                      {/* Price Input */}
                      <td className="px-2 py-2">
                        <Controller
                          name={`items.${index}.price`}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <div className="w-full max-w-[120px] ml-auto">
                              <CurrencyInput
                                {...field}
                                className="h-8 w-full text-right text-xs font-medium"
                                placeholder="0"
                              />
                              {fieldState.error && (
                                <p className="text-[10px] text-destructive mt-1 leading-tight text-right">
                                  {fieldState.error.message}
                                </p>
                              )}
                            </div>
                          )}
                        />
                      </td>

                      {/* Subtotal */}
                      <td className="px-2 py-2 text-right">
                        <span className="text-xs font-bold text-foreground">
                          {formatCurrency(subtotal)}
                        </span>
                      </td>

                      {/* Delete Button */}
                      <td className="px-2 py-2 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onRemove(index)}
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {fields.length === 0 ? (
          <div className="py-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 text-muted-foreground bg-muted/20">
            <Package className="h-8 w-8 opacity-20" />
            <p className="text-sm font-medium">Belum ada item dipilih</p>
          </div>
        ) : (
          fields.map((field, index) => {
            const qty = Number(form.watch(`items.${index}.qty`)) || 0;
            const price = Number(form.watch(`items.${index}.price`)) || 0;
            const subtotal = qty * price;

            return (
              <Card
                key={field.id}
                className="relative overflow-hidden group border-border shadow-sm"
              >
                <div className="p-4 space-y-4">
                  {/* Card Header: Product Info & Delete */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-sm leading-tight text-foreground">
                        {field.productName}
                      </h4>
                      <Badge
                        variant="secondary"
                        className="mt-1 text-[10px] py-0 h-4 font-medium uppercase tracking-wider"
                      >
                        {field.variantName}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-full shadow-sm hover:scale-105 transition-transform"
                      onClick={() => onRemove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="h-[1px] bg-border/50 w-full" />

                  {/* Card Body: Inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Qty Input */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Kuantitas
                      </Label>
                      <Controller
                        name={`items.${index}.qty`}
                        control={form.control}
                        render={({
                          field: { value, onChange },
                          fieldState,
                        }) => (
                          <div className="relative group/input">
                            <Input
                              type="number"
                              min={1}
                              className="h-10 text-sm font-semibold bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-lg shadow-none"
                              value={value ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  onChange(0);
                                  return;
                                }
                                const num = parseFloat(val);
                                onChange(num);
                              }}
                            />
                            {fieldState.error && (
                              <p className="text-[10px] text-destructive mt-1 font-medium">
                                {fieldState.error.message}
                              </p>
                            )}
                          </div>
                        )}
                      />
                    </div>

                    {/* Price Input */}
                    <div className="space-y-1.5 text-right">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Harga Beli
                      </Label>
                      <Controller
                        name={`items.${index}.price`}
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <div className="relative group/input">
                            <CurrencyInput
                              {...field}
                              className="h-10 w-full text-right text-sm font-bold bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-lg shadow-none"
                              placeholder="0"
                            />
                            {fieldState.error && (
                              <p className="text-[10px] text-destructive mt-1 font-medium text-right">
                                {fieldState.error.message}
                              </p>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  </div>

                  {/* Card Footer: Subtotal */}
                  <div className="pt-3 border-t border-dashed flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      Subtotal
                    </span>
                    <span className="font-black text-sm text-foreground">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
