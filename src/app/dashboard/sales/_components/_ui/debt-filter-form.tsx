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

interface DebtFilterFormProps {
  status: "active" | "unpaid" | "partial";
  setStatus: (value: "active" | "unpaid" | "partial") => void;
  customerId: number | undefined;
  setCustomerId: (id: number | undefined) => void;
  resetFilters: () => void;
  isDropdown?: boolean;
}

export const DebtFilterForm = ({
  status,
  setStatus,
  customerId,
  setCustomerId,
  resetFilters,
  isDropdown,
}: DebtFilterFormProps) => {
  return (
    <div className="space-y-4 p-1">
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Status Hutang
        </Label>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as "active" | "unpaid" | "partial")}
        >
          <SelectTrigger className="h-9 text-xs bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary/20">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Semua Status</SelectItem>
            <SelectItem value="unpaid">Belum Lunas</SelectItem>
            <SelectItem value="partial">Nyicil</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Customer
        </Label>
        <CustomerSelect
          value={customerId}
          onValueChange={(id) => setCustomerId(id)}
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
