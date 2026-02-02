import { Plus } from "lucide-react";
import { UnitType } from "@/drizzle/type";
import { TabsContent } from "@/components/ui/tabs";
import { InsertProductVariantInputType } from "@/lib/validations/product-variant";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/contexts/ConfirmDialog";
import { VariantCard } from "../../variant-card";
import {
  Control,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import {
  InsertProductInputType,
  ProductVariantInputType,
  UpdateProductInputType,
} from "@/lib/validations/product";
import { FormFieldErrors } from "../../../_hooks/use-product-form";

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
}: {
  register: UseFormRegister<InsertProductInputType | UpdateProductInputType>;
  errors: FormFieldErrors;
  units: UnitType[];
  setValue: UseFormSetValue<InsertProductInputType | UpdateProductInputType>;
  watch: UseFormWatch<InsertProductInputType | UpdateProductInputType>;
  variantFields: InsertProductVariantInputType[];
  appendVariant: (value: ProductVariantInputType) => void;
  removeVariant: (index: number) => void;
  control: Control<InsertProductInputType | UpdateProductInputType>;
  averageCost: number;
}) {
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
          Tambah Jenis Variant
        </Button>
      </TabsContent>
    </div>
  );
}
