"use client";

import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Package, RotateCcw, Warehouse } from "lucide-react";
import { ReturnItemEntry } from "../_hooks/use-return-form";

interface ReturnItemSelectorProps {
  items: ReturnItemEntry[];
  onToggle: (index: number) => void;
  onUpdate: (index: number, updates: Partial<ReturnItemEntry>) => void;
}

export function ReturnItemSelector({
  items,
  onToggle,
  onUpdate,
}: ReturnItemSelectorProps) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
        <p>Tidak ada item pada invoice ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <Card
          key={`${item.productId}-${item.variantId}`}
          className={cn(
            "p-4 transition-all duration-200 cursor-pointer",
            item.selected
              ? "border-destructive/40 bg-destructive/5 shadow-sm"
              : "hover:border-muted-foreground/30",
          )}
        >
          {/* Header: Checkbox + Product Info */}
          <div className="flex items-start gap-3">
            <Checkbox
              id={`return-item-${index}`}
              checked={item.selected}
              onCheckedChange={() => onToggle(index)}
              className="mt-1 border-destructive/50 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
            />

            <div className="flex-1 min-w-0">
              <Label
                htmlFor={`return-item-${index}`}
                className="font-bold text-sm cursor-pointer block truncate"
              >
                {item.productName}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Varian: {item.variantName} ·{" "}
                <span className="font-medium">
                  {formatCurrency(item.priceAtSale)}
                </span>{" "}
                × {item.maxQty}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-sm font-bold tabular-nums">
                {formatCurrency(item.priceAtSale * item.maxQty)}
              </span>
            </div>
          </div>

          {/* Expanded Details (when selected) */}
          {item.selected && (
            <div className="mt-4 ml-7 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Qty Input */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    <RotateCcw className="h-3 w-3 inline mr-1" />
                    Jumlah Retur
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={item.maxQty}
                      value={item.qty}
                      onChange={(e) => {
                        const val = Math.min(
                          Math.max(1, Number(e.target.value)),
                          item.maxQty,
                        );
                        onUpdate(index, { qty: val });
                      }}
                      className="h-9 w-20 text-center font-bold"
                    />
                    <span className="text-xs text-muted-foreground">
                      / {item.maxQty}
                    </span>
                  </div>
                  {item.qty > 0 && (
                    <p className="text-xs text-destructive font-medium mt-1">
                      Nilai: {formatCurrency(item.qty * item.priceAtSale)}
                    </p>
                  )}
                </div>

                {/* Return to Stock Toggle */}
                <div className="flex-1">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    <Warehouse className="h-3 w-3 inline mr-1" />
                    Kembali ke Stok?
                  </Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.returnedToStock}
                      onCheckedChange={(checked) =>
                        onUpdate(index, { returnedToStock: checked })
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      {item.returnedToStock ? "Ya" : "Tidak"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Alasan (opsional)
                </Label>
                <Input
                  placeholder="Barang rusak, tidak sesuai, dll..."
                  value={item.reason}
                  onChange={(e) => onUpdate(index, { reason: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
