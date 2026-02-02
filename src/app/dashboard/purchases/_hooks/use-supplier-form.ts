/**
 * CUSTOM HOOK: useSupplierForm
 * Mengelola state dan logic untuk supplier form
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UseMutationResult } from "@tanstack/react-query";
import {
  supplierSchema,
  SupplierData as SupplierFormData
} from "@/lib/validations/supplier";
import { 
  SupplierFormProps, 
  SupplierResponse 
} from "../_types/supplier";
import { ApiResponse } from "@/services/productService";
import { toast } from "sonner";

// ============================================
// HOOK PROPS TYPE
// ============================================

interface UseSupplierFormProps {
  onSuccess?: () => void;
  createMutation: UseMutationResult<
    ApiResponse<SupplierResponse>,
    Error,
    SupplierFormData
  >;
  updateMutation?: UseMutationResult<
    ApiResponse<SupplierResponse>,
    Error,
    { id: number } & SupplierFormData
  >;
  initialData?: SupplierResponse | null;
}

// ============================================
// HOOK RETURN TYPE
// ============================================

interface UseSupplierFormReturn {
  form: ReturnType<typeof useForm<SupplierFormData>>;
  isSubmitting: boolean;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useSupplierForm({
  onSuccess,
  createMutation,
  updateMutation,
  initialData,
}: UseSupplierFormProps): UseSupplierFormReturn {
  const isEdit = !!initialData?.id;

  // Initialize form
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: initialData?.name || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      address: initialData?.address || "",
      description: initialData?.description || "",
    },
  });

  // Submit handler
  const handleSubmit = async (data: SupplierFormData) => {
    try {
      if (isEdit && initialData?.id) {
        if (!updateMutation) {
          throw new Error("Update mutation tidak tersedia");
        }
        await updateMutation.mutateAsync({
          id: initialData.id,
          ...data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }

      form.reset();
      onSuccess?.();
    } catch (error) {
      const errorMessage = 
        error instanceof Error 
          ? error.message 
          : "Gagal menyimpan data supplier";
      toast.error(errorMessage);
    }
  };

  const isSubmitting =
    createMutation.isPending || (updateMutation?.isPending ?? false);

  return {
    form,
    isSubmitting,
    onSubmit: form.handleSubmit(handleSubmit),
  };
}