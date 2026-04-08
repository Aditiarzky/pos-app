import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Trash2, ShoppingCart, Package } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { UseFormReturn } from "react-hook-form";
import { ProductResponse } from "@/services/productService";
import { SaleFormItem } from "../_types/sale-type";

interface SaleFormValues {
  items: SaleFormItem[];
  customerName: string;
}

interface TransactionCartItemsProps {
  fields: SaleFormItem[];
  form: UseFormReturn<SaleFormValues>;
  onRemove: (index: number) => void;
}

export function TransactionCartItems({
  fields,
  form,
  onRemove,
}: TransactionCartItemsProps) {
  return (
    <Card className="flex-1 min-h-[400px] gap-0 max-h-[600px] p-0 border-none shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden flex flex-col">
      <div className="p-5 bg-primary/5 border-b border-primary/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
            <ShoppingCart className="h-4 w-4 text-primary" />
          </div>
          <div>
            <Label className="font-bold text-xs text-foreground block">
              Keranjang Belanja
            </Label>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
              Daftar barang transaksi
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="bg-background font-bold text-primary border-primary/20 px-3 py-1"
        >
          {fields.length} Item
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-0">
        {fields.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 p-8 opacity-50">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <ShoppingCart className="h-8 w-8" />
            </div>
            <p>Belum ada produk dipilih</p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block">
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
                      <tr
                        key={field.id}
                        className="hover:bg-primary/5 group transition-colors"
                      >
                        <td className="px-5 py-4 max-w-[250px]">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-muted shadow-sm transition-transform group-hover:scale-105">
                              {field.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={field.image}
                                  alt={field.productName || ""}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                                  <Package className="h-4 w-4 opacity-20" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 overflow-hidden">
                              <div
                                className="font-semibold text-[13px] text-foreground truncate"
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
                                      form.setValue(
                                        `items.${index}.conversionToBase`,
                                        Number(
                                          newVariant.conversionToBase || 1,
                                        ),
                                      );
                                    }
                                  }}
                                >
                                  <SelectTrigger className="mt-1 h-6 w-fit min-w-[100px] text-[10px] px-2 py-0 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-bold rounded-full transition-colors whitespace-nowrap">
                                    <SelectValue placeholder="Ganti Varian" />
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
                                <div className="text-[11px] text-muted-foreground font-medium italic">
                                  {field.variantName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-4">
                          <Input
                            type="number"
                            min={1}
                            className="h-10 w-20 text-center mx-auto font-bold text-base bg-muted/30 focus-visible:ring-1 focus-visible:ring-primary/40"
                            value={qty || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "") {
                                form.setValue(`items.${index}.qty`, 0);
                              } else {
                                const num = Number(val);
                                if (!isNaN(num)) {
                                  form.setValue(`items.${index}.qty`, num);
                                }
                              }
                            }}
                          />
                        </td>
                        <td className="px-5 py-4 text-right tabular-nums text-xs font-semibold text-muted-foreground">
                          {formatCurrency(price)}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-[15px] text-primary tabular-nums tracking-tight">
                          {formatCurrency(lineTotal)}
                        </td>
                        <td className="px-2 py-4 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all font-bold"
                            onClick={() => onRemove(index)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="md:hidden">
              {fields.map((field, index) => {
                const qty = Number(form.watch(`items.${index}.qty`));
                const price = Number(form.watch(`items.${index}.price`));
                const variantId = form.watch(`items.${index}.variantId`);
                const lineTotal = qty * price;

                return (
                  <Card
                    key={field.id}
                    className="relative p-0 overflow-hidden rounded-none group border-0 border-b-2 border-border shadow-none"
                  >
                    <div className="p-3.5 space-y-4">
                      {/* Card Header: Product Info & Delete */}
                      <div className="flex justify-between items-start gap-3">
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
                              <Package className="h-4 w-4 opacity-20" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm leading-tight text-foreground line-clamp-2">
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
                                    form.setValue(
                                      `items.${index}.conversionToBase`,
                                      Number(newVariant.conversionToBase || 1),
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
                          <Input
                            type="number"
                            min={1}
                            className="h-10 text-sm font-semibold bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-lg shadow-none"
                            value={qty || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "") {
                                form.setValue(`items.${index}.qty`, 0);
                              } else {
                                const num = Number(val);
                                if (!isNaN(num)) {
                                  form.setValue(`items.${index}.qty`, num);
                                }
                              }
                            }}
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
                      <div className="pt-3 border-t border-dashed border-primary/10 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                          Total Per Item
                        </span>
                        <span className="font-bold text-base text-primary">
                          {formatCurrency(lineTotal)}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
