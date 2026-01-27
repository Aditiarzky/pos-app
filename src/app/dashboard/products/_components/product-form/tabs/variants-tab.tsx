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
import { UnitSelect } from "@/components/ui/unit-select";
import { useConfirm } from "@/contexts/ConfirmDialog";
import { VariantCard } from "../../variant-card";

const COMMON_VARIANT_NAMES = [
  "Dus",
  "Rentengan",
  "Pack",
  "Lusin",
  "Box",
  "Karton",
  "Ikat",
  "Pcs",
  "Bungkus",
  "Karung",
];

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
  averageCost,
}: any) {
  const confirm = useConfirm();

  const handleRemoveVariant = async (index: number) => {
    const variantId = watch(`variants.${index}.id`);
    const variantName = watch(`variants.${index}.name`);

    if (variantId) {
      const ok = await confirm({
        title: "Hapus Variant",
        description: `Apakah Anda yakin ingin menghapus variant "${variantName || "tanpa nama"}"? Data ini tidak akan benar-benar dihapus, hanya dinonaktifkan.`,
        confirmText: "Ya, Hapus",
        cancelText: "Batal",
      });
      if (ok) removeVariant(index);
    } else {
      removeVariant(index);
    }
  };

  const baseUnitId = watch("baseUnitId");
  const baseUnitName =
    units.find((u: UnitType) => u.id === baseUnitId)?.name || "Satuan Dasar";
  return (
    <div className="space-y-4">
      <TabsContent value="variants" className="mt-4 space-y-4">
        {variantFields.map(
          (field: InsertProductVariantInputType, index: number) => (
            <VariantCard
              key={field.id}
              field={field}
              index={index}
              units={units}
              watch={watch}
              register={register}
              errors={errors}
              setValue={setValue}
              control={control}
              baseUnitName={baseUnitName}
              handleRemoveVariant={handleRemoveVariant}
              variantFieldsLength={variantFields.length}
              averageCost={averageCost}
            />
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
