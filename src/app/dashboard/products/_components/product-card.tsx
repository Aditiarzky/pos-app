"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Edit,
  Trash2,
  MoreVertical,
  PackagePlus,
  Package,
  Eye,
  AlertCircle,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/contexts/ConfirmDialog";
import { formatCompactNumber } from "@/lib/format";
import { calculateVariantMargin } from "@/lib/product-utils";
import { ProductResponse } from "@/services/productService";

interface ProductCardProps {
  product: ProductResponse;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onAdjust?: (product: ProductResponse) => void;
}

// ====================== MODAL DETAIL ======================
function ProductDetailModal({
  product,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onAdjust,
  handleDeleteClick,
}: {
  product: ProductResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onAdjust?: (product: ProductResponse) => void;
  handleDeleteClick: () => void;
}) {
  const stockNum = Number(product.stock);
  const minStockNum = Number(product.minStock);
  const isLowStock = stockNum < minStockNum && minStockNum > 0;

  const priceRange = useMemo(() => {
    if (!product.variants?.length) return "Rp 0";
    const prices = product.variants.map((v) => Number(v.sellPrice));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max
      ? min.toLocaleString("id-ID")
      : `${min.toLocaleString("id-ID")} - ${max.toLocaleString("id-ID")}`;
  }, [product.variants]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-[680px] mx-0 p-0 mt-16 sm:mt-0 overflow-hidden rounded-3xl border-none shadow-2xl max-h-[80dvh] sm:max-h-[92vh] flex flex-col">
        {/* Header Image */}
        <div className="relative h-52 sm:h-60 bg-muted shrink-0 overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/70">
              <Package className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center gap-2 flex-wrap">
              {product.category && (
                <Badge className="bg-white/10 text-white border-white/20 backdrop-blur">
                  {product.category.name}
                </Badge>
              )}
              <span className="text-xs font-mono bg-black/50 text-white/80 px-2 py-0.5 rounded">
                {product.sku}
              </span>
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-white mt-2 leading-7">
              {product.name}
            </DialogTitle>
          </div>

          {isLowStock && (
            <Badge
              variant="destructive"
              className="absolute top-4 left-4 gap-1 shadow"
            >
              <AlertCircle className="h-3.5 w-3.5" />{" "}
              <p className="text-[10px] sm:text-xs">Stok Limit</p>
            </Badge>
          )}
        </div>

        <ScrollArea className="flex-1 overflow-y-scroll px-5">
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div
                className={cn(
                  "p-4 rounded-2xl",
                  isLowStock
                    ? "bg-red-50/20 border-border border"
                    : "bg-emerald-50/20 border-border border",
                )}
              >
                <div className="flex justify-between">
                  <Package
                    className={cn(
                      "h-6 w-6",
                      isLowStock
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-200",
                    )}
                  />
                  {isLowStock && (
                    <Badge variant="destructive" className="text-[10px]">
                      Perhatian
                    </Badge>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    STOK SAAT INI
                  </p>
                  <p
                    className={cn(
                      "text-xl sm:text-3xl font-black mt-1",
                      isLowStock
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-200",
                    )}
                  >
                    {formatCompactNumber(stockNum)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Min: {minStockNum} {product.unit?.name}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/20 border border-border">
                <Layers className="h-6 w-6 text-primary" />
                <p className="text-xs font-medium text-muted-foreground mt-3">
                  HARGA JUAL
                </p>
                <p className="sm:text-3xl text-xl font-black text-primary mt-1">
                  Rp {priceRange}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {product.variants?.length || 0} varian
                </p>
              </div>
            </div>

            {/* Variants List */}
            {product.variants && product.variants.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="h-4 w-4 text-primary" />
                  <p className="font-semibold text-sm">Varian Produk</p>
                </div>
                <div className="space-y-3">
                  {product.variants.map((v) => {
                    const margin = calculateVariantMargin(
                      v,
                      product.averageCost,
                    );
                    return (
                      <div
                        key={v.id}
                        className="flex items-center justify-between bg-muted/50 rounded-2xl px-4 py-3 border border-transparent hover:border-border transition-all"
                      >
                        <div>
                          <p className="font-semibold text-sm">{v.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            1 = {v.conversionToBase} {product.unit?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">
                            Rp {Number(v.sellPrice).toLocaleString("id-ID")}
                          </p>
                          {margin.hpp > 0 && (
                            <Badge
                              variant={
                                margin.isProfitable ? "default" : "destructive"
                              }
                              className="text-[10px] mt-1"
                            >
                              {margin.marginPercent.toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/30 rounded-2xl">
                <Package className="h-10 w-10 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground mt-2">
                  Tidak ada varian tambahan
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="border-t p-4 flex flex-row gap-2  bg-muted/50">
          {onAdjust && (
            <Button
              variant="outline"
              className="flex-1 rounded-2xl"
              onClick={() => {
                onAdjust(product);
                onOpenChange(false);
              }}
            >
              <PackagePlus className="mr-2 h-4 w-4" />
              <p className="hidden sm:block">Atur Stok</p>
              <p className="sm:hidden">Stok</p>
            </Button>
          )}

          {onEdit && (
            <Button
              className="flex-1  rounded-2xl"
              onClick={() => {
                onEdit(product.id);
                onOpenChange(false);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              <p className="hidden sm:block">Edit Produk</p>
              <p className="sm:hidden">Edit</p>
            </Button>
          )}

          {onDelete && (
            <Button
              variant="destructive"
              className=" rounded-2xl px-6"
              onClick={handleDeleteClick}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ====================== PRODUCT CARD ======================
export function ProductCard({
  product,
  onEdit,
  onDelete,
  onAdjust,
}: ProductCardProps) {
  const confirm = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const stockNum = Number(product.stock);
  const minStockNum = Number(product.minStock);
  const isLowStock = stockNum < minStockNum && minStockNum > 0;

  const displayPrice = useMemo(() => {
    if (!product.variants?.length) return "Rp 0";
    const min = Math.min(...product.variants.map((v) => Number(v.sellPrice)));
    return `Rp ${min.toLocaleString("id-ID")}`;
  }, [product.variants]);

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
    <>
      <ProductDetailModal
        handleDeleteClick={handleDeleteClick}
        product={product}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onEdit={onEdit}
        onDelete={onDelete}
        onAdjust={onAdjust}
      />

      <Card className="group py-0 overflow-hidden gap-0 hover:shadow-lg transition-all duration-300 flex flex-col h-full border-muted/50">
        {/* Image */}
        <div
          className="relative aspect-video overflow-hidden bg-muted cursor-pointer"
          onClick={() => setModalOpen(true)}
        >
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="h-14 w-14 text-muted-foreground/30" />
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-3">
            <span className="text-white text-xs flex items-center gap-1.5 font-medium">
              <Eye className="h-4 w-4" /> Lihat detail
            </span>
          </div>

          {/* Low Stock Badge */}
          {isLowStock && (
            <Badge
              variant="default"
              className="absolute bg-destructive text-white top-3 left-3 gap-1 shadow-md text-xs"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <p className="text-[10px] sm:text-xs">Stok Limit</p>
            </Badge>
          )}

          {/* Dropdown */}
          <div className="absolute top-3 right-3 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="sm:h-8 sm:w-8 h-6 w-6 rounded-full shadow-sm text-black bg-white/90 hover:bg-white"
                >
                  <MoreVertical className="sm:h-4 sm:w-4 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(product.id);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit Produk
                  </DropdownMenuItem>
                )}
                {onAdjust && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdjust(product);
                    }}
                  >
                    <PackagePlus className="mr-2 h-4 w-4" /> Atur Stok
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick();
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Hapus
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <CardContent
          className="p-2 py-3 sm:p-4 flex-1 flex flex-col"
          onClick={() => setModalOpen(true)}
        >
          <div className="space-y-1">
            <h3 className="font-semibold text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>

            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
              <span className="font-mono">{product.sku}</span>
              {product.category && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                  {product.category.name}
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-auto pt-4">
            <div className="sm:text-lg text-sm font-bold text-primary tracking-tighter">
              {displayPrice}
            </div>

            <div className="flex items-center justify-between mt-3">
              <div
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium px-2 sm:py-1 py-0.5 rounded-full",
                  isLowStock
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-700",
                )}
              >
                <Package className="h-3 w-3 sm:h-4 sm:w-4 hidden sm:block" />
                {formatCompactNumber(stockNum)}
                <p className="truncate max-w-8 text-[10px] sm:text-xs">
                  {product.unit?.name}
                </p>
              </div>

              {product.variants?.length ? (
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  {product.variants.length} varian
                </Badge>
              ) : null}
            </div>
          </div>
        </CardContent>

        {/* Footer Button */}
        <CardFooter className="[.border-t]:pt-0 border-t bg-muted/30 flex justify-between items-center gap-2 mt-auto">
          <Button
            variant="ghost"
            className="w-full text-xs h-12 sm:text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-none gap-2 transition-all"
            onClick={() => setModalOpen(true)}
          >
            <Eye className="h-4 w-4" />
            Lihat Detail
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
