"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useCreateSupplier,
  useUpdateSupplier,
} from "@/hooks/master/use-suppliers"; // Using existing hooks
import { useSupplierForm } from "../_hooks/use-supplier-form";
import { SupplierFormProps } from "../_types/supplier";
import {
  supplierSchema,
  SupplierData as SupplierFormData,
} from "@/lib/validations/supplier";

// ============================================
// MAIN COMPONENT
// ============================================

export function SupplierForm({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: SupplierFormProps) {
  // Mutations
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  // Supplier form hook
  const { form, isSubmitting, onSubmit } = useSupplierForm({
    onSuccess: () => {
      toast.success(
        initialData ? "Supplier diperbarui" : "Supplier berhasil ditambahkan",
      );
      onSuccess?.();
      onClose();
    },
    createMutation,
    updateMutation,
    initialData,
  });

  // ============================================
  // RENDER
  // ============================================

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogTitle hidden>
          {initialData ? "Edit Supplier" : "Tambah Supplier"}
        </DialogTitle>

        <Card className="border-0 shadow-none w-full">
          <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0 border-b">
            <div>
              <CardTitle className="text-lg font-bold">
                {initialData ? "Edit Supplier" : "Tambah Supplier"}
              </CardTitle>
              {initialData && (
                <p className="text-xs text-muted-foreground mt-1">
                  ID: {initialData.id}
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Supplier Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  Nama Supplier <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Masukkan nama supplier"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telepon</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="Masukkan nomor telepon"
                />
                {form.formState.errors.phone && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="Masukkan alamat email"
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  {...form.register("address")}
                  placeholder="Masukkan alamat lengkap"
                  rows={3}
                />
                {form.formState.errors.address && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.address.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Tambahkan deskripsi (opsional)"
                  rows={2}
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  {initialData ? "Update" : "Simpan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
