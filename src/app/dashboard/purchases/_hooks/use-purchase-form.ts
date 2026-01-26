"use client";

import { useFieldArray, useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertPurchaseSchema,
  insertPurchaseType,
} from "@/lib/validations/purchase";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export function usePurchaseForm({ onSuccess, createMutation }: any) {
  const { user } = useAuth();

  const form = useForm<insertPurchaseType>({
    resolver: zodResolver(insertPurchaseSchema) as any,
    defaultValues: {
      supplierId: undefined as any,
      userId: user?.id,
      items: [],
    },
  });

  // Keep userId updated when auth loads
  useEffect(() => {
    if (user?.id) {
      form.setValue("userId", user.id);
    }
  }, [user, form.setValue]);

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const addItem = (item: any) => {
    append(item);
  };

  // Calculate total amount
  const items = form.watch("items") || [];
  const totalAmount = items.reduce((acc, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;
    return acc + price * qty;
  }, 0);

  const onSubmit = async (data: insertPurchaseType) => {
    try {
      await createMutation.mutateAsync(data);
      form.reset();
      onSuccess?.();
    } catch (error) {
      // Error handling is usually done in the mutation onError or toast
      console.error(error);
    }
  };

  return {
    form,
    fields,
    append,
    remove,
    update,
    totalAmount,
    onSubmit: form.handleSubmit(onSubmit as any),
  };
}
