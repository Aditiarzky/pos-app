import { useEffect, useMemo, useState } from "react";
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
import { useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useProduct } from "@/hooks/products/use-product";
import { BasicInfoTab } from "./tabs/basic-info-tab";
import { VariantsTab } from "./tabs/variants-tab";
import { BarcodesTab } from "./tabs/barcodes-tab";
import { ErrorIndicator } from "@/components/ui/error-indicator";
import { useAuth } from "@/hooks/use-auth";
import { CategoryType, UnitType } from "@/drizzle/type";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [minStockValue, setMinStockValue] = useState("");
  const [minStockUnitId, setMinStockUnitId] = useState<number | undefined>(
    undefined,
  );
  const [initialized, setInitialized] = useState(false);

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
  const categories = useMemo(
    () => categoriesResult?.data ?? [],
    [categoriesResult?.data],
  );
  const units = useMemo(() => unitsResult?.data ?? [], [unitsResult?.data]);

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
  const watchedVariants = useWatch({
    control: form.control,
    name: "variants",
  });
  const baseUnitId = useWatch({
    control: form.control,
    name: "baseUnitId",
  });
  const baseUnitName =
    units.find((unit) => unit.id === Number(baseUnitId))?.name ||
    "satuan dasar";

  const availableUnits = useMemo(() => {
    const rows = Array.isArray(watchedVariants) ? watchedVariants : [];
    const seen = new Set<number>();
    return rows
      .filter((v) => Number(v?.unitId) > 0 && Number(v?.conversionToBase) > 0)
      .map((v) => ({
        unitId: Number(v!.unitId),
        name:
          v?.name ||
          units.find((u) => u.id === Number(v?.unitId))?.name ||
          "Satuan",
        conversionToBase: Number(v!.conversionToBase),
      }))
      .filter((v) => {
        if (seen.has(v.unitId)) return false;
        seen.add(v.unitId);
        return true;
      });
  }, [watchedVariants, units]);

  const minStockInBase = useMemo(() => {
    const selected = availableUnits.find((u) => u.unitId === minStockUnitId);
    const value = Number(minStockValue);
    if (!selected || !Number.isFinite(value) || value <= 0) return 0;
    return value * selected.conversionToBase;
  }, [availableUnits, minStockUnitId, minStockValue]);

  const syncMinStock = (value: string, unitId: number | undefined) => {
    if (!value || !unitId) {
      form.setValue("minStock", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }
    const selected = availableUnits.find((u) => u.unitId === unitId);
    const numberValue = Number(value);
    if (!selected || !Number.isFinite(numberValue) || numberValue < 0) {
      form.setValue("minStock", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }
    form.setValue("minStock", String(numberValue * selected.conversionToBase), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  // Sync the form "minStock" value reactively if conversion factor changes
  useEffect(() => {
    if (minStockUnitId && minStockValue) {
      const selected = availableUnits.find((u) => u.unitId === minStockUnitId);
      if (selected) {
        const numberValue = Number(minStockValue);
        if (Number.isFinite(numberValue) && numberValue >= 0) {
          form.setValue(
            "minStock",
            String(numberValue * selected.conversionToBase),
            {
              shouldDirty: true,
              shouldValidate: true,
            },
          );
        }
      }
    }
  }, [availableUnits, minStockUnitId, minStockValue, form]);

  useEffect(() => {
    if (!open) return;
    if (!baseUnitId || availableUnits.length === 0) return;
    if (initialized) return;

    const savedMinStock = Number(
      productData?.data?.minStock ?? form.getValues("minStock") ?? 0,
    );
    const baseUnit = availableUnits.find(
      (u) => u.unitId === Number(baseUnitId),
    );

    if (baseUnit) {
      setMinStockUnitId(baseUnit.unitId);
      if (savedMinStock > 0) {
        setMinStockValue(String(savedMinStock));
      }
    } else if (availableUnits.length > 0) {
      const first = availableUnits[0];
      setMinStockUnitId(first.unitId);
      if (savedMinStock > 0) {
        setMinStockValue(
          String(Math.round(savedMinStock / first.conversionToBase)),
        );
      }
    }
    setInitialized(true);
  }, [open, baseUnitId, availableUnits, initialized, productData, form]);

  useEffect(() => {
    if (!open) return;
    if (!baseUnitId || availableUnits.length === 0 || minStockUnitId) return;
    const fallback =
      availableUnits.find((u) => u.unitId === Number(baseUnitId)) ||
      availableUnits[0];
    if (fallback) setMinStockUnitId(fallback.unitId);
  }, [open, baseUnitId, availableUnits, minStockUnitId]);

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
    setMinStockValue("");
    setMinStockUnitId(undefined);
    setInitialized(false);
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

            {activeTab === "variants" && (
              <div className="shrink-0 bg-background border-b p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    Stok Minimum
                  </Label>
                  <p className="text-[11px] text-muted-foreground leading-none">
                    Tentukan kapan sistem harus memperingatkan stok menipis.
                  </p>
                </div>

                {!baseUnitId ? (
                  <p className="text-xs text-muted-foreground italic">
                    Pilih satuan terkecil di tab Informasi.
                  </p>
                ) : availableUnits.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Belum ada satuan yang didefinisikan.
                  </p>
                ) : (
                  <div className="flex flex-col sm:items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="relative group">
                        <Input
                          type="number"
                          min={0}
                          className="w-24 h-9 pr-8"
                          value={minStockValue}
                          onChange={(e) => {
                            const next = e.target.value;
                            setMinStockValue(next);
                            syncMinStock(next, minStockUnitId);
                          }}
                          placeholder="0"
                        />
                      </div>
                      <Select
                        value={
                          minStockUnitId ? String(minStockUnitId) : undefined
                        }
                        onValueChange={(value) => {
                          const unitId = Number(value);
                          setMinStockUnitId(unitId);
                          syncMinStock(minStockValue, unitId);
                        }}
                      >
                        <SelectTrigger className="h-9 w-[130px] bg-muted/30">
                          <SelectValue placeholder="Satuan" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUnits.map((unit) => (
                            <SelectItem
                              key={unit.unitId}
                              value={String(unit.unitId)}
                            >
                              {unit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {minStockInBase > 0 &&
                      minStockUnitId &&
                      Number(minStockUnitId) !== Number(baseUnitId) && (
                        <p className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                          = {minStockInBase.toLocaleString("id-ID")}{" "}
                          {baseUnitName}
                        </p>
                      )}
                    {form.formState.errors.minStock && (
                      <p className="text-[11px] text-destructive font-medium">
                        {form.formState.errors.minStock.message as string}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

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

          <div className="flex shrink-0 justify-end gap-3 px-1 mt-auto pb-4">
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
