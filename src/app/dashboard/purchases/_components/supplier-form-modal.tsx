"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supplierSchema, SupplierData } from "@/lib/validations/supplier";
import {
  useCreateSupplier,
  useUpdateSupplier,
  useSuppliers,
} from "@/hooks/master/use-suppliers";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ApiResponse } from "@/services/productService";

interface SupplierFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId?: number | null;
}

export function SupplierFormModal({
  open,
  onOpenChange,
  supplierId,
}: SupplierFormModalProps) {
  const isEdit = !!supplierId;
  const { data: suppliersResult } = useSuppliers();
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (isEdit && suppliersResult?.data) {
      const supplier = suppliersResult.data.find((s) => s.id === supplierId);
      if (supplier) {
        reset({
          name: supplier.name,
          address: supplier.address || "",
          phone: supplier.phone || "",
        });
      }
    } else if (!open) {
      reset({ name: "", address: "", phone: "" });
    }
  }, [isEdit, supplierId, suppliersResult, open, reset]);

  const onSubmit = async (data: SupplierData) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: supplierId, ...data });
        toast.success("Supplier berhasil diperbarui");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Supplier berhasil ditambahkan");
      }
      onOpenChange(false);
    } catch (error: unknown) {
      const apiError = error as ApiResponse;
      toast.error(apiError.error || "Terjadi kesalahan");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Supplier" : "Tambah Supplier Baru"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nama Supplier <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Contoh: PT. Sumber Bakti"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="08123456789"
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              {...register("address")}
              placeholder="Alamat lengkap supplier..."
              className="resize-none h-24"
            />
            {errors.address && (
              <p className="text-xs text-destructive">
                {errors.address.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? "Perbarui" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
