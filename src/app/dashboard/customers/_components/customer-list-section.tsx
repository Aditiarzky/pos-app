"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AppPagination } from "@/components/app-pagination";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Eye, User } from "lucide-react";
import { useCustomers, useDeleteCustomer } from "@/hooks/master/use-customers";
import { useState } from "react";
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

interface CustomerListSectionProps {
  searchInput: string;
  onEdit: (customer: CustomerResponse) => void;
}

export function CustomerListSection({
  searchInput,
  onEdit,
}: CustomerListSectionProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useCustomers({
    params: {
      page,
      limit,
      search: searchInput,
    },
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const deleteMutation = useDeleteCustomer();

  const handleDelete = async (id: number) => {
    const deletePromise = deleteMutation.mutateAsync(id);

    toast.promise(deletePromise, {
      loading: "Menghapus pelanggan...",
      success: "Pelanggan berhasil dihapus",
      error: "Gagal menghapus pelanggan",
    });
  };

  const openDetail = (id: number) => {
    setSelectedCustomerId(id);
    setIsDetailOpen(true);
  };

  const customers = data?.data;
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-12 text-center">No.</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead className="text-right">Sisa Hutang</TableHead>
              <TableHead className="text-right w-32">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : customers?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Tidak ada data pelanggan.
                </TableCell>
              </TableRow>
            ) : (
              customers?.map((customer: CustomerResponse, idx: number) => (
                <TableRow key={customer.id}>
                  <TableCell className="text-center">
                    {(page - 1) * limit + idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {customer.address || "-"}
                  </TableCell>
                  <TableCell className="text-right font-bold text-rose-600">
                    {formatCurrency(customer.totalDebt || 0)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openDetail(customer.id)}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onEdit(customer)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Hapus Pelanggan?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus pelanggan{" "}
                              <strong>{customer.name}</strong>? Tindakan ini
                              tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(customer.id)}
                              className="bg-destructive hover:bg-destructive/90"
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
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Detail Pelanggan
            </SheetTitle>
          </SheetHeader>
          {selectedCustomerId && (
            <CustomerDetailSection customerId={selectedCustomerId} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
