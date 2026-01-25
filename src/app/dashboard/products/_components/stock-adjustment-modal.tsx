"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { axiosInstance } from "@/lib/axios";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import {
  stockAdjustmentSchema,
  StockAdjustmentInput,
} from "@/lib/validations/stock-adjustment";

interface StockAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: number;
    name: string;
    stock: string | number;
    unit?: { name: string };
  } | null;
}

export function StockAdjustmentModal({
  open,
  onOpenChange,
  product,
}: StockAdjustmentModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Use local state to force re-render or reset form when product changes
  const [currentProduct, setCurrentProduct] = useState(product);

  const form = useForm({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      actualStock: "",
      reason: "",
    },
  });

  useEffect(() => {
    if (product) {
      setCurrentProduct(product);
      form.reset({
        actualStock: String(product.stock),
        reason: "",
      });
    }
  }, [product, form]);

  const mutation = useMutation({
    mutationFn: async (values: StockAdjustmentInput) => {
      if (!product || !user) return;

      const response = await axiosInstance.post("/stock-adjustments", {
        productId: product.id,
        actualStock: values.actualStock,
        reason: values.reason,
        userId: user.id,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Stok berhasil disesuaikan");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Gagal menyesuaikan stok");
    },
  });

  const onSubmit = (values: StockAdjustmentInput) => {
    mutation.mutate(values);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Penyesuaian Stok</DialogTitle>
          <DialogDescription>
            Sesuaikan stok fisik untuk produk <strong>{product.name}</strong>.
            Perubahan akan tercatat di mutasi stok.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Stok Sistem</FormLabel>
                <div className="p-2 border rounded-md bg-muted text-muted-foreground">
                  {Number(product.stock)} {product.unit?.name}
                </div>
              </FormItem>

              <FormField
                control={form.control}
                name="actualStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stok Fisik (Actual)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        value={String(field.value ?? 0)}
                        onChange={(e) => field.onChange(e.target.value || "0")}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alasan Penyesuaian</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Stok opname bulanan, barang rusak, dll."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Simpan Penyesuaian
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
