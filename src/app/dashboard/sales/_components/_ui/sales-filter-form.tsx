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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isAfter, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { useState, useEffect } from "react";

interface SalesFilterFormProps {
  dateRange: { startDate?: string; endDate?: string };
  setDateRange: (range: { startDate?: string; endDate?: string }) => void;
  status: string | undefined;
  setStatus: (v: string | undefined) => void;
  customerId: number | undefined;
  setCustomerId: (id: number | undefined) => void;
  setPage: (p: number) => void;
  resetFilters: () => void;
  isDropdown?: boolean;
}

export const SalesFilterForm = ({
  dateRange,
  setDateRange,
  status,
  setStatus,
  customerId,
  setCustomerId,
  setPage,
  resetFilters,
  isDropdown,
}: SalesFilterFormProps) => {
  // State lokal untuk range (dari react-day-picker)
  const [range, setRange] = useState<DateRange | undefined>({
    from: dateRange.startDate ? parseISO(dateRange.startDate) : undefined,
    to: dateRange.endDate ? parseISO(dateRange.endDate) : undefined,
  });

  // Sinkronisasi jika props berubah dari luar (misal tombol reset)
  useEffect(() => {
    setRange({
      from: dateRange.startDate ? parseISO(dateRange.startDate) : undefined,
      to: dateRange.endDate ? parseISO(dateRange.endDate) : undefined,
    });
  }, [dateRange]);

  const today = startOfDay(new Date());

  // Handler saat user memilih range di kalender
  const handleRangeSelect = (newRange: DateRange | undefined) => {
    setRange(newRange);
    const startStr = newRange?.from ? format(newRange.from, "yyyy-MM-dd") : undefined;
    const endStr = newRange?.to ? format(newRange.to, "yyyy-MM-dd") : undefined;
    setDateRange({ startDate: startStr, endDate: endStr });
    setPage(1);
  };

  // Format tampilan rentang tanggal di tombol
  const formatRangeDisplay = () => {
    if (range?.from && range?.to) {
      return `${format(range.from, "dd/MM/yyyy")} - ${format(range.to, "dd/MM/yyyy")}`;
    }
    if (range?.from) {
      return `${format(range.from, "dd/MM/yyyy")} - ...`;
    }
    return "Pilih rentang tanggal";
  };

  return (
    <div className="space-y-4 p-1">
      {/* Bagian Rentang Tanggal */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Rentang Tanggal
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-9 text-xs",
                !range?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatRangeDisplay()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={range}
              onSelect={handleRangeSelect}
              numberOfMonths={1}
              captionLayout="dropdown"
              disabled={(date) => isAfter(date, today)}
              locale={id}
              className="[--cell-size:--spacing(8)]"
              formatters={{
                formatMonthDropdown: (date) =>
                  date.toLocaleString("default", { month: "long" }),
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Status
        </Label>
        <Select
          value={status || "all"}
          onValueChange={(v) => {
            setStatus(v === "all" ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 text-xs bg-muted/50 focus:ring-1 focus:ring-primary/20">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
            <SelectItem value="debt">Hutang</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customer */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Customer
        </Label>
        <CustomerSelect
          className="text-xs"
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
        onClick={() => {
          resetFilters();
          setRange({ from: undefined, to: undefined }); // reset lokal juga
        }}
      >
        Reset Filter
      </Button>
    </div>
  );
};
