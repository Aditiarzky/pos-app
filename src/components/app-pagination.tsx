import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
              {[12, 24, 48, 100].map((l) => (
                <SelectItem key={l} value={l.toString()}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Pagination Controls */}
      <Pagination className="justify-center sm:justify-end">
        <PaginationContent>
          {/* Previous Button */}
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage > 1) onPageChange(currentPage - 1);
              }}
            />
          </PaginationItem>

          {/* Page Numbers */}
          {pages.map((p) => (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === currentPage}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(p);
                }}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}

          {/* Next Button */}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage < totalPages) onPageChange(currentPage + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
