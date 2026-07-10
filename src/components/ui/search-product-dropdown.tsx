"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProductResponse } from "@/services/productService";
import { formatCurrency } from "@/lib/format";
import { Loader } from "@/components/ui/loading";
import { cn } from "@/lib/utils";
import {
  Barcode,
  Box,
  CheckCircle2,
  PackageSearch,
  Search,
  SearchX,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface SearchResultsDropdownProps {
  isSearching: boolean;
  searchResults: ProductResponse[];
  onSelectProduct: (
    product: ProductResponse,
    variant: ProductResponse["variants"][0],
  ) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onClose?: () => void;
  /**
   * Jika true, modal TIDAK otomatis tertutup setelah memilih produk/varian.
   * Berguna untuk mode "tambah banyak produk sekaligus" (mis. Mass Mode)
   * supaya user tidak perlu buka-tutup modal berulang kali.
   * Default: false (perilaku lama, modal tertutup setelah 1x pilih).
   */
  keepOpenOnSelect?: boolean;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = () => setIsMobile(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}

export function SearchResultsDropdown({
  isSearching,
  searchResults,
  onSelectProduct,
  searchValue = "",
  onSearchChange,
  onClose,
  keepOpenOnSelect = false,
}: SearchResultsDropdownProps) {
  const [open, setOpen] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    setOpen(true);
  }, [searchValue]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) onClose?.();
  };

  const handleSelectProduct = (
    product: ProductResponse,
    variant: ProductResponse["variants"][0],
  ) => {
    onSelectProduct(product, variant);

    if (!keepOpenOnSelect) {
      setOpen(false);
      onClose?.();
    }
    // Jika keepOpenOnSelect true: modal tetap terbuka.
    // Parent biasanya mengosongkan searchValue setelah menambahkan produk,
    // dan useEffect(() => setOpen(true), [searchValue]) di atas + auto-focus
    // di <SearchField /> akan otomatis menyiapkan input untuk pencarian berikutnya.
  };

  const handleSubmitTopProduct = () => {
    if (isSearching || searchResults.length === 0) return;

    const trimmedSearch = searchValue.trim();
    const exactProduct = searchResults.find((product) =>
      product.variants?.some((variant) => variant.sku === trimmedSearch),
    );
    const product = exactProduct ?? searchResults[0];
    const variant =
      exactProduct?.variants?.find((item) => item.sku === trimmedSearch) ??
      product?.variants?.[0];

    if (!product || !variant) return;

    handleSelectProduct(product, variant);
  };

  const title = "Pilih barang";
  const description =
    "Cari nama produk, SKU, atau scan barcode lalu pilih varian.";
  const content = useMemo(
    () => (
      <ProductSearchContent
        isSearching={isSearching}
        searchResults={searchResults}
        searchValue={searchValue}
        onSelectProduct={handleSelectProduct}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSearching, searchResults, searchValue, keepOpenOnSelect],
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[88vh] rounded-t-3xl border-t p-0 shadow-2xl"
        >
          <SheetHeader className="border-b px-4 pb-3 pt-5 text-left">
            <SheetTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <PackageSearch className="h-4 w-4" />
              </span>
              {title}
            </SheetTitle>
            <SheetDescription>{description}</SheetDescription>
            <SearchField
              value={searchValue}
              onChange={onSearchChange}
              onSubmit={handleSubmitTopProduct}
              className="mt-3"
            />
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[86vh] max-w-3xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <PackageSearch className="h-4 w-4" />
            </span>
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          <SearchField
            value={searchValue}
            onChange={onSearchChange}
            onSubmit={handleSubmitTopProduct}
            className="mt-3"
          />
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

function SearchField({
  value,
  onChange,
  className,
  onSubmit,
}: {
  value: string;
  onChange?: (value: string) => void;
  className?: string;
  onSubmit?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    requestAnimationFrame(() => {
      input.focus({ preventScroll: true });
      const caretPosition = input.value.length;
      input.setSelectionRange(caretPosition, caretPosition);
    });
  }, [value]);

  if (!onChange) return null;

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        className="h-11 w-full rounded-2xl border bg-muted/40 pl-10 pr-9 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary/25"
        placeholder="Cari nama produk / SKU..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;

          event.preventDefault();
          onSubmit?.();
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Hapus pencarian"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function ProductSearchContent({
  isSearching,
  searchResults,
  searchValue = "",
  onSelectProduct,
}: SearchResultsDropdownProps) {
  const shouldPromptForSearch = searchValue.trim().length < 2;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 p-3 md:max-h-[60vh] md:p-4">
      {shouldPromptForSearch ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-background p-8 text-center text-muted-foreground">
          <Search className="mb-2 h-9 w-9 text-muted-foreground/70" />
          <p className="font-semibold text-foreground">Mulai cari produk</p>
          <p className="mt-1 max-w-sm text-xs">
            Ketik minimal 2 karakter nama produk atau SKU untuk menampilkan
            hasil.
          </p>
        </div>
      ) : isSearching ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed bg-background p-8 text-muted-foreground">
          <Loader size="sm" />
          <span className="text-sm font-medium">Mencari produk...</span>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-background p-8 text-center text-muted-foreground">
          <SearchX className="mb-2 h-9 w-9 text-muted-foreground/70" />
          <p className="font-semibold text-foreground">
            Produk tidak ditemukan
          </p>
          <p className="mt-1 max-w-sm text-xs">
            Coba kata kunci lain, SKU lengkap, atau scan barcode produk.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
            <span className="font-medium">Hasil pencarian</span>
            <span className="rounded-full bg-background px-2.5 py-1 font-semibold shadow-sm ring-1 ring-border">
              {searchResults.length} produk
            </span>
          </div>

          {searchResults.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-2xl border bg-card shadow-sm"
            >
              <div className="flex items-center gap-3 border-b bg-muted/35 px-3 py-3">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-12 w-12 rounded-xl border bg-background object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-sm">
                    <Box className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold leading-tight text-foreground">
                    {product.name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="rounded-full bg-background px-2 py-0.5 ring-1 ring-border">
                      {product.variants?.length || 0} varian
                    </span>
                    <span className="rounded-full bg-background px-2 py-0.5 ring-1 ring-border">
                      Stok dasar:{" "}
                      {Number(product.stock).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="divide-y">
                {product.variants?.map((variant) => {
                  const variantStock = Math.floor(
                    Number(product.stock) / Number(variant.conversionToBase),
                  );
                  const isOutOfStock = variantStock < 1;

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      className={cn(
                        "grid w-full grid-cols-[1fr_auto] items-center gap-3 px-3 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:px-4",
                        isOutOfStock
                          ? "bg-destructive/5 hover:bg-destructive/10"
                          : "hover:bg-primary/10 active:bg-primary/15",
                      )}
                      onClick={() => onSelectProduct(product, variant)}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold text-foreground">
                            {variant.name}
                          </span>
                          {!isOutOfStock && (
                            <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 sm:inline-flex">
                              <CheckCircle2 className="h-3 w-3" /> Siap jual
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Barcode className="h-3 w-3" /> {variant.sku}
                          </span>
                          <span>
                            Isi{" "}
                            {Number(variant.conversionToBase).toLocaleString(
                              "id-ID",
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-black tabular-nums text-primary">
                          {formatCurrency(Number(variant.sellPrice))}
                        </div>
                        <div
                          className={cn(
                            "mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold",
                            isOutOfStock
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-emerald-100 text-emerald-700",
                          )}
                        >
                          {isOutOfStock
                            ? "Stok kurang"
                            : `Stok ${variantStock.toLocaleString("id-ID")} ${variant.unit?.name || ""}`}
                        </div>
                        {Number(product.averageCost) > 0 && (
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            HPP{" "}
                            {formatCurrency(
                              Number(product.averageCost) *
                              Number(variant.conversionToBase),
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
