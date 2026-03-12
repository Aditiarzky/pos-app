"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppPagination } from "@/components/app-pagination";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Table2, Trash2, Edit2, Eye, Phone, MapPin, Filter } from "lucide-react";
import { useCustomers, useDeleteCustomer } from "@/hooks/master/use-customers";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { CustomerResponse } from "@/services/customerService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CustomerDetailSection } from "./customer-detail-section";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CustomerListSectionProps {
  searchInput: string;
  onEdit: (customer: CustomerResponse) => void;
}

export function CustomerListSection({
  searchInput,
  onEdit,
}: CustomerListSectionProps) {
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [balanceFilter, setBalanceFilter] = useState<
    "all" | "has_debt" | "no_debt" | "has_balance"
  >("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useCustomers({
    params: { page, limit, search: searchInput },
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const deleteMutation = useDeleteCustomer();

  const handleDelete = async (id: number) => {
    toast.promise(deleteMutation.mutateAsync(id), {
      loading: "Menghapus pelanggan...",
      success: "Pelanggan berhasil dihapus",
      error: "Gagal menghapus pelanggan",
    });
  };

  const openDetail = (id: number) => {
    setSelectedCustomerId(id);
    setIsDetailOpen(true);
  };

  const customers = data?.data ?? [];
  const filteredCustomers = useMemo(() => {
    switch (balanceFilter) {
      case "has_debt":
        return customers.filter((c) => (c.totalDebt || 0) > 0);
      case "no_debt":
        return customers.filter((c) => (c.totalDebt || 0) <= 0);
      case "has_balance":
        return customers.filter((c) => Number(c.creditBalance || 0) > 0);
      default:
        return customers;
    }
  }, [customers, balanceFilter]);
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {meta?.total ? `${meta.total} pelanggan ditemukan` : ""}
        </p>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Filter className="h-4 w-4" />
                {balanceFilter !== "all" ? (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setBalanceFilter("all")}>
                Semua
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBalanceFilter("has_debt")}>
                Ada Hutang
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBalanceFilter("no_debt")}>
                Tidak Berhutang
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBalanceFilter("has_balance")}>
                Ada Saldo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("table")}
          >
            <Table2 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("card")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <div className="overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/20 border-t border-b border-border/50">
              <TableRow className="border-none">
                <TableHead className="w-[60px] text-center text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">No</TableHead>
                <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Pelanggan</TableHead>
                <TableHead className="hidden md:table-cell text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Kontak & Alamat</TableHead>
                <TableHead className="text-right text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Saldo</TableHead>
                <TableHead className="text-right text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Status Hutang</TableHead>
                <TableHead className="w-[120px] text-right text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-border/30 last:border-none">
                    <TableCell colSpan={6} className="py-4"><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : filteredCustomers.length === 0 ? (
                <TableRow className="border-none">
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic font-medium">
                    Tidak ada data pelanggan ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((c: CustomerResponse, idx: number) => (
                  <TableRow key={c.id} className="group hover:bg-muted/30 transition-colors border-b border-border/30 last:border-none">
                    {/* Nomor */}
                    <TableCell className="text-center text-[12px] sm:text-xs px-2 sm:px-4 py-2 font-semibold text-muted-foreground">
                      {(page - 1) * limit + idx + 1}
                    </TableCell>
                    {/* Nama dengan Avatar Kecil */}
                    <TableCell className="px-2 sm:px-4 py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted/70 text-foreground flex items-center justify-center font-semibold text-xs shrink-0">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm truncate">{c.name}</span>
                          <span className="text-[10px] text-muted-foreground font-semibold">ID: #{c.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    {/* Kontak & Alamat (Stacked tapi bersih) */}
                    <TableCell className="hidden md:table-cell px-2 sm:px-4 py-2">
                      <div className="flex flex-col text-sm text-muted-foreground">
                        <span className="font-medium">{c.phone || "-"}</span>
                        <span className="text-xs truncate max-w-[200px]">
                          {c.address || "Alamat belum diatur"}
                        </span>
                      </div>
                    </TableCell>
                    {/* Saldo */}
                    <TableCell className="text-right px-2 sm:px-4 py-2">
                      <span className="inline-block px-3 py-1 rounded-lg text-xs font-semibold tabular-nums bg-blue-500/10 text-blue-500">
                        {formatCurrency(Number(c.creditBalance || 0))}
                      </span>
                    </TableCell>
                    {/* Hutang dengan warna fungsional */}
                    <TableCell className="text-right px-2 sm:px-4 py-2">
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold tabular-nums ${(c.totalDebt || 0) > 0
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                        }`}>
                        {formatCurrency(c.totalDebt || 0)}
                      </span>
                    </TableCell>
                    {/* Aksi - Selalu terlihat tapi halus */}
                    <TableCell className="text-right px-2 sm:px-4 py-2">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50" onClick={() => openDetail(c.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50" onClick={() => onEdit(c)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Pelanggan?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => handleDelete(c.id)}
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* CARD VIEW (Mobile Friendly) */}
      {viewMode === "card" && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[190px] sm:h-[210px] rounded-2xl" />
            ))
            : filteredCustomers.map((c: CustomerResponse) => (
              <Card
                key={c.id}
                className="flex flex-col p-0 overflow-hidden border-none bg-card shadow-sm hover:shadow-md transition-all duration-300 group ring-1 ring-border/50"
              >
                {/* Header Card: Nama & Hutang */}
                <div className="p-3 sm:p-5 pb-3 sm:pb-4 space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 border border-primary/20">
                        {c.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-bold text-sm sm:text-base leading-tight truncate group-hover:text-primary transition-colors">
                          {c.name}
                        </h3>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          ID: #{c.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body: Kontak & Alamat */}
                  <div className="space-y-2 text-sm border-t pt-3 sm:pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-blue-500/80 font-medium">Saldo</p>
                        <p className="text-xs font-semibold text-blue-500 tabular-nums">
                          {formatCurrency(Number(c.creditBalance || 0))}
                        </p>
                      </div>
                      <div>
                        <p className={`text-[10px] font-medium ${(c.totalDebt || 0) > 0 ? "text-destructive/80" : "text-primary/80"}`}>Hutang</p>
                        <p className={`text-xs font-semibold tabular-nums ${(c.totalDebt || 0) > 0 ? "text-destructive" : "text-primary"}`}>
                          {formatCurrency(c.totalDebt || 0)}
                        </p>
                      </div>
                    </div>
                    <Separator className="my-2 sm:my-4" />
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 text-primary/60" />
                      <span className="text-xs truncate">{c.phone || "Tidak ada telepon"}</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary/60 mt-0.5" />
                      <span className="text-xs line-clamp-2 leading-relaxed italic">
                        {c.address || "Alamat belum diatur"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer: Tombol Aksi */}
                <div className="mt-auto p-3 sm:p-4 pt-0 flex gap-1.5 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 sm:h-9 bg-primary/5 rounded-lg text-[10px] sm:text-xs font-medium px-1 sm:px-2"
                    onClick={() => openDetail(c.id)}
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" /> Detail
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 sm:h-9 bg-primary/5 text-primary rounded-lg text-[10px] sm:text-xs font-medium px-1 sm:px-2"
                    onClick={() => onEdit(c)}
                  >
                    <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Pelanggan?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => handleDelete(c.id)}
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))}
        </div>
      )}

      {meta && (
        <AppPagination
          currentPage={page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
        />
      )}

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-[620px] w-full p-0">
          <SheetHeader className="sm:p-6 p-4 border-b">
            <SheetTitle>Detail Pelanggan</SheetTitle>
          </SheetHeader>
          <ScrollArea className="max-h-dvh">
            <div className="sm:p-6 p-2">
              {selectedCustomerId && <CustomerDetailSection customerId={selectedCustomerId} />}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
