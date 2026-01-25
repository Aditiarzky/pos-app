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

import { stockAdjustmentSchema } from "@/lib/validations/stock-adjustment";

const stockAndMinStockSchema = stockAdjustmentSchema.extend({
  minStock: z.string().or(z.number()),
});

type StockAndMinStockInput = z.infer<typeof stockAndMinStockSchema>;

interface StockAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: number;
    name: string;
    stock: string | number;
    minStock: string | number;
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

  const [currentProduct, setCurrentProduct] = useState(product);

  const form = useForm<StockAndMinStockInput>({
    resolver: zodResolver(stockAndMinStockSchema),
    defaultValues: {
      actualStock: "",
      minStock: "",
      reason: "",
    },
  });

  useEffect(() => {
    if (product) {
      setCurrentProduct(product);
      form.reset({
        actualStock: String(product.stock),
        minStock: String(product.minStock || "0"),
        reason: "",
      });
    }
  }, [product, form]);

  const mutation = useMutation({
    mutationFn: async (values: StockAndMinStockInput) => {
      if (!product || !user) return;

      const response = await axiosInstance.post("/stock-adjustments", {
        productId: product.id,
        actualStock: values.actualStock,
        minStock: values.minStock,
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

  const onSubmit = (values: StockAndMinStockInput) => {
    mutation.mutate(values);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Penyesuaian Stok & Min. Stok</DialogTitle>
          <DialogDescription>
            Sesuaikan stok fisik dan stok minimum untuk produk{" "}
            <strong>{product.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                        {...field}
                        value={String(field.value ?? 0)}
                        onChange={(e) => field.onChange(e.target.value || "0")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Stok</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        value={String(field.value ?? 0)}
                        onChange={(e) => field.onChange(e.target.value || "0")}
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
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
