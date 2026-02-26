"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Search,
  QrCode,
  Loader2,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Banknote,
  CreditCard,
  RefreshCcw,
  FileText,
  User,
  Calendar,
} from "lucide-react";
import { useReturnForm, CompensationType } from "../../_hooks/use-return-form";
import { ReturnItemSelector } from "../return-item-selector";
import { ExchangeItemPicker } from "../exchange-item-picker";
import { ReturnSuccessModal } from "../_ui/return-success-modal";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CustomerSelect } from "@/components/ui/customer-select";
import BarcodeScannerCamera from "@/components/barcode-scanner-camera";
import { useState } from "react";

export function ReturnForm() {
  const {
    step,
    invoiceInput,
    setInvoiceInput,
    isLookingUp,
    lookupInvoice,
    lookupError,
    saleData,
    returnItems,
    selectedReturnItems,
    toggleItemSelected,
    updateReturnItem,
    compensationType,
    setCompensationType,
    exchangeItems,
    addExchangeItem,
    updateExchangeItem,
    removeExchangeItem,
    totalValueReturned,
    totalValueExchange,
    netRefundAmount,
    isExchangeOverLimit,
    summaryText,
    canSubmit,
    isSubmitting,
    handleSubmit,
    returnResult,
    resetForm,
    goBackToInvoice,
    selectedCustomerId,
    setSelectedCustomerId,
    surplusStrategy,
    setSurplusStrategy,
    hasDebt,
    debtRemainingAmount,
    handleMarkAsPaid,
    isPayingDebt,
  } = useReturnForm();

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleScanSuccess = (barcode: string) => {
    setIsScannerOpen(false);
    setInvoiceInput(barcode);
    lookupInvoice(barcode);
  };

  const compensationOptions: {
    value: CompensationType;
    label: string;
    description: string;
    icon: React.ReactNode;
    requiresCustomer?: boolean;
  }[] = [
    {
      value: "refund",
      label: "Refund Tunai",
      description: "Uang dikembalikan langsung",
      icon: <Banknote className="h-5 w-5" />,
    },
    {
      value: "credit_note",
      label: "Credit Note",
      description: "Saldo untuk pembelian berikutnya",
      icon: <CreditCard className="h-5 w-5" />,
      requiresCustomer: true,
    },
    {
      value: "exchange",
      label: "Tukar Barang",
      description: "Ganti dengan produk lain",
      icon: <RefreshCcw className="h-5 w-5" />,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 flex flex-col gap-3 md:gap-4">
          {/* STEP 1: INVOICE LOOKUP */}
          {step === "invoice" && (
            <Card className="p-4 md:p-6 animate-in fade-in duration-300">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                <FileText className="h-3 w-3 inline mr-1" />
                Masukkan Nomor Invoice
              </Label>
              <p className="text-sm text-muted-foreground mb-4">
                Masukkan atau scan nomor invoice penjualan untuk memulai proses
                retur.
              </p>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className={cn(
                    "flex h-12 w-full rounded-xl border border-input bg-muted/40 px-3 py-1 pl-10 text-base font-medium",
                    "placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/30",
                    "pr-24",
                    lookupError && "border-destructive",
                  )}
                  placeholder="INV-0000001 atau scan..."
                  value={invoiceInput}
                  onChange={(e) => {
                    setInvoiceInput(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      lookupInvoice();
                    }
                  }}
                  autoFocus
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setIsScannerOpen(true)}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 font-bold"
                    onClick={() => lookupInvoice()}
                    disabled={isLookingUp || !invoiceInput.trim()}
                  >
                    {isLookingUp ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Cari"
                    )}
                  </Button>
                </div>
              </div>

              {lookupError && (
                <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {lookupError}
                </p>
              )}
            </Card>
          )}

          {/* DEBT WARNING */}
          {step === "items" && hasDebt && (
            <Card className="p-4 md:p-6 bg-red-50 border-destructive/20 animate-in zoom-in-95 duration-300">
              <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-lg font-black text-destructive uppercase tracking-tight">
                    Transaksi Belum Lunas
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                    Invoice ini masih memiliki sisa hutang sebesar{" "}
                    <span className="font-bold text-destructive">
                      {formatCurrency(debtRemainingAmount)}
                    </span>
                    . Harap lunasi terlebih dahulu sebelum melakukan retur.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  className="font-bold shadow-lg shadow-destructive/20 w-full md:w-auto"
                  onClick={handleMarkAsPaid}
                  disabled={isPayingDebt}
                >
                  {isPayingDebt ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Banknote className="mr-2 h-4 w-4" />
                  )}
                  Tandai sebagai Lunas
                </Button>
              </div>
            </Card>
          )}

          {/* STEP 2: ITEM SELECTION */}
          {step === "items" && (
            <>
              {/* Back button + Invoice Info */}
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={goBackToInvoice}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h3 className="font-bold text-sm">
                    Invoice: {saleData?.invoiceNumber}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Pilih barang yang ingin diretur
                  </p>
                </div>
              </div>

              {/* Return Items */}
              <Card
                className={cn(
                  "p-4",
                  hasDebt && "opacity-50 pointer-events-none grayscale-[0.5]",
                )}
              >
                <Label className="text-xs font-bold text-destructive uppercase tracking-wider mb-3 block">
                  Pilih Barang Retur
                </Label>
                <ReturnItemSelector
                  items={returnItems}
                  onToggle={toggleItemSelected}
                  onUpdate={updateReturnItem}
                />
              </Card>

              {/* Exchange Items (only shown for exchange type) */}
              {compensationType === "exchange" && (
                <ExchangeItemPicker
                  items={exchangeItems}
                  onAdd={addExchangeItem}
                  onUpdate={updateExchangeItem}
                  onRemove={removeExchangeItem}
                  totalValueReturned={totalValueReturned}
                  totalValueExchange={totalValueExchange}
                  isOverLimit={isExchangeOverLimit}
                />
              )}
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Sale Info + Compensation + Summary */}
        <div className="lg:col-span-1 space-y-3 md:space-y-4">
          {/* Sale Info Card (shown on step 2) */}
          {step === "items" && saleData && (
            <Card className="p-4 gap-0 animate-in fade-in duration-300">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                Informasi Penjualan
              </Label>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Invoice:</span>
                  <span className="font-bold ml-auto">
                    {saleData.invoiceNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Tanggal:</span>
                  <span className="font-medium ml-auto">
                    {formatDate(saleData.createdAt || new Date())}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium ml-auto">
                    {saleData.customer?.name || "Guest"}
                  </span>
                </div>
                <div className="h-px bg-border/50" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Belanja:</span>
                  <span className="font-bold">
                    {formatCurrency(Number(saleData.totalPrice))}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Customer Selection for Guest Sale */}
          {step === "items" && saleData && !saleData.customerId && (
            <Card className="p-4 gap-0 animate-in fade-in duration-300">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                Pilih Customer (Guest Sale)
              </Label>
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Penjualan ini dilakukan tanpa customer (Guest). Silahkan pilih
                  customer untuk melanjutkan retur.
                </p>
                <CustomerSelect
                  value={selectedCustomerId || undefined}
                  onValueChange={setSelectedCustomerId}
                  placeholder="Pilih customer untuk retur..."
                />
              </div>
            </Card>
          )}

          {/* Compensation Type (shown on step 2) */}
          {step === "items" && (
            <Card className="p-4 gap-0 animate-in fade-in duration-300">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                Jenis Kompensasi
              </Label>
              <div className="space-y-2">
                {compensationOptions.map((opt) => {
                  const hasCustomer =
                    saleData?.customerId || selectedCustomerId;
                  const isDisabled = opt.requiresCustomer && !hasCustomer;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        if (hasDebt) return;
                        setCompensationType(opt.value);
                        if (opt.value !== "exchange") {
                          // Clear exchange items when switching away
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                        compensationType === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/30 hover:bg-muted/50",
                        (isDisabled || hasDebt) &&
                          "opacity-40 cursor-not-allowed",
                      )}
                    >
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                          compensationType === opt.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {opt.icon}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {opt.description}
                        </p>
                        {isDisabled && (
                          <p className="text-[10px] text-destructive font-medium mt-0.5">
                            Hanya untuk transaksi dengan customer
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              {hasDebt && (
                <p className="text-[10px] text-destructive font-medium mt-3 italic">
                  * Kompensasi dinonaktifkan karena transaksi belum lunas
                </p>
              )}
            </Card>
          )}

          {/* Summary Card (shown on step 2) */}
          {step === "items" && (
            <Card className="p-4 md:p-6 bg-destructive/5 border-destructive/20 sticky top-4 md:top-6 animate-in fade-in duration-300">
              <div className="space-y-4">
                <Label className="text-xs font-bold text-destructive uppercase tracking-wider block">
                  Ringkasan Retur
                </Label>

                {/* Items selected */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Item diretur ({selectedReturnItems.length})
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(totalValueReturned)}
                  </span>
                </div>

                {/* Exchange value (if applicable) */}
                {compensationType === "exchange" &&
                  exchangeItems.length > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        Barang Pengganti ({exchangeItems.length})
                      </span>
                      <span className="font-semibold text-primary">
                        -{formatCurrency(totalValueExchange)}
                      </span>
                    </div>
                  )}

                <div className="h-px bg-border/50" />

                {/* Net amount */}
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">
                    {compensationType === "exchange"
                      ? netRefundAmount >= 0
                        ? "Sisa Kembali"
                        : "Kekurangan"
                      : compensationType === "credit_note"
                        ? "Saldo Ditambahkan"
                        : "Refund Tunai"}
                  </span>
                  <span
                    className={cn(
                      "font-black text-xl",
                      compensationType === "exchange" && netRefundAmount < 0
                        ? "text-destructive"
                        : "text-primary",
                    )}
                  >
                    {formatCurrency(
                      compensationType === "exchange"
                        ? Math.abs(netRefundAmount)
                        : totalValueReturned,
                    )}
                  </span>
                </div>

                {/* Summary text */}
                {selectedReturnItems.length > 0 && (
                  <p className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded-lg">
                    {summaryText}
                  </p>
                )}

                {/* Exchange validation error */}
                {isExchangeOverLimit && (
                  <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/30 text-destructive text-xs font-medium flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Nilai barang pengganti (
                      {formatCurrency(totalValueExchange)}) melebihi nilai retur
                      ({formatCurrency(totalValueReturned)}). Kurangi item
                      pengganti untuk melanjutkan.
                    </span>
                  </div>
                )}

                {/* Credit note warning for guest */}
                {compensationType === "credit_note" &&
                  !saleData?.customerId &&
                  !selectedCustomerId && (
                    <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30 text-yellow-700 text-xs font-medium flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        Credit Note hanya tersedia untuk transaksi dengan
                        customer terdaftar.
                      </span>
                    </div>
                  )}

                {/* Guest sale but no customer selected warning */}
                {!saleData?.customerId && !selectedCustomerId && (
                  <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/30 text-destructive text-[10px] font-medium flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Silahkan pilih customer terlebih dahulu untuk memproses
                      retur transaksi guest.
                    </span>
                  </div>
                )}

                {/* Surplus Strategy Selector for Exchange */}
                {compensationType === "exchange" &&
                  netRefundAmount > 0 &&
                  (saleData?.customerId || selectedCustomerId) && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                        Sisa uang retur diberikan lewat:
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSurplusStrategy("cash")}
                          className={cn(
                            "flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all text-xs font-bold",
                            surplusStrategy === "cash"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <Banknote className="h-4 w-4" />
                          Tunai
                        </button>
                        <button
                          type="button"
                          onClick={() => setSurplusStrategy("credit_balance")}
                          className={cn(
                            "flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all text-xs font-bold",
                            surplusStrategy === "credit_balance"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <CreditCard className="h-4 w-4" />
                          Saldo
                        </button>
                      </div>
                    </div>
                  )}

                <Button
                  type="button"
                  size="lg"
                  className="w-full font-bold uppercase tracking-widest text-base shadow-lg shadow-destructive/20 h-12 md:h-14 bg-destructive hover:bg-destructive/90"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canSubmit}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Proses Retur
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Scanner Dialog */}
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogTitle hidden>Scan Invoice Barcode</DialogTitle>
        <DialogContent className="p-0 border-none max-w-lg">
          <BarcodeScannerCamera
            onScanSuccess={handleScanSuccess}
            onClose={() => setIsScannerOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <ReturnSuccessModal
        isOpen={!!returnResult}
        onClose={resetForm}
        result={returnResult}
      />
    </>
  );
}
