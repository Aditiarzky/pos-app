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
import { CategoryType } from "@/drizzle/type";
import { useCreateCategory } from "@/hooks/master/use-categories";
import { toast } from "sonner";
import { ApiResponse } from "@/services/productService";

interface CategorySelectProps {
  categories: CategoryType[];
  value?: number;
  onValueChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CategorySelect({
  categories,
  value,
  onValueChange,
  placeholder = "Pilih kategori...",
  disabled,
}: CategorySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const createCategoryMutation = useCreateCategory();

  const filteredCategories = React.useMemo(() => {
    if (!search) return categories;
    return categories.filter((category) =>
      category.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [categories, search]);

  const selectedCategory = React.useMemo(
    () => categories.find((category) => category.id === value),
    [categories, value],
  );

  const handleCreateCategory = async () => {
    if (!search.trim()) return;

    try {
      const result = await createCategoryMutation.mutateAsync({
        name: search,
      });

      if (result.success && result.data) {
        onValueChange(result.data.id);
        setSearch("");
        setOpen(false);
        toast.success(`Kategori "${result.data.name}" berhasil dibuat`);
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as ApiResponse)?.error ?? "Gagal membuat kategori baru";
      toast.error(errorMessage);
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
          disabled={disabled || createCategoryMutation.isPending}
        >
          {selectedCategory ? selectedCategory.name : placeholder}
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
            placeholder="Cari atau tambah kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto p-1">
          {filteredCategories.length === 0 && !search && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Tidak ada kategori.
            </div>
          )}

          {filteredCategories.map((category) => (
            <DropdownMenuItem
              key={category.id}
              onSelect={() => {
                onValueChange(category.id);
                setOpen(false);
                setSearch("");
              }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === category.id ? "opacity-100" : "opacity-0",
                  )}
                />
                {category.name}
              </div>
            </DropdownMenuItem>
          ))}

          {search &&
            !filteredCategories.some(
              (c) => c.name.toLowerCase() === search.toLowerCase(),
            ) && (
              <DropdownMenuItem
                onSelect={handleCreateCategory}
                className="mt-1 border-t bg-muted/50 focus:bg-primary focus:text-primary-foreground"
              >
                <div className="flex items-center font-medium">
                  {createCategoryMutation.isPending ? (
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
