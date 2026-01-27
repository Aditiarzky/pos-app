"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertPurchaseSchema,
  insertPurchaseType,
} from "@/lib/validations/purchase";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

interface usePurchaseFormProps {
  onSuccess?: () => void;
  createMutation?: any;
  updateMutation?: any;
  initialData?: any;
}

export function usePurchaseForm({
  onSuccess,
  createMutation,
  updateMutation,
  initialData,
}: usePurchaseFormProps) {
  const { user } = useAuth();
  const isEdit = !!initialData?.id;

  const form = useForm<insertPurchaseType>({
    resolver: zodResolver(insertPurchaseSchema) as any,
    defaultValues: {
      supplierId: initialData?.supplierId || (undefined as any),
      userId: user?.id,
      items:
        initialData?.items?.map((item: any) => ({
          productId: item.productId,
          variantId: item.variantId,
          qty: Number(item.qty),
          price: Number(item.price),
          productName: item.product?.name,
          variantName: item.productVariant?.name,
        })) || [],
    },
  });

  // Reset form when initialData changes (for Edit mode)
  useEffect(() => {
    if (initialData) {
      form.reset({
        supplierId: initialData.supplierId,
        userId: user?.id,
        items:
          initialData.items?.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            qty: Number(item.qty),
            price: Number(item.price),
            productName: item.product?.name,
            variantName: item.productVariant?.name,
          })) || [],
      });
    } else {
      form.reset({
        supplierId: undefined as any,
        userId: user?.id,
        items: [],
      });
    }
  }, [initialData, user?.id, form]);

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Calculate total amount
  const items = form.watch("items") || [];
  const total = items.reduce((acc, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;
    return acc + price * qty;
  }, 0);

  const onSubmit = async (data: insertPurchaseType) => {
    try {
      if (isEdit) {
        if (!updateMutation) {
          throw new Error("Update mutation is not provided");
        }
        await updateMutation.mutateAsync({ id: initialData.id, ...data });
      } else {
        if (!createMutation) {
          throw new Error("Create mutation is not provided");
        }
        await createMutation.mutateAsync(data);
      }
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error(error);
    }
  };

  return {
    form,
    fields,
    append,
    remove,
    update,
    total,
    isEdit,
    onSubmit: form.handleSubmit(onSubmit as any),
  };
}
