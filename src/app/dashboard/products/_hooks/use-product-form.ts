import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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

export function useProductForm({
  isEdit,
  productData,
  onSuccess,
  createMutation,
  updateMutation,
  productId,
}: any) {
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

    const onSuccessToast = () => {
      toast.success(
        isEdit ? "Produk berhasil diperbarui" : "Produk berhasil ditambahkan",
      );
      onSuccess();
    };

    const onErrorToast = () => {
      toast.error(
        isEdit ? "Gagal memperbarui produk" : "Gagal menambahkan produk",
      );
    };

    if (isEdit && productId) {
      updateMutation.mutate(
        { id: productId, ...cleanedData },
        { onSuccess: onSuccessToast, onError: onErrorToast },
      );
    } else {
      createMutation.mutate(cleanedData, {
        onSuccess: onSuccessToast,
        onError: onErrorToast,
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
    variantFields,
    barcodeFields,
    appendVariant,
    appendBarcode,
    removeVariant,
    removeBarcode,
  };
}
