import { IconSortAscending, IconSortDescending } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface FilterFormProps {
  orderBy: "createdAt" | "orderNumber" | "total" | undefined;
  setOrderBy: (v: "createdAt" | "orderNumber" | "total" | undefined) => void;
  order: "asc" | "desc" | undefined;
  setOrder: (v: "asc" | "desc" | undefined) => void;
  setPage: (p: number) => void;
  resetFilters: () => void;
  isDropdown?: boolean;
}

export const PurchaseFilterForm = ({
  orderBy,
  setOrderBy,
  order,
  setOrder,
  setPage,
  resetFilters,
  isDropdown,
}: FilterFormProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium leading-none text-xs text-muted-foreground uppercase tracking-wider">
          Urutkan
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={orderBy}
            onValueChange={(v) => {
              setOrderBy(
                v as "createdAt" | "orderNumber" | "total" | undefined,
              );
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 px-3 bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary/20 cursor-pointer">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Tanggal</SelectItem>
              <SelectItem value="orderNumber">No. Invoice</SelectItem>
              <SelectItem value="total">Total</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={order}
            onValueChange={(v: "asc" | "desc") => {
              setOrder(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 px-3 bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary/20 cursor-pointer">
              <SelectValue placeholder="A-Z" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">
                Ascending{" "}
                <IconSortAscending className="h-4 w-4 ml-2 inline text-muted-foreground" />
              </SelectItem>
              <SelectItem value="desc">
                Descending{" "}
                <IconSortDescending className="h-4 w-4 ml-2 inline text-muted-foreground" />
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isDropdown && <DropdownMenuSeparator />}

      <Button
        variant="ghost"
        className="w-full h-10 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
        onClick={resetFilters}
      >
        Reset Filter
      </Button>
    </div>
  );
};
