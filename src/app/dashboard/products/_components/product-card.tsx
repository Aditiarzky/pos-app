"use client";

import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit,
  Trash2,
  MoreVertical,
  Barcode,
  PackagePlus,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/contexts/ConfirmDialog";
import { formatCompactNumber } from "@/lib/format";

interface ProductVariant {
  id: number;
  name: string;
  sku: string;
  sellPrice: string;
  conversionToBase: string;
  unit?: { name: string };
}

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    sku: string;
    image?: string | null;
    stock: string;
    minStock: string;
    category?: { name: string };
    unit?: { name: string };
    variants: ProductVariant[];
    barcodes?: { barcode: string }[];
  };
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onAdjust?: (product: any) => void;
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  onAdjust,
}: ProductCardProps) {
  const confirm = useConfirm();
  const stockNum = Number(product.stock);
  const minStockNum = Number(product.minStock);
  const isLowStock = stockNum < minStockNum;
  const stockPercentage =
    minStockNum > 0 ? (stockNum / minStockNum) * 100 : 100;

  const handleDeleteClick = async () => {
    if (!onDelete) return;

    const isConfirmed = await confirm({
      title: "Hapus Produk?",
      description: (
        <span>
          Apakah Anda yakin ingin menghapus <strong>{product.name}</strong>?
          Data akan dipindahkan ke tempat sampah.
        </span>
      ),
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });

    if (isConfirmed) {
      onDelete(product.id);
    }
  };

  return (
    <Card className="group py-0 overflow-hidden gap-0 hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl sm:text-5xl transition-transform duration-300 group-hover:scale-110">
              <Package className="h-10 w-10 text-muted-foreground" />
            </span>
          </div>
        )}

        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col items-end gap-1">
          <Badge
            variant={isLowStock ? "destructive" : "secondary"}
            className={cn(
              "font-medium shadow-md text-xs sm:text-sm",
              isLowStock && "animate-pulse",
            )}
          >
            {formatCompactNumber(stockNum)} {product.unit?.name || "unit"}
          </Badge>
          {isLowStock && (
            <div className="w-full h-1 bg-background/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-destructive transition-all duration-500"
                style={{ width: `${Math.min(stockPercentage, 100)}%` }}
              />
            </div>
          )}
        </div>

        {(onAdjust || onEdit || onDelete) && (
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8 shadow-md hover:shadow-lg"
                  type="button"
                >
                  <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {onAdjust && (
                  <DropdownMenuItem onClick={() => onAdjust(product)}>
                    <PackagePlus className="mr-2 h-4 w-4" />
                    Sesuaikan Stok
                  </DropdownMenuItem>
                )}
                {onAdjust && (onEdit || onDelete) && <DropdownMenuSeparator />}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(product.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Produk
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={handleDeleteClick}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus Produk
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
        <div className="space-y-1.5 mb-3">
          <h3 className="font-semibold line-clamp-2 text-sm sm:text-base leading-snug">
            {product.name}
          </h3>
          <div className="text-xs text-muted-foreground font-mono">
            SKU: {product.sku}
          </div>
        </div>

        {/* Category and Barcodes */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {product.category && (
            <Badge variant="outline" className="text-xs">
              {product.category.name}
            </Badge>
          )}
          {product.barcodes && product.barcodes.length > 0 && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Barcode className="h-3 w-3" />
              {product.barcodes.length}
            </Badge>
          )}
        </div>

        {/* Variants Accordion */}
        {product.variants && product.variants.length > 0 && (
          <Accordion type="single" collapsible className="flex-1">
            <AccordionItem value="variants" className="border-none">
              <AccordionTrigger className="py-2 text-xs sm:text-sm hover:no-underline">
                <span className="font-medium">
                  {product.variants.length} Variant
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-2 pt-1 max-h-40 overflow-y-auto pr-1">
                  {product.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex justify-between items-start gap-2 bg-muted/50 rounded-lg px-2.5 py-2 text-xs sm:text-sm hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {variant.name}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          {variant.sku}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold text-xs sm:text-sm whitespace-nowrap">
                          Rp {Number(variant.sellPrice).toLocaleString("id-ID")}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          1:{variant.conversionToBase}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>

      <CardFooter className="px-3 sm:px-4 py-2.5 sm:py-3 border-t bg-muted/30 flex justify-between items-center gap-2 mt-auto">
        {/* Min stock info */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Min. Stok:</span>
          <span className="text-xs sm:text-sm font-medium">
            {formatCompactNumber(minStockNum)} {product.unit?.name}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5 sm:gap-2">
          {onAdjust && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAdjust(product)}
              className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
              type="button"
            >
              <PackagePlus className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Stok</span>
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(product.id)}
              className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
              type="button"
            >
              <Edit className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
