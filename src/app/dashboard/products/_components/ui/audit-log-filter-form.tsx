import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface AuditLogFilterFormProps {
  actionFilter: string;
  setActionFilter: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  setPage: (p: number) => void;
  isDropdown?: boolean;
}

const ACTION_LABELS: Record<string, string> = {
  create: "Dibuat",
  update: "Diperbarui",
  delete: "Dihapus",
  hard_delete: "Dihapus Permanen",
  restore: "Dipulihkan",
  stock_adjustment: "Penyesuaian Stok",
};

export const AuditLogFilterForm = ({
  actionFilter,
  setActionFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  setPage,
  isDropdown,
}: AuditLogFilterFormProps) => {
  return (
    <div className="space-y-4 min-w-[240px]">
      <div className="space-y-2">
        <h4 className="font-medium leading-none text-xs text-muted-foreground uppercase tracking-wider">
          Aksi
        </h4>
        <Select
          value={actionFilter}
          onValueChange={(v) => {
            setActionFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full h-10 px-3 bg-muted/50 border-none shadow-none text-xs">
            <SelectValue placeholder="Semua Aksi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Aksi</SelectItem>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-xs">
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium leading-none text-xs text-muted-foreground uppercase tracking-wider">
          Rentang Tanggal
        </h4>
        <div className="grid grid-cols-1 gap-2">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Dari</p>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="h-10 bg-muted/50 border-none shadow-none text-xs"
            />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Sampai</p>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="h-10 bg-muted/50 border-none shadow-none text-xs"
            />
          </div>
        </div>
      </div>

      {isDropdown && <DropdownMenuSeparator />}
      <Button
        variant="ghost"
        className="w-full h-10 text-xs font-semibold text-muted-foreground"
        onClick={() => {
          setActionFilter("all");
          setDateFrom("");
          setDateTo("");
          setPage(1);
        }}
      >
        Reset Filter
      </Button>
    </div>
  );
};
