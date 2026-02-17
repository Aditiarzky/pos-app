import { Loader2 } from "lucide-react";
import { ProductResponse } from "@/services/productService";
import { formatCurrency } from "@/lib/format";

interface SearchResultsDropdownProps {
  isSearching: boolean;
  searchResults: ProductResponse[];
  onSelectProduct: (
    product: ProductResponse,
    variant: ProductResponse["variants"][0],
  ) => void;
}

export function SearchResultsDropdown({
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
          <div key={product.id} className="group cursor-pointer">
            {/* Product Header */}
            <div className="px-3 py-1.5 bg-muted/50 text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
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
