import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Trash2, MoreHorizontal } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { PurchaseResponse } from "../../_types/purchase-type";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PurchaseProps {
  purchase: PurchaseResponse;
  onView: (purchase: PurchaseResponse) => void;
  onDelete: (purchase: PurchaseResponse) => void;
  idx?: number;
}

export const PurchaseRow = ({
  purchase,
  onView,
  onDelete,
  idx,
}: PurchaseProps) => {
  const itemCount = purchase?.items?.length || 0;

  return (
    <TableRow className="hover:bg-muted/30 transition-colors border-b border-border/30 last:border-none group">
      <TableCell className="text-[12px] sm:text-xs px-2 sm:px-4 py-2 font-semibold text-muted-foreground">{idx}</TableCell>
      <TableCell className="font-mono text-[12px] sm:text-sm px-2 sm:px-4 py-2 font-bold text-primary">
        {purchase.orderNumber}
        {purchase.isArchived && (
          <Badge variant="destructive" className="text-[10px] ml-2">
            Archived
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-center text-[12px] sm:text-xs px-2 sm:px-4 py-2 font-semibold text-muted-foreground">
        {purchase.createdAt ? formatDate(purchase.createdAt) : "-"}
      </TableCell>
      <TableCell className="px-2 sm:px-4 py-2">
        <div className="font-semibold">{purchase.supplier?.name || "-"}</div>
      </TableCell>

      {/* Popover Items (Popup) */}
      <TableCell className="px-2 sm:px-4 py-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="text-sm font-medium text-primary hover:bg-transparent hover:underline h-auto py-1 px-2 -ml-2"
            >
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start" sideOffset={4}>
            <div className="space-y-3">
              <div className="font-semibold text-sm">Daftar Item Pembelian</div>
              <div className="space-y-2 text-sm max-h-[240px] overflow-y-auto pr-1">
                {purchase?.items?.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between border-l-2 border-primary/20 pl-3 py-1"
                  >
                    <div className="flex-1">
                      <span className="font-medium">
                        {item?.product?.name || "Unknown Product"}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        ({item?.productVariant?.name || "-"})
                      </span>
                    </div>
                    <div className="text-right whitespace-nowrap font-mono">
                      {item?.qty ?? 0} ×{" "}
                      {formatCurrency(Number(item?.price ?? 0))}
                    </div>
                  </div>
                ))}
                {itemCount > 3 && (
                  <div className="text-xs text-muted-foreground pt-2 border-t italic">
                    + {itemCount - 3} item lainnya...
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>

      <TableCell className="text-right font-black text-primary text-[12px] sm:text-base px-2 sm:px-4 py-2">
        {formatCurrency(Number(purchase.total))}
      </TableCell>
      <TableCell className="text-[12px] sm:text-sm px-2 sm:px-4 py-2 font-semibold text-muted-foreground">
        {purchase.user?.name || "-"}
      </TableCell>
      <TableCell className="text-right px-2 sm:px-4 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(purchase)}>
              <Eye className="mr-2 h-4 w-4" /> Lihat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(purchase)}>
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export const PurchaseCard = ({ purchase, onView, onDelete }: PurchaseProps) => {
  return (
    <Card className="group py-0 overflow-hidden gap-0 hover:shadow-lg transition-all duration-300 flex flex-col h-full border-muted/50">
      {/* Header with Gradient */}
      <div className="relative h-20 sm:h-24 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 p-2.5 sm:p-4 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <div className="font-mono font-bold text-primary text-xs sm:text-lg flex items-center gap-2">
              {purchase.orderNumber}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">
              {purchase.createdAt ? formatDate(purchase.createdAt) : "-"}
            </div>
          </div>
          {purchase.isArchived && (
            <Badge variant="destructive" className="text-[10px] shadow-sm">
              Archived
            </Badge>
          )}
        </div>
        <div className="flex justify-between items-end">
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            Dicatat oleh:{" "}
            <span className="text-foreground">
              {purchase.user?.name || "-"}
            </span>
          </div>
        </div>
      </div>

      <CardContent className="p-2.5 sm:p-4 flex-1 flex flex-col gap-2.5 sm:gap-4">
        {/* Total Amount & Supplier */}
        <div className="flex justify-between items-start border-b pb-4 border-dashed">
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
              Total Transaksi
            </span>
            <div className="text-sm sm:text-2xl font-black text-primary tracking-tight">
              {formatCurrency(Number(purchase.total))}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
              Supplier
            </span>
            <div className="font-semibold text-[10px] sm:text-sm max-w-[120px] truncate">
              {purchase.supplier?.name || "-"}
            </div>
          </div>
        </div>

        {/* Items Summary */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-medium text-muted-foreground">
            <span>Items ({purchase?.items?.length})</span>
          </div>
          <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
            {purchase?.items?.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex justify-between text-xs items-center bg-muted/30 p-1.5 rounded-sm"
              >
                <div className="truncate flex-1 mr-2">
                  <span className="text-foreground font-medium">
                    {item?.product?.name}
                  </span>
                  <span className="text-muted-foreground ml-1 text-[10px]">
                    ({item?.productVariant?.name})
                  </span>
                </div>
                <div className="whitespace-nowrap font-mono text-[10px]">
                  {item.qty} x
                </div>
              </div>
            ))}
            {(purchase?.items?.length || 0) > 3 && (
              <div className="text-[10px] text-center text-muted-foreground italic pt-1">
                + {(purchase?.items?.length || 0) - 3} item lainnya...
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Footer Actions */}
      <div className="px-2.5 sm:px-4 py-2 sm:py-3 border-t bg-muted/30 flex justify-between items-center gap-1.5 sm:gap-2 mt-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(purchase)}
          className="h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs"
        >
          <Eye className="h-3.5 w-3.5 mr-1" /> Lihat
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(purchase)}
          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
