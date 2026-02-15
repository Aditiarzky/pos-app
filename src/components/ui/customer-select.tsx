"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCustomers, useCreateCustomer } from "@/hooks/master/use-customers";
import { toast } from "sonner";

interface CustomerSelectProps {
  value?: number;
  onValueChange: (value: number) => void;
  customers?: { id: number; name: string }[];
  placeholder?: string;
  disabled?: boolean;
}

export function CustomerSelect({
  value,
  onValueChange,
  customers: propCustomers,
  placeholder = "Pilih Customer...",
  disabled,
}: CustomerSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Fetch customers if not provided
  const { data: customerResult, isLoading } = useCustomers();

  const customers = React.useMemo(
    () => propCustomers || customerResult?.data || [],
    [propCustomers, customerResult?.data],
  );

  const createMutation = useCreateCustomer();

  const filteredCustomers = React.useMemo(() => {
    if (!search) return customers;
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [customers, search]);

  const selectedCustomer = React.useMemo(
    () => customers.find((c) => c.id === value),
    [customers, value],
  );

  const handleCreateCustomer = async () => {
    if (!search.trim()) return;

    try {
      const result = await createMutation.mutateAsync({
        name: search,
      });

      if (result.success && result.data) {
        toast.success(`Customer "${result.data.name}" berhasil dibuat`);
        onValueChange(result.data.id);
        setSearch("");
        setOpen(false);
      } else {
        toast.error("Gagal membuat customer baru");
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal membuat customer baru");
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
          disabled={disabled || isLoading || createMutation.isPending}
        >
          <span className="truncate">
            {selectedCustomer ? selectedCustomer.name : placeholder}
          </span>
          {isLoading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
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
            placeholder="Cari atau tambah customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto p-1">
          {filteredCustomers.length === 0 && !search && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Tidak ada customer.
            </div>
          )}

          {filteredCustomers.map((customer) => (
            <DropdownMenuItem
              key={customer.id}
              onSelect={() => {
                onValueChange(customer.id);
                setOpen(false);
                setSearch("");
              }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 text-primary",
                    value === customer.id ? "opacity-100" : "opacity-0",
                  )}
                />
                {customer.name}
              </div>
            </DropdownMenuItem>
          ))}

          {search &&
            !filteredCustomers.some(
              (c) => c.name.toLowerCase() === search.toLowerCase(),
            ) && (
              <DropdownMenuItem
                onSelect={handleCreateCustomer}
                className="mt-1 border-t bg-muted/50 focus:bg-primary focus:text-primary-foreground"
              >
                <div className="flex items-center font-medium">
                  {createMutation.isPending ? (
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
