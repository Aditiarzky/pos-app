import { useEffect } from "react";
import { FieldError, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  insertProductSchema,
  updateProductSchema,
  InsertProductInputType,
  UpdateProductInputType,
} from "@/lib/validations/product";

import {
  defaultProductValues,
  mapProductToForm,
} from "../_utils/product-form.utils";
import { ApiResponse, ProductResponse } from "@/services/productService";
import { UseMutationResult } from "@tanstack/react-query";
import { InsertProductVariantInputType } from "@/lib/validations/product-variant";
import { InsertProductBarcodeType } from "@/drizzle/type";

interface BaseError {
  message?: string;
}

export interface FormFieldErrors {
  [key: string]: BaseError | FieldError | undefined;
}

export function useProductForm({
  isEdit,
  productData,
  onSuccess,
  createMutation,
  updateMutation,
  productId,
}: {
  isEdit: boolean;
  productData?: ApiResponse<ProductResponse>;
  onSuccess: () => void;
  createMutation: UseMutationResult<
    ApiResponse<ProductResponse>,
    Error,
    InsertProductInputType
  >;
  updateMutation: UseMutationResult<
    ApiResponse<ProductResponse>,
    Error,
    InsertProductInputType & { id: number }
  >;
  productId?: number;
}) {
  const form = useForm<InsertProductInputType | UpdateProductInputType>({
    resolver: zodResolver(isEdit ? updateProductSchema : insertProductSchema),
    defaultValues: defaultProductValues,
  });

  const { reset } = form;

  // Load edit data
  useEffect(() => {
    if (isEdit && productData?.data) {
      reset(mapProductToForm(productData.data));
    } else if (!isEdit) {
      reset(defaultProductValues);
    }
  }, [isEdit, productData, reset]);

  const submitHandler = async (
    data: InsertProductInputType | UpdateProductInputType,
  ) => {
    const cleanedData = {
      ...data,
      barcodes: (data.barcodes ?? []).filter((b) => !!b.barcode),
    };

    const onSuccessToast = (response: ApiResponse<unknown>) => {
      const successMessage =
        response.message ||
        (isEdit ? "Produk berhasil diperbarui" : "Produk berhasil ditambahkan");
      toast.success(successMessage);
      onSuccess();
    };

    const onErrorToast = (error: ApiResponse<unknown>) => {
      const errorMessage =
        error.message || error.error || "Terjadi kesalahan pada server";

      toast.error(errorMessage);

      if (error.details) {
        console.error("Validation Details:", error.details);
      }
    };

    if (isEdit && productId) {
      updateMutation.mutate(
        { ...cleanedData, id: productId } as InsertProductInputType & {
          id: number;
        },
        {
          onSuccess: onSuccessToast,
          onError: onErrorToast as unknown as (error: Error) => void,
        },
      );
    } else {
      createMutation.mutate(cleanedData as InsertProductInputType, {
        onSuccess: onSuccessToast,
        onError: onErrorToast as unknown as (error: Error) => void,
      });
    }
  };

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const {
    fields: barcodeFields,
    append: appendBarcode,
    remove: removeBarcode,
  } = useFieldArray({
    control: form.control,
    name: "barcodes",
  });

  return {
    form,
    submitHandler,
    variantFields: variantFields as InsertProductVariantInputType[],
    barcodeFields: barcodeFields as unknown as InsertProductBarcodeType[],
    appendVariant,
    appendBarcode,
    removeVariant,
    removeBarcode,
  };
}
