import { useMemo, useState } from "react";
import { Circle } from "lucide-react";
import { toast } from "sonner";
import { useCategories } from "@/hooks/master/use-categories";
import { useUnits } from "@/hooks/master/use-units";
import { useCreateProduct } from "@/hooks/products/use-create-product";
import { useUpdateProduct } from "@/hooks/products/use-update-product";
import { useUploadImage } from "@/hooks/use-upload-image";
import { useProductForm } from "../../_hooks/use-product-form";
import { useProductImage } from "../../_hooks/use-product-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useProduct } from "@/hooks/products/use-product";
import { BasicInfoTab } from "./tabs/basic-info-tab";
import { VariantsTab } from "./tabs/variants-tab";
import { BarcodesTab } from "./tabs/barcodes-tab";

export function ProductFormModal({
  open,
  onOpenChange,
  mode,
  productId,
  allSku,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  productId?: number | null;
  allSku?: string[];
}) {
  const isEdit = mode === "edit" && !!productId;

  const [activeTab, setActiveTab] = useState("basic");

  const { data: productData } = useProduct(productId!, {
    enabled: isEdit && open,
  });

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const uploadMutation = useUploadImage();

  const { data: categoriesResult } = useCategories();
  const { data: unitsResult } = useUnits();
  const categories = categoriesResult?.data ?? [];
  const units = unitsResult?.data ?? [];

  const {
    variantFields,
    barcodeFields,
    submitHandler,
    appendVariant,
    appendBarcode,
    removeVariant,
    removeBarcode,
    form,
  } = useProductForm({
    isEdit,
    productData,
    productId,
    createMutation,
    updateMutation,
    onSuccess: () => onOpenChange(false),
  });

  const { imagePreview, setImagePreview, uploading, inputRef, uploadImage } =
    useProductImage(uploadMutation, form.setValue, open, productData);

  const hasBasicError =
    !!form.formState.errors.name ||
    !!form.formState.errors.baseUnitId ||
    !!form.formState.errors.categoryId;
  const hasVariantError = !!form.formState.errors.variants;
  const hasBarcodeError = !!form.formState.errors.barcodes;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    form.handleSubmit(
      (data) => {
        submitHandler(data);
      },
      () => {
        switch (true) {
          case hasBasicError:
            toast.error("Mohon isi minimal nama produk, SKU, dan satuan");
            setActiveTab("basic");
            break;
          case hasVariantError:
            toast.error("Mohon isi minimal satu data Variant");
            setActiveTab("variants");
            break;
          case hasBarcodeError:
            toast.error("Mohon isi minimal satu data Barcode");
            setActiveTab("barcodes");
            break;
          default:
            break;
        }
      },
    )();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Produk" : "Tambah Produk Baru"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Controlled Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger type="button" value="basic" className="relative">
                Informasi
                {hasBasicError && (
                  <Circle className="absolute top-2 right-2 h-2 w-2 fill-red-500 text-red-500 animate-pulse" />
                )}
              </TabsTrigger>

              <TabsTrigger type="button" value="variants" className="relative">
                Variants
                {/* Titik merah muncul otomatis jika ada error di formState */}
                {hasVariantError && (
                  <Circle className="absolute top-2 right-2 h-2 w-2 fill-red-500 text-red-500 animate-pulse" />
                )}
              </TabsTrigger>

              <TabsTrigger type="button" value="barcodes" className="relative">
                Barcodes
                {hasBarcodeError && (
                  <Circle className="absolute top-2 right-2 h-2 w-2 fill-red-500 text-red-500 animate-pulse" />
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <BasicInfoTab
                {...form}
                categories={categories}
                units={units}
                imagePreview={imagePreview}
                uploading={uploading}
                inputRef={inputRef}
                uploadImage={uploadImage}
                clearImage={() => {
                  setImagePreview(null);
                  form.setValue("image", undefined);
                }}
                errors={form.formState.errors}
              />
            </TabsContent>

            <TabsContent value="variants">
              <VariantsTab
                {...form}
                errors={form.formState.errors}
                units={units}
                variantFields={variantFields}
                appendVariant={appendVariant}
                removeVariant={removeVariant}
                isEditMode={isEdit}
              />
            </TabsContent>

            <TabsContent value="barcodes">
              <BarcodesTab
                {...form}
                barcodeFields={barcodeFields}
                appendBarcode={appendBarcode}
                removeBarcode={removeBarcode}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                uploading
              }
            >
              {isEdit ? "Update Produk" : "Simpan Produk"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
