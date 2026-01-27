"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import {
  usePurchases,
  useDeletePurchase,
} from "@/hooks/purchases/use-purchases";
import { formatCurrency, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { AppPagination } from "@/components/app-pagination";
import { Button } from "@/components/ui/button";
import {
  Search,
  Edit,
  Trash2,
  Printer,
  Filter,
  LayoutList,
  MoreHorizontal,
  SearchX,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/contexts/ConfirmDialog";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { IconSortAscending, IconSortDescending } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PurchaseListSectionProps {
  onEdit: (purchase: any) => void;
}

export function PurchaseListSection({ onEdit }: PurchaseListSectionProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  const [orderBy, setOrderBy] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const confirm = useConfirm();
  const deleteMutation = useDeletePurchase();

  const { data: purchasesResult, isLoading } = usePurchases({
    page,
    limit,
    search: debouncedSearch,
    orderBy,
    order,
  });
  const purchases = purchasesResult?.data ?? [];
  const meta = purchasesResult?.meta;

  const hasActiveFilters = orderBy !== "createdAt" || order !== "desc";

  const handleDelete = async (purchase: any) => {
    const ok = await confirm({
      title: "Hapus Pembelian",
      description: `Apakah Anda yakin ingin menghapus transaksi ${purchase.invoiceNumber || purchase.orderNumber}? Stok produk akan dikembalikan dan data akan diarsipkan.`,
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });

    if (ok) {
      try {
        await deleteMutation.mutateAsync(purchase.id);
        toast.success("Transaksi berhasil dihapus");
      } catch (error) {
        toast.error("Gagal menghapus transaksi");
      }
    }
  };

  const handlePrint = (purchase: any) => {
    // Basic print logic - in reality would probably open a specific route
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row gap-3 bg-background rounded-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari No. Invoice atau Supplier..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <div className="flex gap-2">
          {/* Mobile Filter Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="h-10 sm:hidden relative border-dashed"
              >
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
              <FilterForm
                orderBy={orderBy}
                setOrderBy={setOrderBy}
                order={order}
                setOrder={setOrder}
                setPage={setPage}
              />
            </SheetContent>
          </Sheet>

          {/* Desktop Filter Trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 hidden sm:flex relative border-dashed"
              >
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
              <FilterForm
                orderBy={orderBy}
                setOrderBy={setOrderBy}
                order={order}
                setOrder={setOrder}
                setPage={setPage}
                isDropdown
              />
            </DropdownMenuContent>
          </DropdownMenu>

          <Badge
            variant="secondary"
            className="h-10 px-4 rounded-lg hidden md:flex items-center gap-2 font-medium"
          >
            <LayoutList className="h-4 w-4" />
            Total {meta?.total || 0} Transaksi
          </Badge>
        </div>
      </div>

      <Card className="overflow-hidden border-border/50 shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-bold">No. Invoice</TableHead>
              <TableHead className="font-bold text-center">Tanggal</TableHead>
              <TableHead className="font-bold">Supplier</TableHead>
              <TableHead className="text-right font-bold">
                Total Amount
              </TableHead>
              <TableHead className="font-bold">Dicatat Oleh</TableHead>
              <TableHead className="text-right font-bold w-20">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-10 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : purchases.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-64 text-center text-muted-foreground italic"
                >
                  <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 text-2xl">
                      <SearchX />
                    </div>
                    <h3 className="text-lg font-medium text-foreground italic">
                      Tidak ada riwayat pembelian ditemukan
                    </h3>
                    <p className="text-sm max-w-xs mx-auto not-italic">
                      Coba sesuaikan kata kunci pencarian atau filter Anda.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((purchase) => (
                <TableRow
                  key={purchase.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  <TableCell className="font-mono font-bold text-primary">
                    <div className="flex items-center gap-2">
                      {purchase.orderNumber}
                      {purchase.isArchived && (
                        <Badge variant="destructive">Archived</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {formatDate(purchase.createdAt!)}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground">
                      {purchase.supplier?.name || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-black text-primary text-base">
                    {formatCurrency(Number(purchase.total || purchase.total))}
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground">
                    {purchase.user?.name || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => onEdit(purchase)}
                          className="gap-2 cursor-pointer"
                        >
                          <Edit className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handlePrint(purchase)}
                          className="gap-2 cursor-pointer"
                        >
                          <Printer className="h-4 w-4" /> Cetak
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(purchase)}
                          className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {meta && (
        <div className="pt-2">
          <AppPagination
            currentPage={page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={setLimit}
          />
        </div>
      )}
    </div>
  );
}

interface FilterFormProps {
  orderBy: string;
  setOrderBy: (v: string) => void;
  order: string;
  setOrder: (v: any) => void;
  setPage: (p: number) => void;
  isDropdown?: boolean;
}

function FilterForm({
  orderBy,
  setOrderBy,
  order,
  setOrder,
  setPage,
  isDropdown,
}: FilterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium leading-none text-xs text-muted-foreground uppercase tracking-wider">
          Urutkan
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={orderBy}
            onValueChange={(v) => {
              setOrderBy(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 px-3 bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary/20 cursor-pointer">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Tanggal</SelectItem>
              <SelectItem value="orderNumber">No. Invoice</SelectItem>
              <SelectItem value="total">Total</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={order}
            onValueChange={(v: any) => {
              setOrder(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 px-3 bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-primary/20 cursor-pointer">
              <SelectValue placeholder="A-Z" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">
                Ascending{" "}
                <IconSortAscending className="h-4 w-4 ml-2 inline text-muted-foreground" />
              </SelectItem>
              <SelectItem value="desc">
                Descending{" "}
                <IconSortDescending className="h-4 w-4 ml-2 inline text-muted-foreground" />
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isDropdown && <DropdownMenuSeparator />}
      <Button
        variant="ghost"
        className="w-full h-10 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
        onClick={() => {
          setOrderBy("createdAt");
          setOrder("desc");
          setPage(1);
        }}
      >
        Reset Filter
      </Button>
    </div>
  );
}
