import { useEffect, useMemo, useRef, useState } from "react";
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
  const [showMinStock, setShowMinStock] = useState(false);

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

  // Keep ALL variants (even if they share the same unitId) so variants like
  // "Setengah Kilo" (0.5 kg) and "Seperempat Kilo" (0.25 kg) both appear.
  // We identify each entry by its array index, not by unitId.
  const availableUnits = useMemo(() => {
    const rows = Array.isArray(watchedVariants) ? watchedVariants : [];
    return rows
      .map((v, idx) => ({
        idx,
        unitId: Number(v?.unitId),
        name:
          v?.name ||
          units.find((u) => u.id === Number(v?.unitId))?.name ||
          "Satuan",
        conversionToBase: Number(v?.conversionToBase ?? 0),
      }))
      .filter((v) => v.unitId > 0 && v.conversionToBase > 0);
  }, [watchedVariants, units]);

  // Keep a ref so effects can always read the latest availableUnits without
  // listing it as a dependency (which would cause infinite loops when
  // VariantsTab's own effects mutate variants).
  const availableUnitsRef = useRef(availableUnits);
  availableUnitsRef.current = availableUnits;

  // Now minStockUnitId tracks the variant *index* so identical-unitId variants
  // can be told apart. We find by idx.
  const selectedUnit = useMemo(
    () => availableUnits.find((u) => u.idx === minStockUnitId),
    [availableUnits, minStockUnitId],
  );

  const minStockInBase = useMemo(() => {
    const value = Number(minStockValue);
    if (!selectedUnit || !Number.isFinite(value) || value <= 0) return 0;
    return value * selectedUnit.conversionToBase;
  }, [selectedUnit, minStockValue]);

  // syncMinStock now takes the variant idx (not unitId) to identify the unit.
  const syncMinStock = (value: string, idx: number | undefined) => {
    const unit = availableUnits.find((u) => u.idx === idx);
    const numberValue = Number(value);
    if (!unit || !value || !Number.isFinite(numberValue) || numberValue < 0) {
      form.setValue("minStock", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }
    form.setValue("minStock", String(numberValue * unit.conversionToBase), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  // Sync minStock when the user changes minStockValue or minStockUnitId.
  // availableUnits is read via ref so this effect never fires due to variant
  // mutations — only fires on explicit user input (avoiding infinite loops).
  useEffect(() => {
    if (minStockUnitId === undefined || !minStockValue) return;
    const unit = availableUnitsRef.current.find(
      (u) => u.idx === minStockUnitId,
    );
    if (!unit) return;
    const numberValue = Number(minStockValue);
    if (!Number.isFinite(numberValue) || numberValue < 0) return;
    const computed = String(numberValue * unit.conversionToBase);
    if (computed !== form.getValues("minStock")) {
      form.setValue("minStock", computed, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minStockUnitId, minStockValue]); // availableUnits read via ref; form methods are stable

  // On open: restore saved minStock or default to 1 × largest unit.
  // availableUnits is read from the ref so this effect doesn't re-fire every
  // time VariantsTab's own effects mutate the variants array.
  useEffect(() => {
    if (!open) return;
    if (!baseUnitId) return;
    if (initialized) return;

    const units = availableUnitsRef.current;
    if (units.length === 0) return;

    const savedMinStock = Number(
      productData?.data?.minStock ?? form.getValues("minStock") ?? 0,
    );

    // Largest unit = highest conversionToBase value.
    const largest = [...units].sort(
      (a, b) => b.conversionToBase - a.conversionToBase,
    )[0];

    if (savedMinStock > 0) {
      const remainder = savedMinStock % largest.conversionToBase;
      if (remainder === 0) {
        setMinStockUnitId(largest.idx);
        setMinStockValue(String(savedMinStock / largest.conversionToBase));
      } else {
        const baseUnit = units.find((u) => u.unitId === Number(baseUnitId));
        const fallback = baseUnit ?? largest;
        setMinStockUnitId(fallback.idx);
        setMinStockValue(
          String(
            Math.round((savedMinStock / fallback.conversionToBase) * 100) / 100,
          ),
        );
      }
      setShowMinStock(true);
    } else {
      // No saved value: default silently to 1 × largest unit.
      setMinStockUnitId(largest.idx);
      setMinStockValue("1");
      form.setValue("minStock", String(largest.conversionToBase), {
        shouldDirty: false,
        shouldValidate: false,
      });
    }

    setInitialized(true);
    // availableUnitsRef is a ref (stable), so not listed as dep.
    // form.setValue / form.getValues are stable per react-hook-form docs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, baseUnitId, initialized, productData]);

  // Ensure a unit is always selected when the form first becomes ready.
  // Uses ref to avoid firing every time variants mutate.
  useEffect(() => {
    if (!open || !baseUnitId) return;
    if (minStockUnitId !== undefined) return;
    const units = availableUnitsRef.current;
    if (units.length === 0) return;
    const largest = [...units].sort(
      (a, b) => b.conversionToBase - a.conversionToBase,
    )[0];
    setMinStockUnitId(largest.idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, baseUnitId, minStockUnitId]);

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
    setShowMinStock(false);
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

            {activeTab === "variants" &&
              baseUnitId &&
              availableUnits.length > 0 && (
                <div className="shrink-0 border-b px-4 py-2 z-10">
                  {!showMinStock ? (
                    // Collapsed: soft trigger text
                    <button
                      type="button"
                      onClick={() => setShowMinStock(true)}
                      className="text-[11px] text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline cursor-pointer"
                    >
                      + Atur stok minimum untuk peringatan notifikasi (opsional)
                    </button>
                  ) : (
                    // Expanded: compact inline form
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-foreground">
                          Stok Minimum
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowMinStock(false)}
                          className="text-[10px] text-muted-foreground hover:text-destructive transition-colors ml-1"
                        >
                          sembunyikan
                        </button>
                      </div>

                      <div className="flex flex-col sm:items-end gap-1">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            className="w-20 h-8 text-sm"
                            value={minStockValue}
                            onChange={(e) => {
                              const next = e.target.value;
                              setMinStockValue(next);
                              syncMinStock(next, minStockUnitId);
                            }}
                            placeholder="0"
                          />
                          <Select
                            value={
                              minStockUnitId !== undefined
                                ? String(minStockUnitId)
                                : undefined
                            }
                            onValueChange={(value) => {
                              const idx = Number(value);
                              setMinStockUnitId(idx);
                              syncMinStock(minStockValue, idx);
                            }}
                          >
                            <SelectTrigger className="h-8 w-[120px] text-sm bg-muted/30">
                              <SelectValue placeholder="Satuan" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableUnits.map((unit) => (
                                // Use idx as key + value so identical-unitId variants
                                // (e.g. two "kg" variants) both appear.
                                <SelectItem
                                  key={unit.idx}
                                  value={String(unit.idx)}
                                >
                                  {unit.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {minStockInBase > 0 &&
                          selectedUnit &&
                          selectedUnit.conversionToBase !== 1 && (
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
