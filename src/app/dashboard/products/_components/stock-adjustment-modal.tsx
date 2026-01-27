"use client";

import { useEffect, useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Info } from "lucide-react";
import {
  variantAdjustmentSchema,
  VariantAdjustmentInput,
} from "@/lib/validations/stock-adjustment";
import { useConfirm } from "@/contexts/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAdjustStock } from "@/hooks/products/use-adjust-stock";
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

interface StockAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: number;
    name: string;
    stock: string | number;
    unit?: { name: string };
    variants: Array<{
      id: number;
      name: string;
      conversionToBase: string | number;
      unit?: { name: string };
    }>;
  } | null;
}

export function StockAdjustmentModal({
  open,
  onOpenChange,
  product,
}: StockAdjustmentModalProps) {
  const { user } = useAuth();
  const confirm = useConfirm();
  const adjustMutation = useAdjustStock();

  const form = useForm<VariantAdjustmentInput>({
    resolver: zodResolver(variantAdjustmentSchema) as any,
    defaultValues: {
      variants: [],
      userId: user?.id || 0,
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  useEffect(() => {
    if (product && open) {
      form.reset({
        variants: product.variants.map((v) => ({
          variantId: v.id,
          qty: 0,
        })),
        userId: user?.id || 0,
      });
    }
  }, [product, open, user, form]);

  const watchedVariants = useWatch({
    control: form.control,
    name: "variants",
  });

  const results = useMemo(() => {
    if (!product || !watchedVariants) return { newTotal: 0, deficit: 0 };

    let newTotal = 0;
    watchedVariants.forEach((adj: any) => {
      const variant = product.variants.find((v) => v.id === adj?.variantId);
      if (variant) {
        const inputQty = Number(adj?.qty) || 0;
        newTotal += inputQty * Number(variant.conversionToBase);
      }
    });

    const oldTotal = Number(product.stock);
    return {
      newTotal,
      deficit: newTotal - oldTotal,
    };
  }, [product, watchedVariants]);

  const onSubmit = async (values: VariantAdjustmentInput) => {
    if (!product) return;

    const ok = await confirm({
      title: "Konfirmasi Penyesuaian Stok",
      description: (
        <div className="space-y-3">
          <p>
            Apakah Anda yakin data stok yang dimasukkan sudah benar?{" "}
            <strong>
              Stok lama akan dihapus dan diganti dengan total input baru.
            </strong>
          </p>
          <div className="bg-muted p-3 rounded-md text-sm space-y-1">
            <div className="flex justify-between">
              <span>Stok Saat Ini:</span>
              <span className="font-bold">
                {Number(product?.stock).toFixed(2)} {product?.unit?.name}
              </span>
            </div>
            <div className="flex justify-between text-primary">
              <span>Stok Baru (Hasil Konversi):</span>
              <span className="font-bold">
                {results.newTotal.toFixed(2)} {product?.unit?.name}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Selisih (Defisit/Surplus):</span>
              <span
                className={
                  results.deficit >= 0 ? "text-emerald-600" : "text-destructive"
                }
              >
                {results.deficit >= 0 ? "+" : ""}
                {results.deficit.toFixed(2)} {product?.unit?.name}
              </span>
            </div>
          </div>
        </div>
      ),
      confirmText: "Ya, Sesuaikan Stok",
      cancelText: "Periksa Kembali",
    });

    if (ok) {
      adjustMutation.mutate(
        { id: product.id, ...values },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Stock Opname: {product.name}</DialogTitle>
          <DialogDescription>
            Masukkan jumlah stok fisik untuk setiap variant. Sistem akan
            menghitung total stok dalam satuan dasar.
          </DialogDescription>
        </DialogHeader>

        <Form {...(form as any)}>
          <form
            onSubmit={form.handleSubmit(onSubmit as any)}
            className="space-y-6"
          >
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 text-primary">
              {fields.map((field, index) => {
                const variant = product.variants.find(
                  (v) => v.id === field.variantId,
                );
                return (
                  <div
                    key={field.id}
                    className="flex items-end gap-4 p-3 bg-muted/30 rounded-lg border"
                  >
                    <div className="flex-1 space-y-1">
                      <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                        {variant?.name}
                      </FormLabel>
                      <div className="text-[10px] text-muted-foreground pb-1">
                        Konversi: 1 {variant?.unit?.name} ={" "}
                        {variant?.conversionToBase} {product.unit?.name}
                      </div>
                      <FormField
                        control={form.control}
                        name={`variants.${index}.qty`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                autoFocus={index === 0}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Info className="h-4 w-4" />
                Ringkasan Penyesuaian
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-primary">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                    Total Stok Baru
                  </p>
                  <p className="text-xl font-bold font-mono">
                    {results.newTotal.toFixed(2)}
                    <span className="text-xs ml-1 text-muted-foreground">
                      {product.unit?.name}
                    </span>
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                    Selisih
                  </p>
                  <Badge
                    variant={results.deficit >= 0 ? "outline" : "destructive"}
                    className="font-mono"
                  >
                    {results.deficit >= 0 ? "+" : ""}
                    {results.deficit.toFixed(2)} {product.unit?.name}
                  </Badge>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={adjustMutation.isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={
                  adjustMutation.isPending || watchedVariants.length === 0
                }
              >
                {adjustMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Konfirmasi & Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
