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
  return (
    <>
      {/* Mobile Filter Trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="h-10 sm:hidden relative">
            <Filter className="mr-2 h-4 w-4" />
            Filter
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="px-4 py-6 sm:hidden rounded-t-[20px]"
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
          <Button variant="outline" className="h-10 hidden sm:flex relative">
            <Filter className="mr-2 h-4 w-4" />
            Filter Lanjutan
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
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
