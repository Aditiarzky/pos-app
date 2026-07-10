import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Pencil, MoreHorizontal } from "lucide-react";
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
  onEdit?: (purchase: PurchaseResponse) => void;
  idx?: number;
  canEdit?: boolean;
}

export const PurchaseRow = ({
  purchase,
  onView,
  onEdit,
  idx,
  canEdit = false,
}: PurchaseProps) => {
  const itemCount = purchase?.items?.length || 0;

  return (
    <TableRow className="group border-b border-border/30 transition-colors hover:bg-muted/30 last:border-none">
      <TableCell className="px-2 py-2 text-[12px] font-semibold text-muted-foreground sm:px-4 sm:text-xs">
        {idx}
      </TableCell>
      <TableCell className="px-2 py-2 font-mono text-[12px] font-bold text-primary sm:px-4 sm:text-sm">
        {purchase.orderNumber}
        {purchase.isArchived && (
          <Badge variant="destructive" className="ml-2 text-[10px]">
            Archived
          </Badge>
        )}
      </TableCell>
      <TableCell className="px-2 py-2 text-center text-[12px] font-semibold text-muted-foreground sm:px-4 sm:text-xs">
        {purchase.createdAt ? formatDate(purchase.createdAt) : "-"}
      </TableCell>
      <TableCell className="px-2 py-2">
        <div className="font-semibold">{purchase.supplier?.name || "-"}</div>
      </TableCell>

      <TableCell className="px-2 py-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto -ml-2 px-2 py-1 text-sm font-medium text-primary hover:bg-transparent hover:underline"
            >
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start" sideOffset={4}>
            <div className="space-y-3">
              <div className="text-sm font-semibold">Daftar Item Pembelian</div>
              <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1 text-sm">
                {purchase?.items?.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between border-l-2 border-primary/20 py-1 pl-3"
                  >
                    <div className="flex-1">
                      <span className="font-medium">
                        {item?.product?.name || "Unknown Product"}
                      </span>
                      <span className="ml-1 text-muted-foreground">
                        ({item?.productVariant?.name || "-"})
                      </span>
                    </div>
                    <div className="whitespace-nowrap font-mono text-right">
                      {item?.qty ?? 0} x {formatCurrency(Number(item?.price ?? 0))}
                    </div>
                  </div>
                ))}
                {itemCount > 3 && (
                  <div className="border-t pt-2 text-xs italic text-muted-foreground">
                    + {itemCount - 3} item lainnya...
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>

      <TableCell className="px-2 py-2 text-right text-[12px] font-black text-primary sm:px-4 sm:text-base">
        {formatCurrency(Number(purchase.total))}
      </TableCell>
      <TableCell className="px-2 py-2 text-[12px] font-semibold text-muted-foreground sm:px-4 sm:text-sm">
        {purchase.user?.name || "-"}
      </TableCell>
      <TableCell className="px-2 py-2 text-right">
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
            {canEdit && onEdit && (
              <DropdownMenuItem onClick={() => onEdit(purchase)}>
                <Pencil className="mr-2 h-4 w-4" /> Data Salah
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export const PurchaseCard = ({
  purchase,
  onView,
  onEdit,
  canEdit = false,
}: PurchaseProps) => {
  const itemCount = purchase?.items?.length || 0;

  return (
    <Card className="group flex h-full flex-col gap-0 overflow-hidden border-muted/50 py-0 transition-all duration-300 hover:shadow-lg">
      <div className="relative flex flex-col gap-1.5 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 p-2.5 sm:p-4">
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <div className="truncate font-mono text-xs font-bold text-primary sm:text-lg">
              {purchase.orderNumber}
            </div>
            <div className="truncate text-[10px] font-medium text-muted-foreground sm:text-xs">
              {purchase.createdAt ? formatDate(purchase.createdAt) : "-"}
            </div>
          </div>
          {purchase.isArchived && (
            <Badge
              variant="destructive"
              className="shrink-0 px-1.5 text-[9px] shadow-sm sm:text-[10px]"
            >
              Archived
            </Badge>
          )}
        </div>
        <div className="truncate text-[10px] font-medium text-muted-foreground sm:text-xs">
          Supplier:{" "}
          <span className="text-foreground">{purchase.supplier?.name || "-"}</span>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-2.5 p-2.5 sm:gap-4 sm:p-4">
        <div className="grid grid-cols-1 gap-2 border-b border-dashed pb-2.5 sm:grid-cols-2 sm:gap-3 sm:pb-4">
          <div className="min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground sm:text-xs">
              Total
            </span>
            <div className="truncate text-sm font-black tracking-tight text-primary sm:text-2xl">
              {formatCurrency(Number(purchase.total))}
            </div>
          </div>
          <div className="min-w-0 sm:text-right">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground sm:text-xs">
              Dicatat Oleh
            </span>
            <div className="truncate text-[11px] font-semibold sm:text-sm">
              {purchase.user?.name || "-"}
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
          <div className="text-[10px] font-medium text-muted-foreground sm:text-xs">
            Items ({itemCount})
          </div>
          <div className="max-h-[90px] space-y-1 overflow-y-auto pr-1 sm:max-h-[100px] sm:space-y-1.5">
            {purchase?.items?.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-1.5 rounded-sm bg-muted/30 p-1.5 text-[11px] sm:text-xs"
              >
                <div className="min-w-0 flex-1 truncate">
                  <span className="font-medium text-foreground">
                    {item?.product?.name || "Unknown Product"}
                  </span>
                  {item?.productVariant?.name && (
                    <span className="text-[10px] text-muted-foreground">
                      {" "}
                      ({item.productVariant.name})
                    </span>
                  )}
                </div>
                <div className="shrink-0 whitespace-nowrap font-mono text-[9px] text-muted-foreground sm:text-[10px]">
                  {item.qty}x {formatCurrency(Number(item.price ?? 0))}
                </div>
              </div>
            ))}
            {itemCount > 3 && (
              <div className="pt-1 text-center text-[9px] italic text-muted-foreground sm:text-[10px]">
                + {itemCount - 3} item lainnya...
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <div className="mt-auto flex flex-col gap-1.5 border-t bg-muted/30 px-2.5 py-2 sm:px-4 sm:py-3">
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(purchase)}
            className="h-7 min-w-0 px-1.5 text-[10px] sm:h-8 sm:px-3 sm:text-xs"
          >
            <Eye className="mr-1 h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Lihat</span>
          </Button>
          {canEdit && onEdit ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(purchase)}
              className="h-7 min-w-0 border-primary/50 px-1.5 text-[10px] text-primary hover:bg-primary/10 dark:text-primary dark:hover:bg-primary/10 sm:h-8 sm:px-3 sm:text-xs"
            >
              <Pencil className="mr-1 h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Data Salah</span>
            </Button>
          ) : (
            <div className="h-7 sm:h-8" />
          )}
        </div>
      </div>
    </Card>
  );
};
