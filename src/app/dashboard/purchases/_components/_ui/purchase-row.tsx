import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Printer, Trash2, MoreHorizontal } from "lucide-react";
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
  onEdit: (purchase: PurchaseResponse) => void;
  onDelete: (purchase: PurchaseResponse) => void;
  idx?: number;
}

export const PurchaseRow = ({
  purchase,
  onEdit,
  onDelete,
  idx,
}: PurchaseProps) => {
  const handlePrint = () => window.print();
  const itemCount = purchase?.items?.length || 0;

  return (
    <TableRow className="hover:bg-muted/30 transition-colors group">
      <TableCell>{idx}</TableCell>
      <TableCell className="font-mono font-bold text-primary">
        {purchase.orderNumber}
        {purchase.isArchived && (
          <Badge variant="destructive" className="text-[10px] ml-2">
            Archived
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-center font-medium">
        {purchase.createdAt ? formatDate(purchase.createdAt) : "-"}
      </TableCell>
      <TableCell>
        <div className="font-semibold">{purchase.supplier?.name || "-"}</div>
      </TableCell>

      {/* Popover Items (Popup) */}
      <TableCell>
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

      <TableCell className="text-right font-black text-primary text-base">
        {formatCurrency(Number(purchase.total))}
      </TableCell>
      <TableCell className="font-medium text-muted-foreground">
        {purchase.user?.name || "-"}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(purchase)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Cetak
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

export const PurchaseCard = ({ purchase, onEdit, onDelete }: PurchaseProps) => {
  const handlePrint = () => window.print();

  return (
    <Card className="group py-0 overflow-hidden gap-0 hover:shadow-lg transition-all duration-300 flex flex-col h-full border-muted/50">
      {/* Header with Gradient */}
      <div className="relative h-24 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 p-4 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <div className="font-mono font-bold text-primary text-lg flex items-center gap-2">
              {purchase.orderNumber}
            </div>
            <div className="text-xs text-muted-foreground font-medium">
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

      <CardContent className="p-4 flex-1 flex flex-col gap-4">
        {/* Total Amount & Supplier */}
        <div className="flex justify-between items-start border-b pb-4 border-dashed">
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
              Total Transaksi
            </span>
            <div className="text-2xl font-black text-primary tracking-tight">
              {formatCurrency(Number(purchase.total))}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
              Supplier
            </span>
            <div className="font-semibold text-sm max-w-[120px] truncate">
              {purchase.supplier?.name || "-"}
            </div>
          </div>
        </div>

        {/* Items Summary */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
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
      <div className="px-4 py-3 border-t bg-muted/30 flex justify-between items-center gap-2 mt-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrint}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <Printer className="h-4 w-4 mr-1" />
          <span className="text-xs hidden sm:inline">Cetak</span>
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(purchase)}
            className="h-8 px-3 text-xs"
          >
            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
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
      </div>
    </Card>
  );
};
