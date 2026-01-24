import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Upload, X, Loader2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryType, UnitType } from "@/drizzle/type";
import { InsertProductVariantInputType } from "@/lib/validations/product-variant";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function VariantsTab({
  register,
  units,
  product,
  errors,
  setValue,
  variantFields,
  appendVariant,
  removeVariant,
}: any) {
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
                  <Label>SKU Variant</Label>
                  <Input {...register(`variants.${index}.sku` as const)} />
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
                    defaultValue={field.unitId?.toString()}
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
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`variants.${index}.sellPrice` as const)}
                  />
                  {errors.variants?.[index]?.sellPrice && (
                    <p className="text-sm text-destructive">
                      {errors.variants?.[index]?.sellPrice?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>
                    Konversi ke Satuan Dasar
                    <p className="text-xs text-muted-foreground">
                      (misal: 1 dus = 40 pcs)
                    </p>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.0001"
                      {...register(
                        `variants.${index}.conversionToBase` as const,
                      )}
                    />
                    <p className="text-sm">
                      {
                        units.find((unit: UnitType) => unit.id === field.unitId)
                          ?.name
                      }
                    </p>
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
