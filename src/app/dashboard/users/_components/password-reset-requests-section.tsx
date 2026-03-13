"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PasswordResetRequest } from "@/services/passwordResetService";
import { usePasswordResetRequests } from "@/hooks/users/use-password-reset-requests";
import { useResolvePasswordReset } from "@/hooks/users/use-resolve-password-reset";

const statusVariant = (status: PasswordResetRequest["status"]) => {
  if (status === "completed") return "default";
  if (status === "rejected") return "outline";
  return "secondary";
};

const statusLabel = (status: PasswordResetRequest["status"]) => {
  if (status === "completed") return "Selesai";
  if (status === "rejected") return "Ditolak";
  return "Pending";
};

export function PasswordResetRequestsSection() {
  const { data, isLoading, isError } = usePasswordResetRequests();
  const resolveMutation = useResolvePasswordReset();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<PasswordResetRequest | null>(null);

  const requests = data?.data || [];

  const handleResolveClick = (request: PasswordResetRequest) => {
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  const confirmResolve = async () => {
    if (!selectedRequest) return;

    try {
      await resolveMutation.mutateAsync(selectedRequest.id);
      toast.success("Password direset ke default (Password123)");
      setDialogOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mereset password");
    }
  };

  if (isError) {
    return (
      <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">
        Gagal memuat permintaan reset password.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/20 border-t border-b border-border/50">
            <TableRow className="border-none">
              <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                Email
              </TableHead>
              <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                Nama User
              </TableHead>
              <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                Tanggal Request
              </TableHead>
              <TableHead className="text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide">
                Status
              </TableHead>
              <TableHead className="w-[160px] text-[12px] sm:text-sm h-8 sm:h-10 px-2 sm:px-4 font-semibold text-muted-foreground uppercase tracking-wide" />
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
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <p className="text-lg font-medium">Belum ada request</p>
                    <p className="text-sm">
                      Permintaan reset password akan muncul di sini.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow
                  key={request.id}
                  className="hover:bg-muted/50 transition-colors border-b border-border/30 last:border-none"
                >
                  <TableCell className="text-[12px] sm:text-sm px-2 sm:px-4 py-2">
                    {request.email}
                  </TableCell>
                  <TableCell className="text-[12px] sm:text-sm px-2 sm:px-4 py-2 font-semibold">
                    {request.user?.name || "-"}
                  </TableCell>
                  <TableCell className="text-[12px] sm:text-sm px-2 sm:px-4 py-2 text-muted-foreground">
                    {request.requestedAt
                      ? format(new Date(request.requestedAt), "dd MMM yyyy", {
                          locale: id,
                        })
                      : "-"}
                  </TableCell>
                  <TableCell className="px-2 sm:px-4 py-2">
                    <Badge variant={statusVariant(request.status)}>
                      {statusLabel(request.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-2 sm:px-4 py-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveClick(request)}
                        disabled={
                          request.status !== "pending" ||
                          resolveMutation.isPending
                        }
                      >
                        Reset ke Default
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset password ke default?</AlertDialogTitle>
            <AlertDialogDescription>
              Password user akan diubah menjadi default "Password123". Pastikan
              user diberi tahu setelah proses selesai.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resolveMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmResolve();
              }}
              disabled={resolveMutation.isPending}
              className="bg-primary hover:brightness-90"
            >
              {resolveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Reset"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
