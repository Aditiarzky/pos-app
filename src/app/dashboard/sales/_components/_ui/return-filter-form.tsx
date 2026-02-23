import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { CustomerSelect } from "@/components/ui/customer-select";
import { Label } from "@/components/ui/label";

interface ReturnFilterFormProps {
  dateRange: { startDate?: string; endDate?: string };
  setDateRange: (range: { startDate?: string; endDate?: string }) => void;
  compensationType: string | undefined;
  setCompensationType: (v: string | undefined) => void;
  customerId: number | undefined;
  setCustomerId: (id: number | undefined) => void;
  setPage: (p: number) => void;
  resetFilters: () => void;
  isDropdown?: boolean;
}

export const ReturnFilterForm = ({
  dateRange,
  setDateRange,
  compensationType,
  setCompensationType,
  customerId,
  setCustomerId,
  setPage,
  resetFilters,
  isDropdown,
}: ReturnFilterFormProps) => {
  return (
    <div className="space-y-4 p-1">
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Rentang Tanggal
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={dateRange.startDate || ""}
            onChange={(e) => {
              setDateRange({ ...dateRange, startDate: e.target.value });
              setPage(1);
            }}
            className="h-9 text-xs"
          />
          <Input
            type="date"
            value={dateRange.endDate || ""}
            onChange={(e) => {
              setDateRange({ ...dateRange, endDate: e.target.value });
              setPage(1);
            }}
            className="h-9 text-xs"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Tipe Kompensasi
        </Label>
        <Select
          value={compensationType || "all"}
          onValueChange={(v) => {
            setCompensationType(v === "all" ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 text-xs bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary/20">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="refund">Tunai (Refund)</SelectItem>
            <SelectItem value="credit_note">Saldo (Credit Note)</SelectItem>
            <SelectItem value="exchange">Tukar Barang</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Customer
        </Label>
        <CustomerSelect
          value={customerId}
          onValueChange={(id) => {
            setCustomerId(id);
            setPage(1);
          }}
          placeholder="Cari Customer..."
        />
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
