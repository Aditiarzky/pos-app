"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerSelect } from "@/components/ui/customer-select";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Trash2,
  Loader2,
  Search,
  QrCode,
  Percent,
  LayoutGrid,
  List,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import BarcodeScannerCamera from "@/components/barcode-scanner-camera";
import { useCreateSale } from "@/hooks/sales/use-sale";
import { useSaleForm } from "../_hooks/use-sale-form";
import { useProductSearch } from "../_hooks/use-product-search";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductResponse } from "@/services/productService";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface TransactionFormProps {
  onSuccess?: () => void;
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const createMutation = useCreateSale();
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Use isOpen=true because this form is always visible/active in the page context
  const {
    form,
    fields,
    append,
    remove,
    total, // Subtotal items
    grandTotal,
    change,
    isSubmitting,
    onSubmit,
  } = useSaleForm({
    onSuccess,
    createMutation,
    isOpen: true,
  });

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
    lastScannedBarcode,
    setLastScannedBarcode,
  } = useProductSearch({ isOpen: true, autoFocusOnMount: false });

  // Auto-add item when barcode is scanned
  useEffect(() => {
    if (lastScannedBarcode && searchResults.length > 0) {
      const product = searchResults[0];
      if (product) {
        // Try to find matching variant
        const matchedVariant =
          product.variants.find((v) => v.sku === lastScannedBarcode) ||
          product.variants[0];

        if (matchedVariant) {
          handleAddProduct(product, matchedVariant);
          setLastScannedBarcode(null); // Reset after adding
          toast.success("Item ditambahkan otomatis");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults, lastScannedBarcode]);

  // HANDLERS
  const handleAddProduct = (
    product: ProductResponse,
    variant: ProductResponse["variants"][0],
  ) => {
    const existingIndex = fields.findIndex((f) => f.variantId === variant.id);

    if (existingIndex > -1) {
      const currentQty = Number(form.getValues(`items.${existingIndex}.qty`));
      const currentStock = Number(product.stock);
      const newQty = currentQty + 1;
      const qtyInBaseKey = newQty * Number(variant.conversionToBase);

      if (qtyInBaseKey > currentStock) {
        // toast.error("Stok tidak mencukupi");
        // Allow adding but maybe show visual warning or block submit?
        // For now, let zod schema validation handle strict check or API
        // But good UX is to prevent here.
      }

      form.setValue(`items.${existingIndex}.qty`, newQty);
    } else {
      append({
        productId: product.id,
        variantId: variant.id,
        qty: 1,
        price: Number(variant.sellPrice),
        productName: product.name,
        variantName: variant.name,
        sku: variant.sku,
        currentStock: Number(product.stock),
        image: product.image,
        variants: product.variants,
      });
    }
    setSearchInput("");
    searchInputRef.current?.focus();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-start">
        {/* LEFT COLUMN: Items & Search */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* SEARCH BAR */}
          <Card className="p-4 flex flex-col gap-4">
            <div className="relative">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Cari Produk
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  className={cn(
                    "flex h-12 w-full rounded-xl border border-input bg-muted/20 px-3 py-1 pl-10 text-base shadow-sm transition-all focus:bg-background",
                    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    "disabled:cursor-not-allowed disabled:opacity-50 pr-12",
                  )}
                  placeholder="Scan Barcode / Ketik Nama Produk..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
                    onClick={openScanner}
                  >
                    <QrCode className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* SEARCH RESULTS */}
              {debouncedSearch.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-[400px] overflow-y-auto rounded-xl border bg-popover shadow-xl animate-in fade-in zoom-in-95 duration-200">
                  {isSearching ? (
                    <div className="flex items-center justify-center p-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span>Mencari...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Produk tidak ditemukan.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {searchResults.map((product) => (
                        <div key={product.id} className="bg-card">
                          <div className="px-4 py-2 bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            {product.image && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-6 w-6 rounded-sm object-cover border"
                              />
                            )}
                            {product.name}
                          </div>
                          <div>
                            {product.variants?.map((variant) => (
                              <button
                                key={variant.id}
                                type="button"
                                className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors flex justify-between items-center group"
                                onClick={() =>
                                  handleAddProduct(product, variant)
                                }
                              >
                                <div>
                                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {variant.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                    {variant.sku}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-primary">
                                    {formatCurrency(Number(variant.sellPrice))}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground mt-0.5">
                                    Stok: {Number(product.stock).toFixed(0)}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* ITEMS LIST */}
          <Card className="flex-1 min-h-[300px] max-h-[400px] p-0 gap-0 overflow-hidden flex flex-col">
            <div className="p-4 bg-muted/10 border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Label className="font-bold uppercase tracking-wider text-muted-foreground text-xs">
                  Keranjang Belanja
                </Label>
                <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-6 w-6 rounded-md",
                      viewMode === "table" && "bg-background shadow-sm",
                    )}
                    onClick={() => setViewMode("table")}
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-6 w-6 rounded-md",
                      viewMode === "card" && "bg-background shadow-sm",
                    )}
                    onClick={() => setViewMode("card")}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <Badge variant="secondary">{fields.length} Item</Badge>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
              {fields.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 p-8 opacity-50">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Search className="h-8 w-8" />
                  </div>
                  <p>Belum ada produk dipilih</p>
                </div>
              ) : viewMode === "table" ? (
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground text-[10px] uppercase">
                        Produk
                      </th>
                      <th className="px-2 py-3 text-center font-medium text-muted-foreground text-[10px] uppercase w-20">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground text-[10px] uppercase">
                        Harga
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground text-[10px] uppercase">
                        Total
                      </th>
                      <th className="px-2 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {fields.map((field, index) => {
                      const qty = Number(form.watch(`items.${index}.qty`));
                      const price = Number(form.watch(`items.${index}.price`));
                      const variantId = form.watch(`items.${index}.variantId`);
                      const lineTotal = qty * price;

                      return (
                        <tr key={field.id} className="hover:bg-muted/10 group">
                          <td className="px-4 py-3 max-w-[200px]">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                                {field.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={field.image}
                                    alt={field.productName || ""}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                                    <Search className="h-4 w-4 opacity-20" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-1 overflow-hidden">
                                <div
                                  className="font-medium truncate text-xs"
                                  title={field.productName || ""}
                                >
                                  {field.productName}
                                </div>

                                {/* Variant Selector */}
                                {field.variants && field.variants.length > 1 ? (
                                  <Select
                                    value={String(variantId)}
                                    onValueChange={(value) => {
                                      const newVariantId = Number(value);
                                      const newVariant = field.variants?.find(
                                        (v: ProductResponse["variants"][0]) =>
                                          v.id === newVariantId,
                                      );

                                      if (newVariant) {
                                        form.setValue(
                                          `items.${index}.variantId`,
                                          newVariantId,
                                        );
                                        form.setValue(
                                          `items.${index}.variantName`,
                                          newVariant.name,
                                        );
                                        form.setValue(
                                          `items.${index}.price`,
                                          Number(newVariant.sellPrice),
                                        );
                                        form.setValue(
                                          `items.${index}.sku`,
                                          newVariant.sku,
                                        );
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-6 w-full max-w-[140px] text-[10px] px-2">
                                      <SelectValue placeholder="Pilih Varian" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {field.variants.map(
                                        (v: ProductResponse["variants"][0]) => (
                                          <SelectItem
                                            key={v.id}
                                            value={String(v.id)}
                                            className="text-xs"
                                          >
                                            {v.name}
                                          </SelectItem>
                                        ),
                                      )}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div className="text-xs text-muted-foreground">
                                    {field.variantName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3">
                            <Input
                              type="number"
                              min={1}
                              className="h-8 w-16 text-center mx-auto"
                              {...form.register(`items.${index}.qty`, {
                                valueAsNumber: true,
                              })}
                            />
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {formatCurrency(price)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold tabular-nums">
                            {formatCurrency(lineTotal)}
                          </td>
                          <td className="px-2 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 space-y-3">
                  {fields.map((field, index) => {
                    const qty = Number(form.watch(`items.${index}.qty`));
                    const price = Number(form.watch(`items.${index}.price`));
                    const variantId = form.watch(`items.${index}.variantId`);
                    const lineTotal = qty * price;

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
                              {/* Variant Selector */}
                              <div className="mt-1">
                                {field.variants && field.variants.length > 1 ? (
                                  <Select
                                    value={String(variantId)}
                                    onValueChange={(value) => {
                                      const newVariantId = Number(value);
                                      const newVariant = field.variants?.find(
                                        (v: ProductResponse["variants"][0]) =>
                                          v.id === newVariantId,
                                      );

                                      if (newVariant) {
                                        form.setValue(
                                          `items.${index}.variantId`,
                                          newVariantId,
                                        );
                                        form.setValue(
                                          `items.${index}.variantName`,
                                          newVariant.name,
                                        );
                                        form.setValue(
                                          `items.${index}.price`,
                                          Number(newVariant.sellPrice),
                                        );
                                        form.setValue(
                                          `items.${index}.sku`,
                                          newVariant.sku,
                                        );
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-6 w-fit text-[10px] px-2 gap-2">
                                      <SelectValue placeholder="Pilih Varian" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {field.variants.map(
                                        (v: ProductResponse["variants"][0]) => (
                                          <SelectItem
                                            key={v.id}
                                            value={String(v.id)}
                                            className="text-xs"
                                          >
                                            {v.name}
                                          </SelectItem>
                                        ),
                                      )}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] py-0 h-4 font-medium uppercase tracking-wider"
                                  >
                                    {field.variantName}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8 shrink-0 rounded-full shadow-sm hover:scale-105 transition-transform"
                              onClick={() => remove(index)}
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
                              <Input
                                type="number"
                                min={1}
                                className="h-10 text-sm font-semibold bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-lg shadow-none"
                                {...form.register(`items.${index}.qty`, {
                                  valueAsNumber: true,
                                })}
                              />
                            </div>

                            {/* Price Display */}
                            <div className="space-y-1.5 text-right">
                              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                Harga
                              </Label>
                              <div className="h-10 flex items-center justify-end text-sm font-bold text-foreground bg-muted/20 rounded-lg px-3 border border-transparent">
                                {formatCurrency(price)}
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Subtotal */}
                          <div className="pt-3 border-t border-dashed flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                              Subtotal
                            </span>
                            <span className="font-black text-sm text-foreground">
                              {formatCurrency(lineTotal)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Customer & Payment */}
        <div className="lg:col-span-1 space-y-4">
          {/* CUSTOMER SELECT */}
          <Card className="p-4 gap-5">
            <Label className="text-xs font-bold text-muted-foreground h-fit mb-0 uppercase">
              Informasi Pelanggan
            </Label>
            <CustomerSelect
              value={form.watch("customerId")}
              onValueChange={(val) => form.setValue("customerId", val)}
            />
            {form.formState.errors.customerId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.customerId.message}
              </p>
            )}
          </Card>

          {/* SUMMARY & PAYMENT */}
          <Card className="p-6 space-y-6 bg-primary/5 border-primary/20 sticky top-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatCurrency(total)}</span>
              </div>

              {/* Discount or Balance Usage could go here */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Percent className="h-3 w-3" /> Potongan Saldo
                </span>
                <div className="w-24">
                  <CurrencyInput
                    className="h-7 text-right text-xs bg-background"
                    value={form.watch("totalBalanceUsed")}
                    onChange={(val) =>
                      form.setValue("totalBalanceUsed", Number(val))
                    }
                  />
                </div>
              </div>

              <div className="h-px bg-border/50" />

              <div className="flex justify-between items-center">
                <span className="font-bold text-lg uppercase">
                  Total Tagihan
                </span>
                <span className="font-black text-2xl text-primary">
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              <div className="space-y-2 pt-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Pembayaran diterima (Tunai)
                </Label>
                <CurrencyInput
                  className="h-12 text-xl font-bold text-right"
                  placeholder="Rp 0"
                  value={form.watch("totalPaid")}
                  onChange={(val) => form.setValue("totalPaid", Number(val))}
                />
                {form.formState.errors.totalPaid && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.totalPaid.message}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center p-3 bg-background rounded-lg border">
                <span className="font-medium text-sm">Kembalian</span>
                <span
                  className={cn(
                    "font-bold text-lg",
                    change < 0 ? "text-destructive" : "text-emerald-600",
                  )}
                >
                  {formatCurrency(Math.max(0, change))}
                </span>
              </div>

              <Button
                size="lg"
                className="w-full font-bold uppercase tracking-widest text-md shadow-lg shadow-primary/20"
                type="submit"
                disabled={isSubmitting || fields.length === 0}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Proses Transaksi
              </Button>
            </div>
          </Card>
        </div>

        <Dialog open={isScannerOpen} onOpenChange={closeScanner}>
          <DialogTitle hidden>Scan Barcode</DialogTitle>
          <DialogContent className="p-0 border-none max-w-lg">
            <BarcodeScannerCamera
              onScanSuccess={handleScanSuccess}
              onClose={closeScanner}
            />
          </DialogContent>
        </Dialog>
      </div>
    </form>
  );
}
