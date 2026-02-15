"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { UseMutationResult } from "@tanstack/react-query";
import { insertSaleSchema, insertSaleType } from "@/lib/validations/sale";
import { SaleFormData, SaleFormItem, SaleResponse } from "../_types/sale-type";
import { ApiResponse } from "@/services/productService";
import { toast } from "sonner";

interface UseSaleFormProps {
  onSuccess?: () => void;
  createMutation: UseMutationResult<
    ApiResponse<SaleResponse>,
    Error,
    insertSaleType
  >;
  initialData?: SaleResponse | null; // For future edit support
  isOpen?: boolean;
}

interface UseSaleFormReturn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  fields: SaleFormItem[];
  append: (item: SaleFormItem) => void;
  remove: (index: number) => void;
  update: (index: number, item: SaleFormItem) => void;
  total: number;
  subtotal: number;
  grandTotal: number;
  change: number; // Kembalian
  isSubmitting: boolean;
  onSubmit: (data: SaleFormData) => Promise<void>;
}

export function useSaleForm({
  onSuccess,
  createMutation,
  isOpen,
}: UseSaleFormProps): UseSaleFormReturn {
  const { user } = useAuth();

  // Initialize form
  const form = useForm<SaleFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(insertSaleSchema as any),
    defaultValues: {
      customerId: undefined,
      userId: user?.id,
      items: [],
      totalPaid: 0,
      totalBalanceUsed: 0,
    },
  });

  // Field array
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Calculations
  const items = form.watch("items") || [];
  const subtotal = items.reduce((acc, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;
    return acc + price * qty;
  }, 0);

  const totalBalanceUsed = Number(form.watch("totalBalanceUsed")) || 0;
  const grandTotal = Math.max(0, subtotal - totalBalanceUsed);
  const totalPaid = Number(form.watch("totalPaid")) || 0;

  const change = totalPaid - grandTotal;

  // Reset logic
  // ... (Simplification: just reset on open/close if needed, or rely on manual reset)

  const handleSubmit = async (data: SaleFormData) => {
    try {
      const cleanedItems = data.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        unitFactorAtSale: "1", // Placeholder, will be handled by server or should be passed from variant
        qty: item.qty,
      }));

      const payload = {
        customerId: data.customerId,
        userId: user?.id || 0, // Fallback need to be handled validation schema
        items: cleanedItems,
        totalPaid: data.totalPaid,
        totalBalanceUsed: data.totalBalanceUsed,
      };

      await createMutation.mutateAsync(payload);

      form.reset({
        customerId: undefined,
        userId: user?.id,
        items: [],
        totalPaid: 0,
        totalBalanceUsed: 0,
      });
      onSuccess?.();
    } catch (error) {
      console.error("❌ Submit error:", error);
      toast.error("Gagal memproses transaksi");
    }
  };

  return {
    form,
    fields: fields as SaleFormItem[],
    append,
    remove,
    update,
    total: subtotal, // Mapping to total (subtotal of items)
    subtotal,
    grandTotal,
    change,
    isSubmitting: createMutation.isPending,
    onSubmit: handleSubmit,
  };
}
