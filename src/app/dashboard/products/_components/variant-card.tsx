import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Controller } from "react-hook-form";
import { CurrencyInput } from "@/components/ui/currency-input";
import { NumericInput } from "@/components/ui/numeric-input";
import { UnitSelect } from "@/components/ui/unit-select";
import { CommonVariantButtons } from "./common-variant-buttons";
import { InsertProductVariantInputType } from "@/lib/validations/product-variant";
import { UnitType } from "@/drizzle/type";

type VariantCardProps = {
  field: InsertProductVariantInputType;
  index: number;
  units: UnitType[];
  watch: any;
  register: any;
  errors: any;
  setValue: any;
  control: any;
  baseUnitName: string;
  handleRemoveVariant: (index: number) => void;
  variantFieldsLength: number;
  averageCost?: number | null;
};

export function VariantCard({
  field,
  index,
  units,
  watch,
  register,
  errors,
  setValue,
  control,
  baseUnitName,
  handleRemoveVariant,
  variantFieldsLength,
  averageCost,
}: VariantCardProps) {
  const variantUnitName =
    units.find((u) => u.id === field.unitId)?.name || "unit";

  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nama Variant */}
        <div className="space-y-2">
          <Label>Nama Variant</Label>
          <div className="space-y-2">
            <Input {...register(`variants.${index}.name` as const)} />
            <CommonVariantButtons index={index} setValue={setValue} />
          </div>
          {errors.variants?.[index]?.name && (
            <p className="text-sm text-destructive">
              {errors.variants[index].name.message}
            </p>
          )}
        </div>

        {/* SKU */}
        <div className="space-y-2">
          <Label>
            SKU Variant{" "}
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

        {/* Satuan */}
        <div className="space-y-2">
          <Label>Satuan</Label>
          <UnitSelect
            units={units}
            value={watch(`variants.${index}.unitId`)}
            onValueChange={(v) =>
              setValue(`variants.${index}.unitId`, v, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            placeholder="Pilih satuan"
          />
          {errors.variants?.[index]?.unitId && (
            <p className="text-sm text-destructive">
              {errors.variants[index].unitId.message}
            </p>
          )}
        </div>

        {/* Harga Jual + Estimasi Margin */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Harga Jual</Label>
            {averageCost && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                Modal: Rp{" "}
                {Math.round(
                  Number(averageCost) *
                    Number(watch(`variants.${index}.conversionToBase`) || 1),
                ).toLocaleString("id-ID")}
              </span>
            )}
          </div>
          <Controller
            name={`variants.${index}.sellPrice`}
            control={control}
            render={({ field }) => (
              <div className="space-y-1.5">
                <CurrencyInput {...field} placeholder="0" />
                {averageCost && Number(field.value) > 0 && (
                  <div className="flex justify-between items-center px-1 text-xs">
                    <span className="uppercase font-bold tracking-tighter text-muted-foreground">
                      Estimasi Margin
                    </span>
                    <span
                      className={`font-black ${Number(field.value) - Number(averageCost) * Number(watch(`variants.${index}.conversionToBase`)) > 0 ? "text-emerald-600" : "text-red-500"}`}
                    >
                      Rp{" "}
                      {(
                        Number(field.value) -
                        Number(averageCost) *
                          Number(watch(`variants.${index}.conversionToBase`))
                      ).toLocaleString("id-ID")}{" "}
                      (
                      {Math.round(
                        ((Number(field.value) -
                          Number(averageCost) *
                            Number(
                              watch(`variants.${index}.conversionToBase`),
                            )) /
                          Number(field.value)) *
                          100,
                      )}
                      %)
                    </span>
                  </div>
                )}
              </div>
            )}
          />
          {errors.variants?.[index]?.sellPrice && (
            <p className="text-sm text-destructive">
              {errors.variants[index].sellPrice.message}
            </p>
          )}
        </div>

        {/* Konversi ke Base Unit */}
        <div className="space-y-2 md:col-span-2">
          <Label>
            Konversi ke {baseUnitName}
            <p className="text-xs text-muted-foreground">
              (misal: 1 {variantUnitName} = 40 {baseUnitName})
            </p>
          </Label>
          <Controller
            name={`variants.${index}.conversionToBase`}
            control={control}
            render={({ field }) => (
              <NumericInput
                {...field}
                className="flex-1"
                suffix={baseUnitName}
                placeholder="Jumlah unit"
              />
            )}
          />
          {errors.variants?.[index]?.conversionToBase && (
            <p className="text-sm text-destructive">
              {errors.variants[index].conversionToBase.message}
            </p>
          )}
        </div>
      </div>

      {variantFieldsLength > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3 text-red-600"
          onClick={() => handleRemoveVariant(index)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Hapus Variant
        </Button>
      )}
    </Card>
  );
}
