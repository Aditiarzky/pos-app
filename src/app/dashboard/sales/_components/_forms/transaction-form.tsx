"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import BarcodeScannerCamera from "@/components/barcode-scanner-camera";
import { useCreateSale } from "@/hooks/sales/use-sale";
import { Card } from "@/components/ui/card";
import { CustomerSelect } from "@/components/ui/customer-select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Loader2, Search, QrCode, Ticket } from "lucide-react";
import { useProductSearch } from "../../_hooks/use-product-search";
import { useSaleForm } from "../../_hooks/use-sale-form";
import { TransactionCartItems } from "../transaction-cart-items";
import { ProductResponse } from "@/services/productService";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SearchResultsDropdown } from "@/components/ui/search-product-dropdown";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { SaleSuccessModal } from "../_ui/sale-success-modal";
import { StockWarningModal } from "../_ui/stock-warning-modal";

interface TransactionFormProps {
  onSuccess?: () => void;
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const createMutation = useCreateSale();

  const {
    form,
    fields,
    append,
    remove,
    total,
    change,
    isSubmitting,
    onSubmit,
    transactionMode,
    setTransactionMode,
    isVoucherUsed,
    setIsVoucherUsed,
    customerBalance,
    isDebt,
    setIsDebt,
    combinedTotal,
    isInsufficient,
    deficiency,
    lastSale,
    setLastSale,
    selectedCustomer,
    isStockModalOpen,
    setIsStockModalOpen,
    insufficientItems,
    handleAdjustStock,
    isAdjustingStock,
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
        const matchedVariant =
          product.variants.find((v) => v.sku === lastScannedBarcode) ||
          product.variants[0];

        if (matchedVariant) {
          handleAddProduct(product, matchedVariant);
          setLastScannedBarcode(null);
          toast.success("Item ditambahkan otomatis");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults, lastScannedBarcode]);

  const handleAddProduct = (
    product: ProductResponse,
    variant: ProductResponse["variants"][0],
  ) => {
    const existingIndex = fields.findIndex((f) => f.variantId === variant.id);

    if (existingIndex > -1) {
      const currentQty = Number(form.getValues(`items.${existingIndex}.qty`));
      form.setValue(`items.${existingIndex}.qty`, currentQty + 1);
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
        conversionToBase: Number(variant.conversionToBase || 1),
        variants: product.variants,
      });
    }
    setSearchInput("");
    searchInputRef.current?.focus();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 h-full items-start">
        {/* LEFT COLUMN: Items & Search */}
        <div className="lg:col-span-2 flex flex-col gap-3 md:gap-4">
          {/* SEARCH BAR */}
          <Card className="p-3 md:p-4">
            <div className="relative">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Cari Produk
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  className={cn(
                    "flex h-10 w-full rounded-xl border border-input bg-muted/40 px-3 py-1 pl-10 text-sm",
                    "placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/30",
                    "pr-12",
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
                    className="h-8 w-8"
                    onClick={openScanner}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>

                {debouncedSearch.length > 1 && (
                  <SearchResultsDropdown
                    isSearching={isSearching}
                    searchResults={searchResults}
                    onSelectProduct={handleAddProduct}
                  />
                )}
              </div>
            </div>
          </Card>

          {/* ITEMS LIST */}
          <TransactionCartItems fields={fields} form={form} onRemove={remove} />
        </div>

        {/* RIGHT COLUMN: Customer & Payment */}
        <div className="lg:col-span-1 space-y-3 md:space-y-4">
          {/* CUSTOMER SELECT */}
          <Card className="p-3 md:p-4 gap-0">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
              Informasi Pelanggan
            </Label>

            <Tabs
              value={transactionMode}
              onValueChange={(val) =>
                setTransactionMode(val as "guest" | "customer")
              }
              className="w-full mb-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="guest">Guest</TabsTrigger>
                <TabsTrigger value="customer">Customer</TabsTrigger>
              </TabsList>
            </Tabs>

            <div
              className={cn(
                "transition-all duration-200",
                transactionMode === "guest" &&
                  "opacity-50 pointer-events-none grayscale",
              )}
            >
              <CustomerSelect
                value={form.watch("customerId")}
                onValueChange={(val) => form.setValue("customerId", val)}
                disabled={transactionMode === "guest"}
              />
              {transactionMode === "customer" && selectedCustomer && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-dashed border-primary/20 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Total Hutang:</span>
                    <span className="font-bold text-destructive">
                      {formatCurrency(Number(selectedCustomer.totalDebt || 0))}
                    </span>
                  </div>
                  {Number(selectedCustomer.totalDebt || 0) > 0 && (
                    <div className="flex items-center gap-2 pt-1 border-t border-primary/10">
                      <Checkbox
                        id="pay-old-debt"
                        checked={form.watch("shouldPayOldDebt")}
                        onCheckedChange={(val) =>
                          form.setValue("shouldPayOldDebt", !!val)
                        }
                      />
                      <Label
                        htmlFor="pay-old-debt"
                        className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground cursor-pointer"
                      >
                        Bayar Hutang Lama (dari kembalian)
                      </Label>
                    </div>
                  )}
                </div>
              )}
              {form.formState.errors.customerId &&
                transactionMode === "customer" && (
                  <p className="text-xs text-destructive mt-2">
                    {form.formState.errors.customerId.message}
                  </p>
                )}
            </div>
          </Card>

          {/* SUMMARY & PAYMENT */}
          <Card className="p-4 md:p-6 bg-primary/5 border-primary/20 sticky top-4 md:top-6">
            <div className="space-y-4 md:space-y-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatCurrency(total)}</span>
              </div>

              {/* VOUCHER SECTION */}
              {transactionMode === "customer" && customerBalance > 0 && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-dashed border-primary/20">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="use-voucher"
                      checked={isVoucherUsed}
                      onCheckedChange={(checked) => setIsVoucherUsed(!!checked)}
                      disabled={total === 0}
                    />
                    <div className="grid gap-0.5">
                      <Label
                        htmlFor="use-voucher"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Gunakan Voucher
                      </Label>
                      <span className="text-[10px] text-muted-foreground">
                        Saldo Retur: {formatCurrency(customerBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="h-px bg-border/50" />

              {/* VOUCHER DEDUCTION LINE */}
              {form.watch("totalBalanceUsed") > 0 && (
                <div className="flex justify-between items-center text-sm text-emerald-600 animate-in fade-in slide-in-from-top-1">
                  <span className="flex items-center gap-1">
                    <Ticket className="h-3 w-3" /> Voucher
                  </span>
                  <span>-{formatCurrency(form.watch("totalBalanceUsed"))}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="grid gap-0.5">
                  <span className="font-bold text-lg uppercase leading-none">
                    Total
                  </span>
                  {form.watch("shouldPayOldDebt") && (
                    <span className="text-[10px] text-muted-foreground italic">
                      Transkasi + Bayar Hutang
                    </span>
                  )}
                </div>
                <span className="font-black text-2xl text-primary">
                  {formatCurrency(combinedTotal)}
                </span>
              </div>

              <div className="space-y-2 pt-2 md:pt-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Pembayaran diterima (Tunai)
                </Label>
                <CurrencyInput
                  className="h-11 md:h-12 text-lg md:text-xl font-bold text-right"
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

              {/* Debt Option - Only show if current transaction is insufficient */}
              {transactionMode === "customer" && isInsufficient && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                  <Checkbox
                    id="is-debt"
                    checked={isDebt}
                    onCheckedChange={(checked) => setIsDebt(!!checked)}
                    className="mt-0.5 border-destructive/50 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                  />
                  <div className="grid gap-0.5">
                    <Label
                      htmlFor="is-debt"
                      className="text-sm font-bold text-destructive cursor-pointer"
                    >
                      Catat Sisa sebagai Hutang
                    </Label>
                    <p className="text-xs text-destructive/80">
                      Sisa {formatCurrency(deficiency)} akan dicatat sebagai
                      hutang customer.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center p-2.5 md:p-3 bg-background rounded-lg border">
                <span className="font-medium text-sm">
                  {isInsufficient
                    ? isDebt
                      ? "Sisa Hutang"
                      : "Kekurangan"
                    : "Kembalian"}
                </span>
                <span
                  className={cn(
                    "font-bold text-lg",
                    isInsufficient ? "text-destructive" : "text-emerald-600",
                  )}
                >
                  {formatCurrency(isInsufficient ? deficiency : change)}
                </span>
              </div>

              <Button
                size="lg"
                className="w-full font-bold uppercase tracking-widest text-base md:text-md shadow-lg shadow-primary/20 h-12 md:h-14"
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

        <SaleSuccessModal
          isOpen={!!lastSale}
          onClose={() => setLastSale(null)}
          sale={lastSale}
        />

        <StockWarningModal
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
          items={insufficientItems}
          onAdjustStock={handleAdjustStock}
          isAdjusting={isAdjustingStock}
        />
      </div>
    </form>
  );
}
