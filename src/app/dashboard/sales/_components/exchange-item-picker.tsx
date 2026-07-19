"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ExchangeItemEntry } from "../_hooks/use-return-form";
import { Search, QrCode, Trash2, PackagePlus, ShoppingBag } from "lucide-react";
import { useProductSearch } from "@/hooks/use-product-search";
import { SearchResultsDropdown } from "@/components/ui/search-product-dropdown";
import { ProductResponse } from "@/services/productService";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import BarcodeScannerCamera from "@/components/barcode-scanner-camera";
import { toast } from "sonner";

interface ExchangeItemPickerProps {
  items: ExchangeItemEntry[];
  onAdd: (
    product: ProductResponse,
    variant: ProductResponse["variants"][0],
  ) => void;
  onUpdate: (index: number, updates: Partial<ExchangeItemEntry>) => void;
  onRemove: (index: number) => void;
  totalValueReturned: number;
  totalValueExchange: number;
  isOverLimit: boolean;
}

export function ExchangeItemPicker({
  items,
  onAdd,
  onUpdate,
  onRemove,
  totalValueReturned,
  totalValueExchange,
  isOverLimit,
}: ExchangeItemPickerProps) {
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
  } = useProductSearch({ isOpen: true, autoFocusOnMount: false });

  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);

  const handleAddProduct = (
    product: ProductResponse,
    variant: ProductResponse["variants"][0],
  ) => {
    onAdd(product, variant);
    setSearchInput("");
    searchInputRef.current?.focus();
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults, lastScannedBarcode]);

  const findExactProduct = (query: string) => {
    return searchResults.find(
      (product) =>
        product.variants.some((v) => v.sku === query) ||
        product.barcodes?.some((b) => b.barcode === query),
    );
  };

  const handleSearchEnter = (currentInput: string) => {
    const trimmed = currentInput.trim();
    if (!trimmed) return;
    setSearchInput(trimmed);

    const exactProduct = findExactProduct(trimmed);
    if (exactProduct) {
      const matchedVariant =
        exactProduct.variants.find((v) => v.sku === trimmed) ||
        exactProduct.variants[0];
      if (matchedVariant) {
        handleAddProduct(exactProduct, matchedVariant);
      }
      return;
    }

    setLastScannedBarcode(trimmed);
  };

  const remainingBudget = totalValueReturned - totalValueExchange;

  return (
    <Card className="p-4 space-y-4 border-primary/20 bg-primary/5">
      <div className="flex items-center gap-2 mb-2">
        <PackagePlus className="h-4 w-4 text-primary" />
        <Label className="text-xs font-bold text-primary uppercase tracking-wider">
          Barang Pengganti (Exchange)
        </Label>
      </div>

      {/* Budget indicator */}
      <div
        className={cn(
          "p-3 rounded-lg border text-sm",
          isOverLimit
            ? "bg-destructive/10 border-destructive/30 text-destructive"
            : "bg-muted/50 border-muted",
        )}
      >
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium">Sisa budget:</span>
          <span
            className={cn(
              "font-bold",
              isOverLimit ? "text-destructive" : "text-primary",
            )}
          >
            {formatCurrency(Math.max(0, remainingBudget))}
          </span>
        </div>
        {isOverLimit && (
          <p className="text-xs mt-1 font-medium">
            ⚠ Nilai barang pengganti tidak boleh melebihi nilai retur.
          </p>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={searchInputRef}
          className={cn(
            "flex h-10 w-full rounded-xl border border-input bg-muted/40 px-3 py-1 pl-10 text-sm",
            "placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/30",
            "pr-12",
          )}
          placeholder="Cari barang pengganti..."
          value={searchInput}
          onFocus={() => setIsProductSearchOpen(true)}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearchEnter(e.currentTarget.value);
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

        {isProductSearchOpen && (
          <SearchResultsDropdown
            isSearching={isSearching}
            searchResults={searchResults}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearchEnter={handleSearchEnter}
            onClose={() => {
              setIsProductSearchOpen(false);
              setSearchInput("");
            }}
            keepOpenOnSelect={true}
            onSelectProduct={handleAddProduct}
          />
        )}
      </div>

      {/* Exchange Items List */}
      {items.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground border-2 border-dashed rounded-xl">
          <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Belum ada barang pengganti.</p>
          <p className="text-xs">Cari dan tambahkan produk di atas.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={`exchange-${item.variantId}`}
              className="flex items-center gap-3 p-3 bg-background rounded-lg border"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{item.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {item.variantName} ·{" "}
                  <span className="font-medium">
                    {formatCurrency(item.sellPrice)}
                  </span>
                  {" · "}
                  <span
                    className={cn(
                      "font-medium",
                      item.currentStock <= 0
                        ? "text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    Stok: {item.currentStock}
                  </span>
                </p>
              </div>

              <Input
                type="number"
                min={1}
                value={item.qty}
                onChange={(e) =>
                  onUpdate(idx, { qty: Math.max(1, Number(e.target.value)) })
                }
                className="h-8 w-16 text-center font-bold"
              />

              <span className="text-sm font-bold tabular-nums shrink-0 w-24 text-right">
                {formatCurrency(item.qty * item.sellPrice)}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                onClick={() => onRemove(idx)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Scanner Dialog */}
      <Dialog open={isScannerOpen} onOpenChange={closeScanner}>
        <DialogTitle hidden>Scan Barcode</DialogTitle>
        <DialogContent className="p-0 border-none max-w-lg">
          <BarcodeScannerCamera
            onScanSuccess={handleScanSuccess}
            onClose={closeScanner}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
