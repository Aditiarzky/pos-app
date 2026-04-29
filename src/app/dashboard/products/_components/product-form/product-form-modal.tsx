import { useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useProduct } from "@/hooks/products/use-product";
import { BasicInfoTab } from "./tabs/basic-info-tab";
import { VariantsTab } from "./tabs/variants-tab";
import { BarcodesTab } from "./tabs/barcodes-tab";
import { ErrorIndicator } from "@/components/ui/error-indicator";
import { useAuth } from "@/hooks/use-auth";
import { CategoryType, UnitType } from "@/drizzle/type";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ProductFormModal({
  open,
  onOpenChange,
  mode,
  productId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  productId?: number | null;
  allSku?: string[];
}) {
  const isEdit = mode === "edit" && !!productId;

  const [activeTab, setActiveTab] = useState("basic");

  const { roles } = useAuth();
  const isSystemAdmin = (roles as string[]).includes("admin sistem");

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
    productId: productId!,
    createMutation,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateMutation: updateMutation as any,
    onSuccess: () => handleClose(),
  });

  const { imagePreview, setImagePreview, uploading, inputRef, uploadImage } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useProductImage(uploadMutation, form.setValue as any, open, productData);

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
            toast.error("Periksa kembali data pada tab Satuan & Harga");
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

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    setActiveTab("basic");
    setImagePreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Produk" : "Tambah Produk Baru"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleFormSubmit}
          className="flex flex-1 min-h-0 flex-col gap-6 overflow-hidden"
        >
          {/* Controlled Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-1 min-h-0 flex-col overflow-hidden"
          >
            <TabsList className="grid w-full shrink-0 grid-cols-3 bg-background">
              <TabsTrigger
                type="button"
                value="basic"
                className="relative data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 data-[state=active]:shadow-none dark:data-[state=active]:border-transparent cursor-pointer"
              >
                Informasi
                <ErrorIndicator show={hasBasicError} />
              </TabsTrigger>

              <TabsTrigger
                type="button"
                value="variants"
                className="relative text-[clamp(0.75rem,2vw,0.85rem)] data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 data-[state=active]:shadow-none dark:data-[state=active]:border-transparent cursor-pointer"
              >
                Satuan & Harga
                <ErrorIndicator show={hasVariantError} />
              </TabsTrigger>

              <TabsTrigger
                type="button"
                value="barcodes"
                className="relative data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 data-[state=active]:shadow-none dark:data-[state=active]:border-transparent cursor-pointer"
              >
                Barcodes
                <ErrorIndicator show={hasBarcodeError} />
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-0 flex-1 min-h-0">
              <div className="pb-1 pr-2">
                <BasicInfoTab
                  {...form}
                  categories={categories as unknown as CategoryType[]}
                  units={units as unknown as UnitType[]}
                  imagePreview={imagePreview}
                  uploading={uploading}
                  inputRef={
                    inputRef as unknown as React.RefObject<HTMLInputElement>
                  }
                  uploadImage={uploadImage}
                  clearImage={() => {
                    setImagePreview(null);
                    form.setValue("image", undefined);
                  }}
                  errors={form.formState.errors}
                />

                <VariantsTab
                  {...form}
                  errors={form.formState.errors}
                  variantFields={variantFields}
                  appendVariant={appendVariant}
                  removeVariant={removeVariant}
                  averageCost={Number(productData?.data?.averageCost ?? 0)}
                  isSystemAdmin={isSystemAdmin}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  units={units as any}
                />

                <BarcodesTab
                  {...form}
                  barcodeFields={barcodeFields}
                  appendBarcode={appendBarcode}
                  removeBarcode={removeBarcode}
                  errors={form.formState.errors}
                />
              </div>
            </ScrollArea>
          </Tabs>

          <div className="flex shrink-0 justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
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
