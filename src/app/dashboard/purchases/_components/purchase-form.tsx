"use client";

import { useState, useEffect } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SupplierSelect } from "@/components/ui/supplier-select";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Trash2,
  Loader2,
  Search,
  X,
  QrCode,
  Package,
  Minus,
  Plus,
  ArrowLeftRight,
  Tag,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import BarcodeScannerCamera from "@/components/barcode-scanner-camera";
import { useSuppliers } from "@/hooks/master/use-suppliers";
import {
  useCreatePurchase,
  useUpdatePurchase,
  useDeletePurchase,
} from "@/hooks/purchases/use-purchases";
import { usePurchaseForm } from "../_hooks/use-purchase-form";
import {
  PurchaseFormData,
  PurchaseFormItem,
  PurchaseFormProps,
} from "../_types/purchase-type";
import { Switch } from "@/components/ui/switch";
import { ProductResponse } from "@/services/productService";
import { SearchResultsDropdown } from "@/components/ui/search-product-dropdown";
import { useProductSearch } from "@/hooks/use-product-search";
import { useAuth } from "@/hooks/use-auth";

export function PurchaseForm({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: PurchaseFormProps) {
  const { roles } = useAuth();
  const isSystemAdmin = (roles as string[]).includes("admin sistem");
  const [isMassMode, setIsMassMode] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");

  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);

  // Mutations
  const createMutation = useCreatePurchase();
  const updateMutation = useUpdatePurchase();
  const deleteMutation = useDeletePurchase();

  // Suppliers data
  const { data: suppliersResult } = useSuppliers({ limit: 100 });
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
    searchResults,
    isSearching,
    isScannerOpen,
    openScanner,
    closeScanner,
    handleScanSuccess,
    searchInputRef,
    lastScannedBarcode,
    setLastScannedBarcode,
  } = useProductSearch({ isOpen, autoFocusOnMount: false });
  // Auto-add item when barcode is scanned
  useEffect(() => {
    if (lastScannedBarcode && searchResults.length > 0) {
      const exactProduct = searchResults.find(
        (p) =>
          p.variants.some((v) => v.sku === lastScannedBarcode) ||
          p.barcodes?.some((b) => b.barcode === lastScannedBarcode),
      );

      if (exactProduct) {
        const matchedVariant =
          exactProduct.variants.find((v) => v.sku === lastScannedBarcode) ||
          exactProduct.variants[0];

        if (matchedVariant) {
          handleAddProduct(exactProduct, matchedVariant);
          setLastScannedBarcode(null);
          toast.success("Item ditambahkan otomatis");
        }
      }
    }
  }, [searchResults, lastScannedBarcode]);

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
        price:
          Number(product.lastPurchaseCost || 0) *
          Number(variant.conversionToBase || 1),
        productName: product.name,
        variantName: variant.name,
        image: product.image,
        lastPurchaseCost: Number(product.lastPurchaseCost || 0),
        variants: product.variants, // Store variants for dropdown
      });
      toast.success(`Produk ${product.name} ditambahkan`);
    }

    searchInputRef.current?.focus();
  };

  const handleVariantChange = (index: number, newVariantId: number) => {
    const item = fields[index];
    const newVariant = item.variants?.find((v) => v.id === newVariantId);
    if (!newVariant) return;

    const existingIndex = fields.findIndex(
      (f, idx) => f.variantId === newVariantId && idx !== index,
    );

    if (existingIndex > -1) {
      const currentQty = Number(form.getValues(`items.${index}.qty`)) || 0;
      const existingQty =
        Number(form.getValues(`items.${existingIndex}.qty`)) || 0;

      form.setValue(`items.${existingIndex}.qty`, existingQty + currentQty);
      remove(index);
      toast.info("Varian digabungkan dengan item yang ada. Qty diperbarui.");
    } else {
      form.setValue(`items.${index}.variantId`, newVariantId);
      form.setValue(`items.${index}.variantName`, newVariant.name);
      form.setValue(
        `items.${index}.price`,
        (item.lastPurchaseCost || 0) * Number(newVariant.conversionToBase),
      );
    }
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
                      onFocus={() => setIsProductSearchOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const currentInput = e.currentTarget.value.trim();
                          if (!currentInput) return;

                          setSearchInput(currentInput);

                          const exactProduct = searchResults.find(
                            (product) =>
                              product.variants.some(
                                (v) => v.sku === currentInput,
                              ) ||
                              product.barcodes?.some(
                                (b) => b.barcode === currentInput,
                              ),
                          );

                          if (exactProduct) {
                            const matchedVariant =
                              exactProduct.variants.find(
                                (v) => v.sku === currentInput,
                              ) || exactProduct.variants[0];
                            if (matchedVariant) {
                              handleAddProduct(exactProduct, matchedVariant);
                            }
                            return;
                          }

                          setLastScannedBarcode(currentInput);
                        }
                      }}
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
                    {isProductSearchOpen && (
                      <SearchResultsDropdown
                        isSearching={isSearching}
                        searchResults={searchResults}
                        searchValue={searchInput}
                        onSearchChange={setSearchInput}
                        onSearchEnter={(currentInput) => {
                          const trimmed = currentInput.trim();
                          if (!trimmed) return;
                          setSearchInput(trimmed);

                          const exactProduct = searchResults.find(
                            (product) =>
                              product.variants.some((v) => v.sku === trimmed) ||
                              product.barcodes?.some(
                                (b) => b.barcode === trimmed,
                              ),
                          );

                          if (exactProduct) {
                            const matchedVariant =
                              exactProduct.variants.find(
                                (v) => v.sku === trimmed,
                              ) || exactProduct.variants[0];
                            if (matchedVariant)
                              handleAddProduct(exactProduct, matchedVariant);
                            return;
                          }

                          setLastScannedBarcode(trimmed);
                        }}
                        onClose={() => {
                          setIsProductSearchOpen(false);
                          setSearchInput("");
                        }}
                        onSelectProduct={handleAddProduct}
                        keepOpenOnSelect={true}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table Section */}
              <div className="space-y-4">
                <ItemsTable
                  fields={fields}
                  form={form}
                  onRemove={remove}
                  onVariantChange={handleVariantChange}
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
              isSystemAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-3 text-xs font-semibold rounded-lg"
                  disabled={isSubmitting}
                  onClick={() => {
                    setDeleteConfirmInput("");
                    setIsDeleteModalOpen(true);
                  }}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Data Tidak Berguna
                </Button>
              )
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

      {/* Hard Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              Hapus Data Pembelian?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Tindakan ini akan{" "}
                  <strong className="text-destructive">
                    menghapus permanen
                  </strong>{" "}
                  data pembelian <strong>{initialData?.orderNumber}</strong>{" "}
                  beserta seluruh itemnya.
                </p>
                <p className="text-muted-foreground">
                  Stok produk yang terkait akan dikembalikan dan data tidak
                  dapat dipulihkan.
                </p>
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <p className="font-semibold text-destructive mb-1">
                    Perhatian:
                  </p>
                  <p className="text-muted-foreground">
                    Ketik <strong>HAPUS</strong> untuk mengkonfirmasi
                    penghapusan permanen.
                  </p>
                </div>
                <Input
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  placeholder="Ketik HAPUS"
                  className="border-destructive/50 focus-visible:ring-destructive"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={
                deleteConfirmInput !== "HAPUS" ||
                deleteMutation.isPending ||
                !initialData
              }
              onClick={async (e) => {
                e.preventDefault();
                if (!initialData) return;
                try {
                  await deleteMutation.mutateAsync(initialData.id);
                  toast.success("Pembelian berhasil dihapus permanen");
                  setIsDeleteModalOpen(false);
                  onClose();
                } catch (error) {
                  const msg =
                    error instanceof Error
                      ? error.message
                      : "Gagal menghapus pembelian";
                  toast.error(msg);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus Permanen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Items Table
interface ItemsTableProps {
  fields: PurchaseFormItem[];
  form: UseFormReturn<PurchaseFormData>;
  onRemove: (index: number) => void;
  onVariantChange: (index: number, newVariantId: number) => void;
}

type PriceMode = "unit" | "total";

function ItemsTable({
  fields,
  form,
  onRemove,
  onVariantChange,
}: ItemsTableProps) {
  // Mode harga per baris: "unit" (harga per 1 qty) atau "total" (total harga di nota untuk baris itu).
  // Key-nya pakai field.id (bukan index) supaya tetap stabil walau ada item lain yang dihapus.
  const [priceModes, setPriceModes] = useState<Record<string, PriceMode>>({});
  // Menyimpan angka total yang diketik user saat mode "total", karena price di form
  // selalu disimpan per-1-qty (total / qty), jadi total mentahnya perlu disimpan terpisah
  // supaya tidak hilang presisinya akibat pembulatan saat qty berubah-ubah.
  const [totalInputs, setTotalInputs] = useState<Record<string, number>>({});

  const getMode = (fieldId: string): PriceMode => priceModes[fieldId] || "unit";

  const toggleMode = (
    fieldId: string,
    currentPrice: number,
    currentQty: number,
  ) => {
    setPriceModes((prev) => {
      const nextMode: PriceMode =
        getMode(fieldId) === "unit" ? "total" : "unit";
      if (nextMode === "total") {
        // Saat pindah ke mode total, isi awal totalnya = harga per satuan sekarang x qty
        setTotalInputs((t) => ({ ...t, [fieldId]: currentPrice * currentQty }));
      }
      return { ...prev, [fieldId]: nextMode };
    });
  };

  // Dipanggil saat input "Harga Beli" berubah ketika mode = total.
  // newTotal dikonversi jadi harga per 1 qty sebelum disimpan ke form.
  const handleTotalPriceChange = (
    index: number,
    fieldId: string,
    newTotal: number,
    qty: number,
  ) => {
    setTotalInputs((prev) => ({ ...prev, [fieldId]: newTotal }));
    const safeQty = qty > 0 ? qty : 1;
    form.setValue(`items.${index}.price`, newTotal / safeQty, {
      shouldValidate: true,
    });
  };

  // Dipanggil setelah qty berubah (tombol -/+ atau input manual).
  // Kalau mode baris itu "total", harga per satuan dihitung ulang supaya
  // total di nota tetap konsisten.
  const syncPriceIfTotalMode = (
    fieldId: string,
    index: number,
    newQty: number,
  ) => {
    if (getMode(fieldId) !== "total") return;
    const total = totalInputs[fieldId] ?? 0;
    const safeQty = newQty > 0 ? newQty : 1;
    form.setValue(`items.${index}.price`, total / safeQty, {
      shouldValidate: true,
    });
  };

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
                <th className="px-2 py-2 text-right font-medium text-[11px] uppercase min-w-[140px]">
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
                  const variantId = form.watch(`items.${index}.variantId`);
                  const subtotal = qty * price;
                  // field.id di tipe PurchaseFormItem bisa berupa number | undefined (id DB),
                  // jadi dinormalisasi ke string yang stabil per baris dulu.
                  const rowKey = String(field.id ?? index);
                  const mode = getMode(rowKey);

                  return (
                    <tr
                      key={field.id ?? index}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Product Name & Image */}
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                            {field.image ? (
                              <img
                                src={field.image}
                                alt={field.productName || ""}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                                <Package className="h-5 w-5 opacity-20" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <div
                              className="font-medium text-foreground text-xs line-clamp-1 w-[180px]"
                              title={field.productName || ""}
                            >
                              {field.productName}
                            </div>
                            {/* Variant Selector */}
                            {field.variants && field.variants.length > 1 ? (
                              <Select
                                value={String(variantId)}
                                onValueChange={(value) => {
                                  onVariantChange(index, Number(value));
                                }}
                              >
                                <SelectTrigger className="rounded-xl shadow-none cursor-pointer w-fit !text-xs !px-1.5 !py-0.5 !h-7 gap-1">
                                  <Tag className="size-3.5 text-muted-foreground" />
                                  <SelectValue placeholder="Pilih Varian" />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.variants.map((v) => (
                                    <SelectItem
                                      key={v.id}
                                      value={String(v.id)}
                                      className="text-xs"
                                    >
                                      {v.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="bg-muted gap-1 flex rounded-xl items-center px-1.5 rounded py-1 border border-border dark:border-muted-foreground/20 text-xs text-muted-foreground w-fit">
                                <Tag className="size-3.5 text-muted-foreground" />
                                {field.variantName}
                              </span>
                            )}
                          </div>
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
                            <div className="w-full max-w-[120px] mx-auto flex flex-col items-center gap-1">
                              <div className="flex items-center border border-input rounded-xl h-8 w-fit overflow-hidden bg-background shadow-xs hover:border-primary/40 transition-colors">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-full w-7 rounded-none hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 text-muted-foreground transition-colors p-0 flex items-center justify-center border-r border-input"
                                  onClick={() => {
                                    const currentVal = Number(value) || 0;
                                    if (currentVal > 1) {
                                      const next = currentVal - 1;
                                      onChange(next);
                                      syncPriceIfTotalMode(rowKey, index, next);
                                    }
                                  }}
                                  disabled={(Number(value) || 0) <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <input
                                  type="number"
                                  min={1}
                                  className="w-10 text-center text-xs font-bold bg-transparent border-0 p-0 focus:outline-none focus:ring-0 focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  value={value ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "") {
                                      onChange(0);
                                      syncPriceIfTotalMode(rowKey, index, 0);
                                      return;
                                    }
                                    const num = parseFloat(val);
                                    if (!isNaN(num)) {
                                      onChange(num);
                                      syncPriceIfTotalMode(rowKey, index, num);
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-full w-7 rounded-none hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20 text-muted-foreground transition-colors p-0 flex items-center justify-center border-l border-input"
                                  onClick={() => {
                                    const next = (Number(value) || 0) + 1;
                                    onChange(next);
                                    syncPriceIfTotalMode(rowKey, index, next);
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              {fieldState.error && (
                                <p className="text-[10px] text-destructive leading-tight">
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
                          render={({ field: priceField, fieldState }) => {
                            const displayValue =
                              mode === "total"
                                ? (totalInputs[rowKey] ??
                                  priceField.value * qty)
                                : priceField.value;

                            return (
                              <div className="w-full max-w-[130px] ml-auto space-y-1">
                                <div className="flex items-center justify-end">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleMode(
                                        rowKey,
                                        Number(priceField.value) || 0,
                                        qty,
                                      )
                                    }
                                    className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-primary hover:underline"
                                  >
                                    <ArrowLeftRight className="h-2.5 w-2.5" />
                                    {mode === "unit"
                                      ? "/ satuan"
                                      : "total nota"}
                                  </button>
                                </div>
                                <CurrencyInput
                                  value={displayValue}
                                  onChange={(val) => {
                                    if (mode === "total") {
                                      handleTotalPriceChange(
                                        index,
                                        rowKey,
                                        Number(val) || 0,
                                        qty,
                                      );
                                    } else {
                                      priceField.onChange(val);
                                    }
                                  }}
                                  className="h-8 w-full text-right text-xs font-medium"
                                  placeholder="0"
                                  min={1}
                                />
                                {mode === "total" && (
                                  <p className="text-[9px] text-muted-foreground text-right">
                                    @ {formatCurrency(priceField.value || 0)}
                                  </p>
                                )}
                                {fieldState.error && (
                                  <p className="text-[10px] text-destructive mt-1 leading-tight text-right">
                                    {fieldState.error.message}
                                  </p>
                                )}
                              </div>
                            );
                          }}
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
      <div className="md:hidden space-y-2.5">
        {fields.length === 0 ? (
          <div className="py-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 text-muted-foreground bg-muted/20">
            <Package className="h-8 w-8 opacity-20" />
            <p className="text-sm font-medium">Belum ada item dipilih</p>
          </div>
        ) : (
          fields.map((field, index) => {
            const qty = Number(form.watch(`items.${index}.qty`)) || 0;
            const price = Number(form.watch(`items.${index}.price`)) || 0;
            const variantId = form.watch(`items.${index}.variantId`);
            const subtotal = qty * price;
            const rowKey = String(field.id ?? index);
            const mode = getMode(rowKey);

            return (
              <Card
                key={field.id ?? index}
                className="relative p-0 overflow-hidden border-border shadow-sm"
              >
                <div className="p-3.5 space-y-3">
                  {/* Header: Gambar + Nama + Varian + Delete */}
                  <div className="flex items-start gap-3">
                    {/* Image */}
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md border bg-muted">
                      {field.image ? (
                        <img
                          src={field.image}
                          alt={field.productName || ""}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                          <Package className="h-4 w-4 opacity-30" />
                        </div>
                      )}
                    </div>

                    {/* Nama & Varian */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-semibold text-sm leading-tight line-clamp-1"
                        title={field.productName || ""}
                      >
                        {field.productName}
                      </div>

                      <div className="mt-1">
                        {field.variants && field.variants.length > 1 ? (
                          <Select
                            value={String(variantId)}
                            onValueChange={(value) => {
                              onVariantChange(index, Number(value));
                            }}
                          >
                            <SelectTrigger className="rounded-xl shadow-none cursor-pointer w-fit !text-xs !px-1.5 !py-0.5 !h-7 gap-1">
                              <Tag className="size-3.5 text-muted-foreground" />
                              <SelectValue placeholder="Pilih Varian" />
                            </SelectTrigger>
                            <SelectContent>
                              {field.variants.map((v) => (
                                <SelectItem
                                  key={v.id}
                                  value={String(v.id)}
                                  className="text-xs"
                                >
                                  {v.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="bg-muted gap-1 flex rounded-xl items-center px-1.5 rounded py-1 border border-border dark:border-muted-foreground/20 text-xs text-muted-foreground w-fit">
                            <Tag className="size-3.5 text-muted-foreground" />
                            {field.variantName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-full shadow-sm"
                      onClick={() => onRemove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="h-px bg-border/50" />

                  {/* Inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Qty */}
                    <div className="space-y-1.5 flex-1">
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
                          <div className="relative group/input flex flex-col gap-1">
                            <div className="flex items-center border border-input rounded-xl h-9 w-full overflow-hidden bg-background shadow-xs hover:border-primary/40 transition-colors">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-full w-8 shrink-0 rounded-none hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 text-muted-foreground transition-colors p-0 flex items-center justify-center border-r border-input"
                                onClick={() => {
                                  const currentVal = Number(value) || 0;
                                  if (currentVal > 1) {
                                    const next = currentVal - 1;
                                    onChange(next);
                                    syncPriceIfTotalMode(rowKey, index, next);
                                  }
                                }}
                                disabled={(Number(value) || 0) <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <input
                                type="number"
                                min={1}
                                className="min-w-0 flex-1 text-center text-sm font-bold bg-transparent border-0 p-0 focus:outline-none focus:ring-0 focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={value ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const next = val === "" ? 0 : parseFloat(val);
                                  onChange(next);
                                  syncPriceIfTotalMode(
                                    rowKey,
                                    index,
                                    next || 0,
                                  );
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-full w-8 shrink-0 rounded-none hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20 text-muted-foreground transition-colors p-0 flex items-center justify-center border-l border-input"
                                onClick={() => {
                                  const next = (Number(value) || 0) + 1;
                                  onChange(next);
                                  syncPriceIfTotalMode(rowKey, index, next);
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            {fieldState.error && (
                              <p className="text-[10px] text-destructive font-medium">
                                {fieldState.error.message}
                              </p>
                            )}
                          </div>
                        )}
                      />
                    </div>

                    {/* Harga Beli */}
                    <div className="space-y-1.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Harga Beli
                        </Label>
                        <Controller
                          name={`items.${index}.price`}
                          control={form.control}
                          render={({ field: priceField }) => (
                            <button
                              type="button"
                              onClick={() =>
                                toggleMode(
                                  rowKey,
                                  Number(priceField.value) || 0,
                                  qty,
                                )
                              }
                              className="flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide text-primary"
                            >
                              <ArrowLeftRight className="h-2.5 w-2.5" />
                              {mode === "unit" ? "satuan" : "total"}
                            </button>
                          )}
                        />
                      </div>
                      <Controller
                        name={`items.${index}.price`}
                        control={form.control}
                        render={({ field: priceField, fieldState }) => {
                          const displayValue =
                            mode === "total"
                              ? (totalInputs[rowKey] ?? priceField.value * qty)
                              : priceField.value;

                          return (
                            <div className="relative group/input">
                              <CurrencyInput
                                value={displayValue}
                                onChange={(val) => {
                                  if (mode === "total") {
                                    handleTotalPriceChange(
                                      index,
                                      rowKey,
                                      Number(val) || 0,
                                      qty,
                                    );
                                  } else {
                                    priceField.onChange(val);
                                  }
                                }}
                                className="h-10 w-full text-right text-sm font-bold bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-lg shadow-none"
                                placeholder="0"
                                min={1}
                              />
                              {mode === "total" && (
                                <p className="text-[9px] text-muted-foreground text-right mt-1">
                                  @ {formatCurrency(priceField.value || 0)} /
                                  satuan
                                </p>
                              )}
                              {fieldState.error && (
                                <p className="text-[10px] text-destructive mt-1 font-medium text-right">
                                  {fieldState.error.message}
                                </p>
                              )}
                            </div>
                          );
                        }}
                      />
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="pt-2 border-t border-dashed flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      Subtotal
                    </span>
                    <span className="font-black text-base text-foreground">
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
