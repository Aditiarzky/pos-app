/**
 * CUSTOM HOOK: usePurchaseForm
 * Mengelola state dan logic untuk purchase form
 */

"use client";

import { useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { UseMutationResult } from "@tanstack/react-query";
import {
  insertPurchaseSchema,
  insertPurchaseType,
} from "@/lib/validations/purchase";
import {
  PurchaseFormData,
  PurchaseFormItem,
  PurchaseResponse,
} from "../_types/purchase-type";
import { ApiResponse } from "@/services/productService";
import { toast } from "sonner";

// ============================================
// HOOK PROPS TYPE
// ============================================

interface UsePurchaseFormProps {
  onSuccess?: () => void;
  createMutation: UseMutationResult<
    ApiResponse<PurchaseResponse>,
    Error,
    insertPurchaseType
  >;
  updateMutation?: UseMutationResult<
    ApiResponse<PurchaseResponse>,
    Error,
    { id: number } & insertPurchaseType
  >;
  initialData?: PurchaseResponse | null;
}

// ============================================
// HOOK RETURN TYPE
// ============================================

interface UsePurchaseFormReturn {
  form: ReturnType<typeof useForm<PurchaseFormData>>;
  fields: PurchaseFormItem[];
  append: (item: PurchaseFormItem) => void;
  remove: (index: number) => void;
  update: (index: number, item: PurchaseFormItem) => void;
  total: number;
  isEdit: boolean;
  isSubmitting: boolean;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function usePurchaseForm({
  onSuccess,
  createMutation,
  updateMutation,
  initialData,
}: UsePurchaseFormProps): UsePurchaseFormReturn {
  const { user } = useAuth();
  const isEdit = !!initialData?.id;
  const isEditInitialized = useRef(false);

  // Initialize form
  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(insertPurchaseSchema),
    defaultValues: {
      supplierId: initialData?.supplierId || undefined,
      userId: user?.id,
      items:
        initialData?.items?.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          qty: Number(item.qty) || 0,
          price: Number(item.price) || 0,
          productName: item.product?.name ?? null,
          variantName: item.productVariant?.name ?? null,
        })) || [],
    },
  });

  // Field array untuk manage items
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Reset form ketika initialData berubah (edit mode)
  useEffect(() => {
    // Hanya reset jika benar-benar ada perubahan pada initialData
    if (initialData && !isEditInitialized.current) {
      form.reset({
        supplierId: initialData.supplierId,
        userId: user?.id,
        items:
          initialData.items?.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            qty: Number(item.qty),
            price: Number(item.price),
            productName: item.product?.name ?? null,
            variantName: item.productVariant?.name ?? null,
          })) || [],
      });

      isEditInitialized.current = true;
    }

    // Reset flag ketika tidak dalam mode edit
    if (!initialData) {
      isEditInitialized.current = false;
    }
  }, [initialData, user?.id, form]);

  // Calculate total
  const items = form.watch("items") || [];
  const total = items.reduce((acc, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;
    return acc + price * qty;
  }, 0);

  // Submit handler
  const handleSubmit = async (data: PurchaseFormData) => {
    try {
      const cleanedItems = data.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        qty: item.qty,
        price: item.price,
      }));

      const payload = {
        supplierId: data.supplierId,
        userId: data.userId,
        items: cleanedItems,
      };

      if (isEdit && initialData?.id) {
        if (!updateMutation) {
          throw new Error("Update mutation tidak tersedia");
        }

        const updatePayload = {
          id: initialData.id,
          ...payload,
        };

        await updateMutation.mutateAsync(updatePayload);
      } else {
        await createMutation.mutateAsync(payload);
      }

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("❌ Submit error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null && "error" in error
            ? isEdit
              ? "Gagal memperbarui data pembelian"
              : "Gagal menambahkan data pembelian"
            : "Gagal menambahkan data pembelian";
      toast.error(errorMessage);
    }
  };

  const isSubmitting =
    createMutation.isPending || (updateMutation?.isPending ?? false);

  return {
    form,
    fields: fields as PurchaseFormItem[],
    append,
    remove,
    update,
    total,
    isEdit,
    isSubmitting,
    onSubmit: form.handleSubmit(handleSubmit),
  };
}
