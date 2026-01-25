import { Trash2, Plus, Upload, X, Loader2 } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Controller } from "react-hook-form";
import { UnitType } from "@/drizzle/type";
import { TabsContent } from "@/components/ui/tabs";
import { InsertProductVariantInputType } from "@/lib/validations/product-variant";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function VariantsTab({
  register,
  units,
  errors,
  setValue,
  watch,
  variantFields,
  appendVariant,
  removeVariant,
  control,
}: any) {
  const baseUnitId = watch("baseUnitId");
  const baseUnitName =
    units.find((u: UnitType) => u.id === baseUnitId)?.name || "Satuan Dasar";
  return (
    <div className="space-y-4">
      <TabsContent value="variants" className="mt-4 space-y-4">
        {variantFields.map(
          (field: InsertProductVariantInputType, index: number) => (
            <Card key={field.id} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Variant</Label>
                  <Input {...register(`variants.${index}.name` as const)} />
                  {errors.variants?.[index]?.name && (
                    <p className="text-sm text-destructive">
                      {errors.variants?.[index]?.name?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    SKU Variant{" "}
                    <p className="text-xs text-muted-foreground">
                      (auto-generated)
                    </p>
                  </Label>
                  <Input {...register(`variants.${index}.sku`)} disabled />
                  {errors.variants?.[index]?.sku && (
                    <p className="text-sm text-destructive">
                      {errors.variants?.[index]?.sku?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Satuan</Label>
                  <Select
                    onValueChange={(v) =>
                      setValue(`variants.${index}.unitId` as const, Number(v), {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    value={watch(`variants.${index}.unitId`)?.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih satuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit: UnitType) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.variants?.[index]?.unitId && (
                    <p className="text-sm text-destructive">
                      {errors.variants?.[index]?.unitId?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Harga Jual</Label>
                  <Controller
                    name={`variants.${index}.sellPrice`}
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput {...field} placeholder="0" />
                    )}
                  />
                  {errors.variants?.[index]?.sellPrice && (
                    <p className="text-sm text-destructive">
                      {errors.variants?.[index]?.sellPrice?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>
                    Konversi ke {baseUnitName}
                    <p className="text-xs text-muted-foreground">
                      (misal: 1{" "}
                      {units.find((u: UnitType) => u.id === field.unitId)
                        ?.name || "unit"}{" "}
                      = 40 {baseUnitName})
                    </p>
                  </Label>
                  <div className="flex items-center gap-2">
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
                  </div>
                  {errors.variants?.[index]?.conversionToBase && (
                    <p className="text-sm text-destructive">
                      {errors.variants?.[index]?.conversionToBase?.message}
                    </p>
                  )}
                </div>
              </div>

              {variantFields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-red-600"
                  onClick={() => removeVariant(index)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Variant
                </Button>
              )}
            </Card>
          ),
        )}

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            appendVariant({
              name: "",
              sku: "",
              unitId: NaN,
              conversionToBase: "",
              sellPrice: "",
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Variant
        </Button>
      </TabsContent>
    </div>
  );
}
