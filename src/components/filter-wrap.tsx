import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Filter } from "lucide-react";

export const FilterWrap = ({
  children,
  hasActiveFilters,
}: {
  children: React.ReactNode;
  hasActiveFilters: boolean;
}) => {
  const triggerClassName =
    "relative h-10 rounded-app-lg border-border/70 bg-background shadow-sm hover:border-primary/40 hover:bg-primary/5";

  return (
    <>
      {/* Mobile Filter Trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={`${triggerClassName} sm:hidden`}
          >
            <Filter className="h-4 w-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary/35"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary ring-2 ring-background"></span>
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="px-4 py-6 sm:hidden rounded-t-4xl"
        >
          <SheetHeader className="mb-4">
            <SheetTitle>Filter Lanjutan</SheetTitle>
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>

      {/* Desktop Filter Trigger */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`${triggerClassName} hidden sm:flex px-3`}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter Lanjutan
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary/35"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary ring-2 ring-background"></span>
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 p-4" align="end">
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
