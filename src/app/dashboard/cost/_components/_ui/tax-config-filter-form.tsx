import { Button } from "@/components/ui/button";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface TaxConfigFilterFormProps {
  isActiveFilter: boolean | undefined;
  setIsActiveFilter: (value: boolean | undefined) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
  isDropdown?: boolean;
}

export function TaxConfigFilterForm({
  isActiveFilter,
  setIsActiveFilter,
  setPage,
  resetFilters,
  isDropdown,
}: TaxConfigFilterFormProps) {
  const handleStatusChange = (value: string) => {
    const mapped =
      value === "true" ? true : value === "false" ? false : undefined;
    setIsActiveFilter(mapped);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium leading-none text-xs text-muted-foreground uppercase tracking-wider">
          Status
        </h4>
        <RadioGroup
          value={
            isActiveFilter === undefined
              ? "all"
              : isActiveFilter
                ? "true"
                : "false"
          }
          onValueChange={handleStatusChange}
          className="grid grid-cols-3 gap-2"
        >
          <Label
            htmlFor="status-all"
            className="flex items-center justify-center rounded-md border bg-muted/50 px-3 py-1.5 text-xs cursor-pointer hover:bg-muted"
          >
            <RadioGroupItem id="status-all" value="all" className="sr-only" />
            Semua
          </Label>
          <Label
            htmlFor="status-active"
            className="flex items-center justify-center rounded-md border bg-muted/50 px-3 py-1.5 text-xs cursor-pointer hover:bg-muted"
          >
            <RadioGroupItem
              id="status-active"
              value="true"
              className="sr-only"
            />
            Aktif
          </Label>
          <Label
            htmlFor="status-inactive"
            className="flex items-center justify-center rounded-md border bg-muted/50 px-3 py-1.5 text-xs cursor-pointer hover:bg-muted"
          >
            <RadioGroupItem
              id="status-inactive"
              value="false"
              className="sr-only"
            />
            Nonaktif
          </Label>
        </RadioGroup>
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
}

