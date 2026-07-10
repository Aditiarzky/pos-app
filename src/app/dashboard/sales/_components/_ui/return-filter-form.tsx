import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { CustomerSelect } from "@/components/ui/customer-select";
import { Label } from "@/components/ui/label";
import { DateRange } from "react-day-picker";
import { format, parseISO } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";

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
  const selectedRange: DateRange | undefined = {
    from: dateRange.startDate ? parseISO(dateRange.startDate) : undefined,
    to: dateRange.endDate ? parseISO(dateRange.endDate) : undefined,
  };

  return (
    <div className="space-y-4 p-1">
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Rentang Tanggal
        </Label>
        <DateRangePicker
          value={selectedRange}
          onChange={(range) => {
            setDateRange({
              startDate: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
              endDate: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
            });
            setPage(1);
          }}
          buttonClassName="h-9 text-xs bg-muted/50 border-none shadow-none"
        />
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
            <SelectItem value="credit_note">Saldo Pelanggan</SelectItem>
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
