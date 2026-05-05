import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { NumericInput } from "@/components/ui/numeric-input";
import { UnitSelect } from "@/components/ui/unit-select";
import { Switch } from "@/components/ui/switch";
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
  unitId?: number;
  conversionToBase?: string;
  conversionValue?: string;
  referenceUnitId?: number;
  sellPrice?: string;
  isActive?: boolean;
};

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

  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Gunakan Satuan Ini</Label>
          <UnitSelect
            units={units}
            value={watch(`variants.${index}.unitId`)}
            disabled={isBaseUnit}
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
              if (!isBaseUnit && previousUnits.length > 0) {
                setValue(
                  `variants.${index}.referenceUnitId`,
                  previousUnits[previousUnits.length - 1].id,
                  {
                    shouldDirty: true,
                    shouldValidate: true,
                  },
                );
              }
            }}
            placeholder="Pilih satuan"
          />
          <Input {...register(`variants.${index}.name`)} className="hidden" />
          {errors.variants?.[index]?.unitId && (
            <p className="text-sm text-destructive">
              {errors.variants[index].unitId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            SKU Satuan{" "}
            <span className="text-xs text-muted-foreground">
              (auto-generated)
            </span>
          </Label>
          <Input {...register(`variants.${index}.sku`)} disabled />
          {errors.variants?.[index]?.sku && (
            <p className="text-sm text-destructive">
              {errors.variants[index].sku.message}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Berapa Isinya?</Label>
          {isBaseUnit ? (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p>
                1 {variantUnitName} = 1 {baseUnitName}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Satuan dasar stok produk, nilai ini selalu terkunci.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      )
                    }
                    placeholder={`1 ${variantUnitName} berisi...`}
                    suffix={baseUnitName}
                  />
                )}
              />
              <Select
                value={
                  variant?.referenceUnitId
                    ? String(variant.referenceUnitId)
                    : undefined
                }
                onValueChange={(value) =>
                  setValue(`variants.${index}.referenceUnitId`, Number(value), {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih satuan acuan" />
                </SelectTrigger>
                <SelectContent>
                  {previousUnits.map((unit) => (
                    <SelectItem key={unit.id} value={String(unit.id)}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!isBaseUnit && (
            <p className="text-xs text-muted-foreground">
              Setara {watch(`variants.${index}.conversionToBase`) || 0}{" "}
              {baseUnitName}
            </p>
          )}
          {errors.variants?.[index]?.conversionToBase && (
            <p className="text-sm text-destructive">
              {errors.variants[index].conversionToBase.message}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label>Berapa Harganya?</Label>
            {isBaseUnit && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Dijual</Label>
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
            )}
          </div>
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
              Satuan dasar tetap dipakai untuk stok, tapi tidak dimasukkan
              sebagai satuan jual.
            </p>
          )}
          {isSystemAdmin && Number(averageCost) > 0 && currentSellPrice > 0 && (
            <div className="flex justify-between items-center px-1 text-xs">
              <span className="uppercase font-bold tracking-tighter text-muted-foreground">
                Estimasi Margin
              </span>
              <span
                className={`font-black ${marginAmount > 0 ? "text-emerald-600" : "text-red-500"}`}
              >
                Rp {marginAmount.toLocaleString("id-ID")} ({marginPercent}%)
              </span>
            </div>
          )}
          {errors.variants?.[index]?.sellPrice && (
            <p className="text-sm text-destructive">
              {errors.variants[index].sellPrice.message}
            </p>
          )}
        </div>
      </div>

      {!isBaseUnit && variantFieldsLength > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3 text-red-600"
          onClick={() => handleRemoveVariant(index)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Hapus Satuan Jual
        </Button>
      )}
    </Card>
  );
}
