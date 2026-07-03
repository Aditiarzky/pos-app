import {
  AlertCircle,
  Check,
  Layers,
  Package,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { NumericInput } from "@/components/ui/numeric-input";
import { UnitSelect } from "@/components/ui/unit-select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UnitType } from "@/drizzle/type";
import {
  Control,
  Controller,
  UseFormSetValue,
  UseFormWatch,
  UseFormRegister,
} from "react-hook-form";

type ProductFormValues = {
  baseUnitId?: number;
  variants?: Array<{
    id?: number;
    name?: string;
    sku?: string;
    unitId?: number;
    conversionToBase?: string;
    sellPrice?: string;
    isActive?: boolean | null;
    referenceUnitId?: number;
    conversionValue?: string;
  }>;
  [key: string]: unknown;
};

type VariantCardProps = {
  index: number;
  units: UnitType[];
  watch: UseFormWatch<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any;
  setValue: UseFormSetValue<ProductFormValues>;
  control: Control<ProductFormValues>;
  baseUnitName: string;
  isBaseUnit: boolean;
  handleRemoveVariant: (index: number) => void;
  variantFieldsLength: number;
  averageCost?: number | null;
  isSystemAdmin?: boolean;
};

type VariantFormState = {
  name?: string;
  unitId?: number;
  conversionToBase?: string;
  conversionValue?: string;
  referenceUnitId?: number;
  sellPrice?: string;
  isActive?: boolean;
};

const PRESETS = [
  {
    label: "Kiloan (1 kg)",
    variantName: "Kiloan",
    targetUnit: "kg",
    getConversionValue: (base: string) =>
      ["g", "gram", "gr"].includes(base.toLowerCase()) ? 1000 : 1,
  },
  {
    label: "Setengah Kilo (500 g)",
    variantName: "Setengah Kilo",
    targetUnit: "kg",
    getConversionValue: (base: string) =>
      ["g", "gram", "gr"].includes(base.toLowerCase()) ? 500 : 0.5,
  },
  {
    label: "Seperempat Kilo (250 g)",
    variantName: "Seperempat Kilo",
    targetUnit: "kg",
    getConversionValue: (base: string) =>
      ["g", "gram", "gr"].includes(base.toLowerCase()) ? 250 : 0.25,
  },
  {
    label: "Satu Ons (100 g)",
    variantName: "Ons",
    targetUnit: "Ons",
    getConversionValue: (base: string) =>
      ["kg", "kilogram", "kilo"].includes(base.toLowerCase()) ? 0.1 : 100,
  },
  {
    label: "Satu Krat (10 kg)",
    variantName: "Krat",
    targetUnit: "krat",
    getConversionValue: (base: string) =>
      ["kg", "gram", "gr"].includes(base.toLowerCase()) ? 10000 : 10,
  },
];

const findUnitFlexibly = (units: UnitType[], targetName: string) => {
  const target = targetName.toLowerCase();
  if (target === "kg") {
    return units.find((u) => {
      const name = u.name.toLowerCase();
      return name === "kg" || name === "kilogram" || name === "kilo";
    });
  }
  if (target === "g") {
    return units.find((u) => {
      const name = u.name.toLowerCase();
      return name === "g" || name === "gram" || name === "gr";
    });
  }
  if (target === "krat") {
    return units.find((u) => {
      const name = u.name.toLowerCase();
      return name === "krat" || name === "box" || name === "kotak";
    });
  }
  return units.find((u) => u.name.toLowerCase() === target);
};

const isWeightUnit = (unitName: string) => {
  const name = unitName.toLowerCase();
  return ["g", "gram", "gr", "kg", "kilogram", "kilo", "ons", "oz"].includes(
    name,
  );
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

function MarginRow({
  marginAmount,
  marginPercent,
}: {
  marginAmount: number;
  marginPercent: number;
}) {
  const isPositive = marginAmount > 0;
  return (
    <div className="flex justify-between items-center px-2 py-1.5 text-xs rounded-md bg-muted/50">
      <span className="uppercase font-bold tracking-tighter text-muted-foreground">
        Estimasi Margin
      </span>
      <span
        className={`flex items-center gap-1 font-black ${
          isPositive ? "text-emerald-600" : "text-red-500"
        }`}
      >
        {isPositive ? (
          <TrendingUp className="h-3.5 w-3.5" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5" />
        )}
        Rp {marginAmount.toLocaleString("id-ID")} ({marginPercent}%)
      </span>
    </div>
  );
}

export function VariantCard({
  index,
  units,
  watch,
  register,
  errors,
  setValue,
  control,
  baseUnitName,
  isBaseUnit,
  handleRemoveVariant,
  variantFieldsLength,
  averageCost,
  isSystemAdmin = false,
}: VariantCardProps) {
  const variants = (watch("variants") as VariantFormState[]) ?? [];
  const variant = variants[index];
  const [conversionDraft, setConversionDraft] = useState(
    variant?.conversionValue ?? "",
  );

  useEffect(() => {
    setConversionDraft(variant?.conversionValue ?? "");
  }, [variant?.conversionValue, index]);

  const variantUnitId = Number(variant?.unitId);
  const variantUnitName =
    units.find((unit) => unit.id === variantUnitId)?.name || "Satuan";

  // Use variant *index* as the identifier so two variants sharing the same
  // unitId (e.g. "Setengah Kilo" and "Seperempat Kilo" both using kg) can be
  // told apart and both shown as reference options.
  const previousVariants = variants
    .slice(0, index)
    .map((item, i) => ({
      variantIndex: i,
      unitId: item.unitId,
      name:
        item.name || units.find((u) => u.id === item.unitId)?.name || "Satuan",
      conversionToBase: item.conversionToBase,
    }))
    .filter(
      (item) => Number(item.unitId) > 0 && Number(item.conversionToBase) > 0,
    );

  // Keep the legacy previousUnits (deduplicated) only for the side effect in
  // onValueChange that sets a default referenceUnitId.
  const previousUnits = variants
    .slice(0, index)
    .map((item) => units.find((unit) => unit.id === item.unitId))
    .filter((unit): unit is UnitType => !!unit)
    .filter(
      (unit, unitIndex, allUnits) =>
        allUnits.findIndex((item) => item.id === unit.id) === unitIndex,
    );

  const baseConversion = Number(
    watch(`variants.${index}.conversionToBase`) || 1,
  );
  const currentSellPrice = Number(watch(`variants.${index}.sellPrice`) || 0);
  const unitCost = Number(averageCost || 0) * baseConversion;
  const marginAmount = currentSellPrice - unitCost;
  const marginPercent =
    currentSellPrice > 0
      ? Math.round((marginAmount / currentSellPrice) * 100)
      : 0;
  const isSold = isBaseUnit
    ? watch(`variants.${index}.isActive`) !== false
    : true;

  const baseUnitId = watch("baseUnitId");
  const showPreset = !isBaseUnit && isWeightUnit(baseUnitName);

  // Nama satuan dari variant yang dijadikan acuan konversi
  const referenceVariantIndex =
    variant?.referenceUnitId !== undefined
      ? Number(variant.referenceUnitId)
      : 0;
  const referencedVariant = variants[referenceVariantIndex];
  const referenceUnitName =
    units.find((u) => u.id === referencedVariant?.unitId)?.name || baseUnitName;

  const handleSelectPreset = (presetLabel: string) => {
    const selectedPreset = PRESETS.find((p) => p.label === presetLabel);
    if (!selectedPreset) return;

    const matchedUnit = findUnitFlexibly(units, selectedPreset.targetUnit);

    setValue(`variants.${index}.name`, selectedPreset.variantName, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (matchedUnit) {
      setValue(`variants.${index}.unitId`, matchedUnit.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (baseUnitId) {
      setValue(`variants.${index}.referenceUnitId`, 0, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    const conversionVal = selectedPreset.getConversionValue(baseUnitName);
    setConversionDraft(String(conversionVal));

    setValue(`variants.${index}.conversionValue`, String(conversionVal), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  // ── Base Unit Card ──────────────────────────────────────────
  if (isBaseUnit) {
    return (
      <Card className="p-4 border-primary/20 gap-0 bg-primary/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs gap-1">
              <Package className="h-3 w-3" />
              Satuan Dasar
            </Badge>
            <span className="text-sm font-semibold">{variantUnitName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">
              Aktif Dijual
            </Label>
            <Switch
              checked={isSold}
              onCheckedChange={(checked) =>
                setValue(`variants.${index}.isActive`, checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hidden name field */}
          <Input {...register(`variants.${index}.name`)} className="hidden" />

          {/* Price */}
          <div className="space-y-1 md:col-span-2">
            <Label className="text-sm font-medium">
              Harga Jual{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (per {variantUnitName})
              </span>
            </Label>
            <Controller
              name={`variants.${index}.sellPrice`}
              control={control}
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <CurrencyInput
                  {...fieldProps}
                  placeholder="0"
                  value={Number(value) || 0}
                  onChange={onChange}
                  disabled={!isSold}
                />
              )}
            />
            {!isSold && (
              <p className="text-xs text-muted-foreground">
                Satuan ini tidak dijual satuan, tapi tetap digunakan untuk
                pencatatan stok.
              </p>
            )}
            <FieldError
              message={errors.variants?.[index]?.sellPrice?.message}
            />
          </div>

          {/* Margin info for admin */}
          {isSystemAdmin && Number(averageCost) > 0 && currentSellPrice > 0 && (
            <div className="md:col-span-2">
              <MarginRow
                marginAmount={marginAmount}
                marginPercent={marginPercent}
              />
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          Satuan dasar adalah satuan terkecil yang dipakai untuk menghitung
          stok. Konversi selalu = 1.
        </p>
      </Card>
    );
  }

  // ── Non-Base Unit Card ──────────────────────────────────────
  return (
    <Card className="p-4 gap-0">
      <div className="flex items-center justify-between mb-3">
        <Badge variant="secondary" className="text-xs gap-1">
          <Layers className="h-3 w-3" />
          Satuan Jual Tambahan
        </Badge>
        {variantFieldsLength > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 px-2"
            onClick={() => handleRemoveVariant(index)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Hapus
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* ── STEP 1: Preset (only for weight units) ── */}
        {showPreset && (
          <div className="rounded-md border border-dashed border-primary/30 bg-primary/5 p-3 space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Isi Otomatis - Pilih kemasan umum
            </p>
            <Select onValueChange={handleSelectPreset}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Pilih preset (opsional)..." />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map((preset) => (
                  <SelectItem key={preset.label} value={preset.label}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Memilih preset akan otomatis mengisi satuan, nama, dan isi
              konversi di bawah.
            </p>
          </div>
        )}

        {/* ── STEP 2: Unit + Name ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm font-medium">
              Satuan{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (mis. kg, krat, lusin)
              </span>
            </Label>
            <UnitSelect
              units={units}
              value={watch(`variants.${index}.unitId`)}
              disabled={false}
              onValueChange={(value) => {
                const selectedUnit = units.find((unit) => unit.id === value);
                setValue(`variants.${index}.unitId`, value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue(`variants.${index}.name`, selectedUnit?.name || "", {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                if (previousVariants.length > 0) {
                  setValue(
                    `variants.${index}.referenceUnitId`,
                    previousVariants[previousVariants.length - 1].variantIndex,
                    { shouldDirty: true, shouldValidate: true },
                  );
                }
              }}
              placeholder="Pilih satuan jual"
            />
            <FieldError message={errors.variants?.[index]?.unitId?.message} />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">
              Nama Label{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (tampil di kasir)
              </span>
            </Label>
            <Input
              {...register(`variants.${index}.name`)}
              placeholder="Mis: Satu Kilo, 1 Lusin..."
            />
            <FieldError message={errors.variants?.[index]?.name?.message} />
          </div>
        </div>

        {/* ── STEP 3: Conversion — ditampilkan sebagai satu kalimat formula ── */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Isinya berapa?</Label>
          <div className="rounded-md border border-border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                1 {variantUnitName}
              </span>
              <span className="text-sm text-muted-foreground">=</span>
              <div className="flex-1 min-w-[140px]">
                <Controller
                  name={`variants.${index}.conversionToBase`}
                  control={control}
                  render={() => (
                    <NumericInput
                      value={conversionDraft}
                      onChange={setConversionDraft}
                      onBlur={() =>
                        setValue(
                          `variants.${index}.conversionValue`,
                          conversionDraft,
                          { shouldDirty: true, shouldValidate: true },
                        )
                      }
                      placeholder="0"
                      suffix={referenceUnitName}
                    />
                  )}
                />
              </div>
            </div>

            {previousVariants.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">
                  Dihitung dari
                </span>
                <div className="flex-1 min-w-[140px]">
                  <Select
                    value={
                      variant?.referenceUnitId !== undefined
                        ? String(variant.referenceUnitId)
                        : undefined
                    }
                    onValueChange={(value) =>
                      setValue(
                        `variants.${index}.referenceUnitId`,
                        Number(value),
                        { shouldDirty: true, shouldValidate: true },
                      )
                    }
                  >
                    <SelectTrigger className="w-full h-8 text-sm bg-background">
                      <SelectValue placeholder="Acuan konversi" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Use variantIndex as key+value so variants sharing the
                          same unitId (e.g. 0.5 kg and 0.25 kg) both appear. */}
                      {previousVariants.map((v) => (
                        <SelectItem
                          key={v.variantIndex}
                          value={String(v.variantIndex)}
                        >
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <FieldError
            message={errors.variants?.[index]?.conversionToBase?.message}
          />
        </div>

        {/* ── STEP 4: Price ── */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">
            Harga Jual{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (per {variant.name})
            </span>
          </Label>
          <Controller
            name={`variants.${index}.sellPrice`}
            control={control}
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <CurrencyInput
                {...fieldProps}
                placeholder="0"
                value={Number(value) || 0}
                onChange={onChange}
              />
            )}
          />
          {isSystemAdmin && Number(averageCost) > 0 && currentSellPrice > 0 && (
            <div className="mt-1">
              <MarginRow
                marginAmount={marginAmount}
                marginPercent={marginPercent}
              />
            </div>
          )}
          <FieldError message={errors.variants?.[index]?.sellPrice?.message} />
        </div>
      </div>
    </Card>
  );
}
