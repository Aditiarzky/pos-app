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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash2, MoreVertical, Barcode } from "lucide-react";
import { cn } from "@/lib/utils";

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
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const stockNum = Number(product.stock);
  const minStockNum = Number(product.minStock);
  const isLowStock = stockNum < minStockNum;

  return (
    <Card className="group overflow-hidden hover:shadow-md transition-shadow">
      {/* Image Section */}
      <div className="relative h-48 bg-muted">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <span className="text-4xl text-muted-foreground/30">📦</span>
          </div>
        )}

        {/* Stock Badge */}
        <div className="absolute top-3 right-3">
          <Badge
            variant={isLowStock ? "destructive" : "secondary"}
            className={cn("font-medium", isLowStock && "animate-pulse")}
          >
            {stockNum} {product.unit?.name || "unit"}
          </Badge>
        </div>

        {/* Action Menu */}
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onEdit(product.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Produk
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(product.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus Produk
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-1">
          <div className="font-semibold line-clamp-1">{product.name}</div>
          <div className="text-xs text-muted-foreground font-mono">
            SKU: {product.sku}
          </div>
        </div>

        {product.category && (
          <Badge variant="outline" className="mt-2 text-xs">
            {product.category.name}
          </Badge>
        )}

        {/* Barcodes */}
        {product.barcodes && product.barcodes.length > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Barcode className="h-3 w-3" />
            {product.barcodes.length} barcode
          </div>
        )}

        {/* Variants Accordion */}
        {product.variants && product.variants.length > 0 && (
          <Accordion type="single" collapsible className="mt-3">
            <AccordionItem value="variants" className="border-none">
              <AccordionTrigger className="py-2 text-sm hover:no-underline">
                Lihat {product.variants.length} Variant
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-2 pt-1">
                  {product.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex justify-between items-center bg-muted/50 rounded-md px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="font-medium">{variant.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {variant.sku}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          Rp {Number(variant.sellPrice).toLocaleString("id-ID")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          1 {variant.unit?.name} = {variant.conversionToBase}{" "}
                          {product.unit?.name}
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

      <CardFooter className="px-4 py-3 border-t bg-muted/30 flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          Min: {minStockNum} {product.unit?.name}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(product.id)}
          className="h-7 px-3 text-xs"
        >
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
}
