import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { compressImage } from "@/components/compress-image";
import { ApiResponse, ProductResponse } from "@/services/productService";

export function useProductImage(
  uploadMutation: any,
  setValue: any,
  open: boolean,
  productData: ApiResponse<ProductResponse> | undefined,
) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const existingImage = productData?.data?.image || "";

  const uploadImage = async (file?: File) => {
    if (!file) return;

    const compressed = await compressImage(file);

    if (compressed.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadMutation.mutateAsync(compressed);
      setImagePreview(result.secureUrl);
      setValue("image", result.secureUrl);
      toast.success("Gambar berhasil diupload");
    } catch {
      toast.error("Gagal mengupload gambar");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    if (existingImage) {
      setImagePreview(existingImage);
      setValue("image", existingImage, { shouldDirty: false });
    }
  }, [open, existingImage, setValue]);

  useEffect(() => {
    if (!open) {
      setImagePreview(null);
      setValue("image", undefined);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }, [open, setValue]);
  useEffect(() => {
    if (!open) return;

    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          uploadImage(item.getAsFile() || undefined);
        }
      }
    };

    document.addEventListener("paste", handler);
    return () => document.removeEventListener("paste", handler);
  }, [open]);

  return {
    imagePreview,
    setImagePreview,
    uploading,
    inputRef,
    uploadImage,
  };
}
