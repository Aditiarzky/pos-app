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
import { Loader2, Search, QrCode, Ticket, Banknote, ScanLine, ShoppingCart } from "lucide-react";
import { useProductSearch } from "@/hooks/use-product-search";
import { useSaleForm } from "../../_hooks/use-sale-form";
import { TransactionCartItems } from "../transaction-cart-items";
import { ProductResponse } from "@/services/productService";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SearchResultsDropdown } from "@/components/ui/search-product-dropdown";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { SaleSuccessModal } from "../_ui/sale-success-modal";
import { StockWarningModal } from "../_ui/stock-warning-modal";
import { QrisPaymentModal } from "@/components/qris-payment-modal";

interface TransactionFormProps {
  onSuccess?: () => void;
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createMutation = useCreateSale() as any;

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
    paymentMethod,
    setPaymentMethod,
    qrisData,
    setQrisData,
    handleQrisSuccess,
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

  useEffect(() => {
    if (lastScannedBarcode && searchResults.length > 0) {
      const product =
        searchResults.find((p) => p.variants.some((v) => v.sku === lastScannedBarcode)) ||
        searchResults[0];
      if (product) {
        const matchedVariant =
          product.variants.find((v) => v.sku === lastScannedBarcode) || product.variants[0];
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

  // ✅ FIX: panggil onSubmit langsung dengan data form saat ini
  // Tidak pakai form.handleSubmit() untuk menghindari Zod memblokir
  // field paymentMethod yang tidak ada di RHF defaultValues
  const handleClickSubmit = () => {
    const currentData = form.getValues();
    onSubmit(currentData);
  };

  const isQris = paymentMethod === "qris";
  const canSubmit = !isSubmitting && fields.length > 0;

  return (
    <>
      {/* ✅ FIX: semua modal dipindah ke LUAR <form> agar tidak terbungkus form */}

      {/* Barcode Scanner */}
      <Dialog open={isScannerOpen} onOpenChange={closeScanner}>
        <DialogTitle hidden>Scan Barcode</DialogTitle>
        <DialogContent className="p-0 border-none max-w-lg">
          <BarcodeScannerCamera onScanSuccess={handleScanSuccess} onClose={closeScanner} />
        </DialogContent>
      </Dialog>

      {/* Cash: Receipt Modal */}
      <SaleSuccessModal
        isOpen={!!lastSale}
        onClose={() => setLastSale(null)}
        sale={lastSale}
      />

      {/* Stock Warning Modal */}
      <StockWarningModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        items={insufficientItems}
        onAdjustStock={handleAdjustStock}
        isAdjusting={isAdjustingStock}
      />

      {/* QRIS Payment Modal */}
      <QrisPaymentModal
        isOpen={!!qrisData}
        onClose={() => setQrisData(null)}
        onSuccess={handleQrisSuccess}
        onCancel={() => {
          setQrisData(null);
          onSuccess?.(); // trigger refetch di parent
        }}
        data={qrisData}
      />

      {/* Main Form Layout */}
      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 min-h-[600px] items-start pb-24 lg:pb-0">
        {/* LEFT COLUMN */}
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const currentInput = searchInput.trim();
                      if (!currentInput) return;

                      const exactProduct = searchResults.find((product) =>
                        product.variants.some((v) => v.sku === currentInput),
                      );

                      if (exactProduct) {
                        const matchedVariant =
                          exactProduct.variants.find((v) => v.sku === currentInput) ||
                          exactProduct.variants[0];
                        if (matchedVariant) handleAddProduct(exactProduct, matchedVariant);
                        return;
                      }

                      if (searchResults.length > 0 && !isSearching) {
                        const product = searchResults[0];
                        const matchedVariant = product.variants[0];
                        if (matchedVariant) handleAddProduct(product, matchedVariant);
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

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-1 space-y-3 md:space-y-4">
          {/* CUSTOMER SELECT */}
          <Card className="p-3 md:p-4 gap-0">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
              Informasi Pelanggan
            </Label>

            <Tabs
              value={transactionMode}
              onValueChange={(val) => setTransactionMode(val as "guest" | "customer")}
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
                transactionMode === "guest" && "opacity-50 pointer-events-none grayscale",
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
                  {Number(selectedCustomer.totalDebt || 0) > 0 && !isQris && (
                    <div className="flex items-center gap-2 pt-1 border-t border-primary/10">
                      <Checkbox
                        id="pay-old-debt"
                        checked={form.watch("shouldPayOldDebt")}
                        onCheckedChange={(val) => form.setValue("shouldPayOldDebt", !!val)}
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
              {form.formState.errors.customerId && transactionMode === "customer" && (
                <p className="text-xs text-destructive mt-2">
                  {form.formState.errors.customerId.message}
                </p>
              )}
            </div>
          </Card>

          {/* PAYMENT METHOD TOGGLE */}
          <Card className="p-4 border-none shadow-md bg-muted/30">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4 block opacity-70">
              Metode Pembayaran
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                  paymentMethod === "cash"
                    ? "border-primary bg-background text-primary shadow-sm scale-[1.02]"
                    : "border-transparent text-muted-foreground hover:border-primary/20",
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  paymentMethod === "cash" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Banknote className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wide">Tunai</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("qris")}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                  paymentMethod === "qris"
                    ? "border-primary bg-background text-primary shadow-sm scale-[1.02]"
                    : "border-transparent text-muted-foreground hover:border-primary/20",
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  paymentMethod === "qris" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <ScanLine className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wide">QRIS</span>
              </button>
            </div>
          </Card>

          {/* SUMMARY & PAYMENT */}
          <Card className="p-4 md:p-6 bg-primary/5 border-primary/20 sticky top-4 md:top-6">
            <div className="space-y-4 md:space-y-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatCurrency(total)}</span>
              </div>

              {/* VOUCHER */}
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
                      <Label htmlFor="use-voucher" className="text-sm font-medium cursor-pointer">
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

              {/* VOUCHER DEDUCTION */}
              {form.watch("totalBalanceUsed") > 0 && (
                <div className="flex justify-between items-center text-sm text-emerald-600 animate-in fade-in slide-in-from-top-1">
                  <span className="flex items-center gap-1">
                    <Ticket className="h-3 w-3" /> Voucher
                  </span>
                  <span>-{formatCurrency(form.watch("totalBalanceUsed"))}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-2 border-b border-muted/50">
                <div className="grid gap-0.5">
                  <span className="font-bold text-[10px] uppercase tracking-[0.2em] text-muted-foreground opacity-60">Total Tagihan</span>
                  {!isQris && form.watch("shouldPayOldDebt") && (
                    <span className="text-[10px] text-destructive font-black uppercase tracking-wider">
                      + Hutang Lama
                    </span>
                  )}
                </div>
                <span className="font-black text-2xl text-primary tracking-tight">
                  {formatCurrency(
                    isQris
                      ? total - (form.watch("totalBalanceUsed") || 0)
                      : combinedTotal,
                  )}
                </span>
              </div>

              {/* CASH: input pembayaran */}
              {!isQris && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="space-y-2 pt-1">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                      Uang Diterima
                    </Label>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30" />
                      <CurrencyInput
                        className="h-12 text-xl font-bold text-right pr-4 pl-10 bg-background border-2 border-muted focus:border-primary rounded-xl shadow-sm transition-all"
                        placeholder="Rp 0"
                        value={form.watch("totalPaid")}
                        onChange={(val) => form.setValue("totalPaid", Number(val))}
                      />
                    </div>
                    {form.formState.errors.totalPaid && (
                      <p className="text-xs font-bold text-destructive">
                        ⚠️ {form.formState.errors.totalPaid.message}
                      </p>
                    )}
                  </div>

                  {transactionMode === "customer" && isInsufficient && (
                    <div className="flex items-start gap-3 p-3 bg-destructive/5 rounded-xl border border-destructive/20">
                      <Checkbox
                        id="is-debt"
                        checked={isDebt}
                        onCheckedChange={(checked) => setIsDebt(!!checked)}
                        className="mt-0.5"
                      />
                      <div className="grid gap-0.5">
                        <Label
                          htmlFor="is-debt"
                          className="text-[11px] font-bold text-destructive uppercase tracking-wide cursor-pointer"
                        >
                          Sisa Sebagai Hutang
                        </Label>
                        <p className="text-[10px] text-destructive/70">
                          {formatCurrency(deficiency)} akan dicatat di piutang.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className={cn(
                    "flex justify-between items-center p-3.5 rounded-xl border transition-all",
                    isInsufficient ? "bg-destructive/5 border-destructive/20" : "bg-emerald-500/5 border-emerald-500/20 shadow-sm"
                  )}>
                    <span className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground opacity-60">
                      {isInsufficient ? (isDebt ? "Sisa" : "Kurang") : "Kembali"}
                    </span>
                    <span
                      className={cn(
                        "font-bold text-xl tabular-nums",
                        isInsufficient ? "text-destructive" : "text-emerald-600",
                      )}
                    >
                      {formatCurrency(isInsufficient ? deficiency : change)}
                    </span>
                  </div>
                </div>
              )}

              {/* QRIS: info box */}
              {isQris && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 text-sm space-y-1">
                  <p className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <ScanLine className="h-4 w-4" />
                    Pembayaran via QRIS
                  </p>
                  <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                    QR code akan ditampilkan setelah tombol diproses. Customer scan menggunakan
                    aplikasi m-banking atau dompet digital.
                  </p>
                </div>
              )}

              {/* ✅ FIX: type="button" + onClick manual, bukan type="submit" */}
              {/* Ini mencegah form HTML submit yang bisa diblokir Zod validation */}
               {/* ACTION BUTTON (Desktop) */}
              <div className="hidden lg:block pt-4">
                <Button
                  size="lg"
                  type="button"
                  className="w-full font-black uppercase tracking-[0.2em] text-lg shadow-xl shadow-primary/20 h-16 rounded-2xl transition-all hover:scale-[1.01] active:scale-95"
                  onClick={handleClickSubmit}
                  disabled={!canSubmit}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {isQris ? "Bayar QRIS" : "Selesaikan Transaksi"}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* ── MOBILE STICKY BOTTOM BAR ── */}
        <div className={cn(
          "lg:hidden fixed bottom-16 left-0 right-0 z-50 transition-all duration-300 transform translate-y-0",
          fields.length === 0 ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
        )}>
          <div className="bg-background/95 backdrop-blur-md border-t border-muted shadow-[0_-8px_20px_rgba(0,0,0,0.1)] p-4 mx-auto container">
            <div className="flex items-center justify-between gap-4">
              <div className="grid gap-0.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-60 leading-none">Total Tagihan</span>
                <span className="text-lg font-black text-primary tabular-nums tracking-tighter">
                  {formatCurrency(
                    isQris
                      ? total - (form.watch("totalBalanceUsed") || 0)
                      : combinedTotal,
                  )}
                </span>
              </div>
              <Button
                size="lg"
                type="button"
                className="flex-1 h-12 font-bold uppercase tracking-widest text-xs rounded-xl shadow-md"
                onClick={handleClickSubmit}
                disabled={!canSubmit}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Bayar Sekarang</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
