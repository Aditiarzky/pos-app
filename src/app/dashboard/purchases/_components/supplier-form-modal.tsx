import { useEffect } from "react";
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
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<SupplierData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      description: "",
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
          email: supplier.email || "",
          description: supplier.description || "",
        });
      }
    } else if (!open) {
      reset({ name: "", address: "", phone: "", email: "", description: "" });
    }
  }, [isEdit, supplierId, suppliersResult, open, reset]);

  const onSubmit = async (data: SupplierData) => {
    try {
      if (isEdit && supplierId) {
        await updateMutation.mutateAsync({ id: supplierId, ...data });
        toast.success("Supplier berhasil diperbarui");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Supplier berhasil ditambahkan");
      }
      onOpenChange(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else if (
        typeof error === "object" &&
        error !== null &&
        "error" in error
      ) {
        toast.error((error as { error: string }).error);
      } else {
        toast.error("Terjadi kesalahan");
      }
    }
  };

  const isPending =
    createMutation.isPending || updateMutation.isPending || isFormSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">
            {isEdit ? "Edit Supplier" : "Tambah Supplier Baru"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          {/* Name Field */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-semibold">
              Nama Supplier <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Contoh: PT. Sumber Bakti"
              className="h-11 focus-visible:ring-primary/20"
            />
            {errors.name && (
              <p className="text-xs font-medium text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone Field */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-semibold">
                Nomor Telepon
              </Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="08123456789"
                className="h-11 focus-visible:ring-primary/20"
              />
              {errors.phone && (
                <p className="text-xs font-medium text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="supplier@email.com"
                className="h-11 focus-visible:ring-primary/20"
              />
              {errors.email && (
                <p className="text-xs font-medium text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {/* Address Field */}
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-sm font-semibold">
              Alamat
            </Label>
            <Textarea
              id="address"
              {...register("address")}
              placeholder="Alamat lengkap supplier..."
              className="resize-none min-h-[80px] focus-visible:ring-primary/20"
            />
            {errors.address && (
              <p className="text-xs font-medium text-destructive">
                {errors.address.message}
              </p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-semibold">
              Deskripsi
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Tambahkan catatan singkat (opsional)..."
              className="resize-none min-h-[80px] focus-visible:ring-primary/20"
            />
            {errors.description && (
              <p className="text-xs font-medium text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 border-t mt-4 sm:space-x-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-11 px-6 rounded-lg font-semibold"
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 px-8 rounded-lg font-semibold"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Perbarui Data" : "Simpan Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
