/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useProduct } from "@/hooks/products/use-product";
import { BasicInfoTab } from "./tabs/basic-info-tab";
import { VariantsTab } from "./tabs/variants-tab";
import { BarcodesTab } from "./tabs/barcodes-tab";
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
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Save,
  PackageMinus,
  X,
  AlertCircle,
  Sparkles,
} from "lucide-react";

// ── Step definitions ────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Informasi" },
  { id: 2, label: "Satuan & Harga" },
  { id: 3, label: "Barcode" },
];

// Fields validated per step (for form.trigger)
const STEP_FIELDS: Record<number, string[]> = {
  1: ["name", "baseUnitId", "categoryId"],
  2: ["variants"],
  3: ["barcodes"],
};

// ── Component ────────────────────────────────────────────────────────────────

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

  const [currentStep, setCurrentStep] = useState(1);
  const [minStockValue, setMinStockValue] = useState("");
  const [minStockUnitId, setMinStockUnitId] = useState<number | undefined>(
    undefined,
  );
  const [initialized, setInitialized] = useState(false);
  const [showMinStock, setShowMinStock] = useState(false);
  // Menandai bahwa nilai stok minimum saat ini masih nilai default otomatis
  // (belum pernah disentuh user). Dipakai untuk menampilkan hint kecil di UI.
  const [isMinStockDefaulted, setIsMinStockDefaulted] = useState(true);

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

    updateMutation: updateMutation as any,
    onSuccess: () => handleClose(),
  });

  const watchedVariants = useWatch({ control: form.control, name: "variants" });
  const baseUnitId = useWatch({ control: form.control, name: "baseUnitId" });
  const baseUnitName =
    units.find((unit) => unit.id === Number(baseUnitId))?.name ??
    "satuan dasar";

  // ── availableUnits for min stock ──────────────────────────────────────────

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

  const availableUnitsRef = useRef(availableUnits);
  availableUnitsRef.current = availableUnits;

  const selectedUnit = useMemo(
    () => availableUnits.find((u) => u.idx === minStockUnitId),
    [availableUnits, minStockUnitId],
  );

  const minStockInBase = useMemo(() => {
    const value = Number(minStockValue);
    if (!selectedUnit || !Number.isFinite(value) || value <= 0) return 0;
    return value * selectedUnit.conversionToBase;
  }, [selectedUnit, minStockValue]);

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

  // Sync minStock on explicit user input
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

  }, [form, minStockUnitId, minStockValue]);

  // Restore saved minStock on open — atau, kalau belum ada nilai tersimpan
  // sama sekali, isi default otomatis: 1 dari satuan dengan konversi terbesar.
  useEffect(() => {
    if (!open || !baseUnitId || initialized) return;
    const units = availableUnitsRef.current;
    if (units.length === 0) return;

    const savedMinStock = Number(
      productData?.data?.minStock ?? form.getValues("minStock") ?? 0,
    );
    const largest = [...units].sort(
      (a, b) => b.conversionToBase - a.conversionToBase,
    )[0];

    if (savedMinStock > 0) {
      // Ada nilai tersimpan (edit produk existing) → ini data asli, bukan default.
      setIsMinStockDefaulted(false);
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
    } else {
      // Belum ada nilai sama sekali → default: 1 satuan dengan konversi terbesar.
      setMinStockUnitId(largest.idx);
      setMinStockValue("1");
      setIsMinStockDefaulted(true);
      form.setValue("minStock", String(largest.conversionToBase), {
        shouldDirty: false,
        shouldValidate: false,
      });
    }

    setInitialized(true);

  }, [open, baseUnitId, initialized, productData, form]);

  // Recover unit selection if it becomes stale
  useEffect(() => {
    if (!open || !baseUnitId) return;
    const units = availableUnitsRef.current;
    if (units.length === 0) return;
    if (
      minStockUnitId !== undefined &&
      units.some((u) => u.idx === minStockUnitId)
    )
      return;
    const largest = [...units].sort(
      (a, b) => b.conversionToBase - a.conversionToBase,
    )[0];
    setMinStockUnitId(largest.idx);

  }, [open, baseUnitId, minStockUnitId]);

  // ── Image ─────────────────────────────────────────────────────────────────

  const { imagePreview, setImagePreview, uploading, inputRef, uploadImage } =

    useProductImage(uploadMutation, form.setValue as any, open, productData);

  // ── Navigation ────────────────────────────────────────────────────────────

  const isLastStep = currentStep === STEPS.length;

  const goNext = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    const fields = STEP_FIELDS[currentStep] as any[];
    const valid = await form.trigger(fields);
    if (valid) setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  };

  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  // ── Error flags (for recovering step on submit error) ─────────────────────

  const hasBasicError =
    !!form.formState.errors.name ||
    !!form.formState.errors.baseUnitId ||
    !!form.formState.errors.categoryId;
  const hasVariantError = !!form.formState.errors.variants;
  const hasBarcodeError = !!form.formState.errors.barcodes;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit(
      (data) => submitHandler(data),
      () => {
        if (hasBasicError) {
          toast.error("Mohon isi minimal nama produk dan satuan");
          setCurrentStep(1);
        } else if (hasVariantError) {
          toast.error("Periksa kembali data Satuan & Harga");
          setCurrentStep(2);
        } else if (hasBarcodeError) {
          toast.error("Periksa kembali data Barcode");
          setCurrentStep(3);
        }
      },
    )();
  };

  // ── Close ─────────────────────────────────────────────────────────────────

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    setCurrentStep(1);
    setImagePreview(null);
    setMinStockValue("");
    setMinStockUnitId(undefined);
    setInitialized(false);
    setShowMinStock(false);
    setIsMinStockDefaulted(true);
  };

  const isPending =
    createMutation.isPending || updateMutation.isPending || uploading;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[92vh] max-h-[92vh] overflow-hidden flex flex-col p-0">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <DialogTitle className="text-lg">
            {isEdit ? "Edit Produk" : "Tambah Produk Baru"}
          </DialogTitle>

          {/* Step Indicator */}
          <div className="flex items-center mt-4">
            {STEPS.map((step, idx) => (
              <div
                key={step.id}
                className="flex items-center flex-1 last:flex-none"
              >
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all duration-200",
                      currentStep === step.id &&
                      "border-primary bg-primary/10 text-primary",
                      currentStep > step.id &&
                      "border-primary bg-primary text-primary-foreground",
                      currentStep < step.id &&
                      "border-muted-foreground/30 text-muted-foreground bg-background",
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] whitespace-nowrap transition-colors",
                      currentStep === step.id
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-3 mb-4 rounded-full transition-colors duration-300",
                      currentStep > step.id ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* ── Body (scrollable) ────────────────────────────────────────── */}
        <form
          onSubmit={handleFormSubmit}
          className="flex flex-1 min-h-0 flex-col overflow-hidden"
        >
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 py-5 space-y-0">
              {/* Step 1 — Informasi */}
              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                </div>
              )}

              {/* Step 2 — Satuan & Harga */}
              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 space-y-4">
                  <VariantsTab
                    {...form}
                    errors={form.formState.errors}
                    variantFields={variantFields}
                    appendVariant={appendVariant}
                    removeVariant={removeVariant}
                    averageCost={Number(productData?.data?.averageCost ?? 0)}
                    isSystemAdmin={isSystemAdmin}

                    units={units as any}
                  />

                  {/* Min Stock — hanya tampil kalau baseUnitId & variant sudah ada */}
                  {baseUnitId && availableUnits.length > 0 && (
                    <div className="border-t pt-4">
                      {!showMinStock ? (
                        <button
                          type="button"
                          onClick={() => setShowMinStock(true)}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline cursor-pointer"
                        >
                          + Atur stok minimum untuk peringatan notifikasi
                          (opsional{isMinStockDefaulted && selectedUnit
                            ? `, default 1 ${selectedUnit.name}`
                            : ""}
                          )
                        </button>
                      ) : (
                        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <PackageMinus className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
                                Stok Minimum
                              </span>
                              {isMinStockDefaulted && (
                                <span className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  Default
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowMinStock(false)}
                              className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <X className="h-3 w-3" />
                              Sembunyikan
                            </button>
                          </div>

                          {/* Input angka + satuan, digabung jadi satu kontrol */}
                          <div className="space-y-2">
                            <div className="flex items-stretch rounded-md border border-input bg-background overflow-hidden focus-within:ring-1 focus-within:ring-ring transition-shadow">
                              <Input
                                type="number"
                                min={0}
                                className="h-8 text-sm border-0 rounded-none shadow-none focus-visible:ring-0 flex-1 min-w-0"
                                value={minStockValue}
                                onChange={(e) => {
                                  const next = e.target.value;
                                  setMinStockValue(next);
                                  setIsMinStockDefaulted(false);
                                  syncMinStock(next, minStockUnitId);
                                }}
                                placeholder="0"
                              />
                              <div className="w-px bg-border" />
                              <Select
                                value={
                                  minStockUnitId !== undefined
                                    ? String(minStockUnitId)
                                    : undefined
                                }
                                onValueChange={(value) => {
                                  const idx = Number(value);
                                  setMinStockUnitId(idx);
                                  setIsMinStockDefaulted(false);
                                  syncMinStock(minStockValue, idx);
                                }}
                              >
                                <SelectTrigger className="h-8 w-28 text-sm border-0 rounded-none shadow-none bg-transparent focus:ring-0 shrink-0">
                                  <SelectValue placeholder="Satuan" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableUnits.map((unit) => (
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
                                <div className="flex items-center gap-1.5 pl-0.5 text-[10px] text-primary">
                                  <ArrowRight className="h-3 w-3 shrink-0" />
                                  <span className="font-medium">
                                    Setara{" "}
                                    {minStockInBase.toLocaleString("id-ID")}{" "}
                                    {baseUnitName}
                                  </span>
                                </div>
                              )}

                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              {isMinStockDefaulted
                                ? "Nilai ini terisi otomatis berdasarkan satuan kemasan terbesar. Ubah angka atau satuan di atas kalau perlu."
                                : "Sistem akan menandai produk sebagai stok menipis saat jumlahnya mencapai batas ini."}
                            </p>
                          </div>

                          {form.formState.errors.minStock && (
                            <div className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5">
                              <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                              <p className="text-[11px] text-destructive font-medium leading-snug">
                                {
                                  form.formState.errors.minStock
                                    .message as string
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3 — Barcode */}
              {currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <BarcodesTab
                    {...form}
                    barcodeFields={barcodeFields}
                    appendBarcode={appendBarcode}
                    removeBarcode={removeBarcode}
                    errors={form.formState.errors}
                  />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <div className="shrink-0 border-t px-6 py-4 flex items-center justify-between gap-3">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={isPending}
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Kembali
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground tabular-nums">
                {currentStep} / {STEPS.length}
              </span>

              {isLastStep ? (
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1.5" />
                  )}
                  {isEdit ? "Update Produk" : "Simpan Produk"}
                </Button>
              ) : (
                <Button type="button" onClick={goNext} disabled={isPending}>
                  Lanjut
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
