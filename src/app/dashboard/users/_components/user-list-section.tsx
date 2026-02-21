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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useUsers } from "@/hooks/users/use-users";
import { useDeleteUser } from "@/hooks/users/use-delete-user";
import { ApiResponse, UserResponse } from "@/services/userService";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { AxiosError } from "axios";
import { SearchInput } from "@/components/ui/search-input";
import { FilterWrap } from "@/components/filter-wrap";
import { UserFilterForm } from "./ui/user-filter-form";

interface UserListSectionProps {
  onEdit: (user: UserResponse) => void;
}

export function UserListSection({ onEdit }: UserListSectionProps) {
  // Local State
  const [page, setPage] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [orderBy, setOrderBy] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const debouncedSearch = useDebounce(search, 500);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null);

  const { data, isLoading, isError } = useUsers({
    params: {
      page,
      limit,
      search: debouncedSearch,
      role: roleFilter,
      orderBy: orderBy,
      order: order,
    },
  });

  const hasActiveFilters =
    roleFilter !== "all" || orderBy !== "createdAt" || order !== "desc";

  const deleteUserMutation = useDeleteUser();

  const users = data?.data || [];
  const meta = data?.pagination;

  const handleDeleteClick = (user: UserResponse) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await deleteUserMutation.mutateAsync(userToDelete.id);
      toast.success("User berhasil dihapus");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error(error);
      const err = error as AxiosError<ApiResponse>;
      const errorMessage =
        err.response?.data?.error || err.message || "Gagal menghapus user";
      toast.error(errorMessage);
    }
  };

  // Handler for search to reset page
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  // Handlers needed for FilterForm that reset page
  const handleRoleChange = (val: string) => {
    setRoleFilter(val);
    setPage(1);
  };

  const handleOrderByChange = (val: string) => {
    setOrderBy(val);
    setPage(1);
  };

  const handleOrderChange = (val: "asc" | "desc") => {
    setOrder(val);
    setPage(1);
  };

  // Create a wrapper function for setPage string/number type mismatch in UserFilterForm
  const handlePageChange = (p: string | number) => {
    setPage(Number(p));
  };

  if (isError) {
    return (
      <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">
        Gagal memuat data user. Silakan coba lagi.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex flex-1 w-full gap-2">
          <div className="flex-1 max-w-72">
            <SearchInput
              placeholder="Cari user..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <FilterWrap hasActiveFilters={hasActiveFilters}>
            <UserFilterForm
              roleFilter={roleFilter}
              setRoleFilter={handleRoleChange}
              orderBy={orderBy}
              setOrderBy={handleOrderByChange}
              order={order}
              setOrder={handleOrderChange}
              setPage={(p) => handlePageChange(p)}
            />
          </FilterWrap>
        </div>
      </div>

      {/* Table Content */}
      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Tanggal Dibuat</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-muted-foreground">
                      Memuat data...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <p className="text-lg font-medium">Tidak ada user</p>
                    <p className="text-sm">
                      Belum ada data user yang sesuai dengan pencarian.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((r, idx) => (
                        <Badge
                          key={idx}
                          variant={
                            r.role === "admin sistem" ? "default" : "secondary"
                          }
                          className="capitalize"
                        >
                          {r.role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.createdAt
                      ? format(new Date(user.createdAt), "dd MMM yyyy", {
                          locale: id,
                        })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => onEdit(user)}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(user)}
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Halaman {meta.page} dari {meta.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(meta.page - 1)}
            disabled={meta.page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(meta.page + 1)}
            disabled={meta.page >= meta.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. User{" "}
              <span className="font-bold">{userToDelete?.name}</span> akan
              dihapus permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUserMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
