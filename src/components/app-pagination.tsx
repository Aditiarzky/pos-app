import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

export function AppPagination({
  currentPage,
  totalPages,
  onPageChange,
  limit,
  onLimitChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  limit?: number;
  onLimitChange?: (newLimit: number) => void;
}) {
  // Simple logic to show page numbers
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Limit Selector */}
      {onLimitChange && limit && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Baris per halaman:
          </span>
          <Select
            value={limit.toString()}
            onValueChange={(v) => onLimitChange(Number(v))}
          >
            <SelectTrigger className="w-[70px] h-8 px-2">
              <SelectValue placeholder={limit.toString()} />
            </SelectTrigger>
            <SelectContent>
              {[10, 12, 24, 48, 100].map((l) => (
                <SelectItem key={l} value={l.toString()}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="text-muted-foreground flex grow items-center justify-end whitespace-nowrap max-sm:justify-center">
        <p
          className="text-muted-foreground text-sm whitespace-nowrap"
          aria-live="polite"
        >
          Halaman <span className="text-foreground">{currentPage}</span> dari{" "}
          <span className="text-foreground">{totalPages}</span> halaman
        </p>
      </div>

      {/* Pagination Controls */}
      <Pagination className="justify-center sm:justify-end">
        <PaginationContent>
          {/* First Page Button */}
          <PaginationItem>
            <PaginationLink
              href="#"
              aria-label="Go to first page"
              size="icon"
              className="rounded-full"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(1);
              }}
              aria-disabled={currentPage === 1}
            >
              <ChevronFirstIcon className="size-4" />
            </PaginationLink>
          </PaginationItem>

          {/* Previous Page Button */}
          <PaginationItem>
            <PaginationLink
              href="#"
              aria-label="Go to previous page"
              size="icon"
              className="rounded-full"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage > 1) onPageChange(currentPage - 1);
              }}
              aria-disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="size-4" />
            </PaginationLink>
          </PaginationItem>

          {/* Page Selection Dropdown */}
          <PaginationItem>
            <Select
              value={String(currentPage)}
              onValueChange={(value) => onPageChange(Number(value))}
              aria-label="Select page"
            >
              <SelectTrigger
                id="select-page"
                className="w-fit whitespace-nowrap"
                aria-label="Select page"
              >
                <SelectValue placeholder="Select page" />
              </SelectTrigger>
              <SelectContent>
                {pages.map((page) => (
                  <SelectItem key={page} value={String(page)}>
                    Halaman {page}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PaginationItem>

          {/* Next Page Button */}
          <PaginationItem>
            <PaginationLink
              href="#"
              aria-label="Go to next page"
              size="icon"
              className="rounded-full"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage < totalPages) onPageChange(currentPage + 1);
              }}
              aria-disabled={currentPage === totalPages}
            >
              <ChevronRightIcon className="size-4" />
            </PaginationLink>
          </PaginationItem>

          {/* Last Page Button */}
          <PaginationItem>
            <PaginationLink
              href="#"
              aria-label="Go to last page"
              size="icon"
              className="rounded-full"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(totalPages);
              }}
              aria-disabled={currentPage === totalPages}
            >
              <ChevronLastIcon className="size-4" />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
