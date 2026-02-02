import React from "react";
import { Check, ChevronsUpDown, Search, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SupplierResponse } from "@/services/supplierService";
import { useCreateSupplier } from "@/hooks/master/use-suppliers";
import { toast } from "sonner";

interface SupplierSelectProps {
  suppliers: SupplierResponse[];
  value?: number;
  onValueChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SupplierSelect({
  suppliers,
  value,
  onValueChange,
  placeholder = "Pilih supplier...",
  disabled,
}: SupplierSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const createSupplierMutation = useCreateSupplier();

  const filteredSuppliers = React.useMemo(() => {
    if (!search) return suppliers;
    return suppliers.filter((supplier) =>
      supplier.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [suppliers, search]);

  const selectedSupplier = React.useMemo(
    () => suppliers.find((s) => s.id === value),
    [suppliers, value],
  );

  const handleCreateSupplier = async () => {
    if (!search.trim()) return;

    try {
      const result = await createSupplierMutation.mutateAsync({
        name: search,
      });

      if (result.success && result.data) {
        onValueChange(result.data.id);
        setSearch("");
        setOpen(false);
        toast.success(`Supplier "${result.data.name}" berhasil dibuat`);
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Gagal membuat supplier baru");
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
          disabled={disabled || createSupplierMutation.isPending}
        >
          <span className="truncate">
            {selectedSupplier ? selectedSupplier.name : placeholder}
          </span>
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
            placeholder="Cari atau tambah supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto p-1">
          {filteredSuppliers.length === 0 && !search && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Tidak ada supplier.
            </div>
          )}

          {filteredSuppliers.map((supplier) => (
            <DropdownMenuItem
              key={supplier.id}
              onSelect={() => {
                onValueChange(supplier.id);
                setOpen(false);
                setSearch("");
              }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 text-primary",
                    value === supplier.id ? "opacity-100" : "opacity-0",
                  )}
                />
                {supplier.name}
              </div>
            </DropdownMenuItem>
          ))}

          {search &&
            !filteredSuppliers.some(
              (s) => s.name.toLowerCase() === search.toLowerCase(),
            ) && (
              <DropdownMenuItem
                onSelect={handleCreateSupplier}
                className="mt-1 border-t bg-muted/50 focus:bg-primary focus:text-primary-foreground"
              >
                <div className="flex items-center font-medium">
                  {createSupplierMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Tambah &quot;{search}&quot;
                </div>
              </DropdownMenuItem>
            )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
