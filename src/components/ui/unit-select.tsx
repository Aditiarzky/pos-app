"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { UnitType } from "@/drizzle/type";
import { useCreateUnit } from "@/hooks/master/use-units";
import { toast } from "sonner";

interface UnitSelectProps {
  units: UnitType[];
  value?: number;
  onValueChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function UnitSelect({
  units,
  value,
  onValueChange,
  placeholder = "Pilih satuan...",
  disabled,
}: UnitSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const createUnitMutation = useCreateUnit();

  const filteredUnits = React.useMemo(() => {
    if (!search) return units;
    return units.filter((unit) =>
      unit.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [units, search]);

  const selectedUnit = React.useMemo(
    () => units.find((unit) => unit.id === value),
    [units, value],
  );

  const handleCreateUnit = async () => {
    if (!search.trim()) return;

    try {
      const result = await createUnitMutation.mutateAsync({
        name: search,
        symbol: search.toLowerCase().substring(0, 3), // Default symbol
      });

      if (result.success && result.data) {
        onValueChange(result.data.id);
        setSearch("");
        setOpen(false);
        toast.success(`Satuan "${result.data.name}" berhasil dibuat`);
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat satuan baru");
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || createUnitMutation.isPending}
        >
          {selectedUnit ? selectedUnit.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[var(--radix-dropdown-menu-trigger-width)] p-0"
        align="start"
      >
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Cari atau tambah satuan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto p-1">
          {filteredUnits.length === 0 && !search && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Tidak ada satuan.
            </div>
          )}

          {filteredUnits.map((unit) => (
            <DropdownMenuItem
              key={unit.id}
              onSelect={() => {
                onValueChange(unit.id);
                setOpen(false);
                setSearch("");
              }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === unit.id ? "opacity-100" : "opacity-0",
                  )}
                />
                {unit.name}
              </div>
            </DropdownMenuItem>
          ))}

          {search &&
            !filteredUnits.some(
              (u) => u.name.toLowerCase() === search.toLowerCase(),
            ) && (
              <DropdownMenuItem
                onSelect={handleCreateUnit}
                className="mt-1 border-t bg-muted/50 focus:bg-primary focus:text-primary-foreground"
              >
                <div className="flex items-center font-medium">
                  {createUnitMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Tambah "{search}"
                </div>
              </DropdownMenuItem>
            )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
