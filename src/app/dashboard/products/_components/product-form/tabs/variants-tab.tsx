import { useEffect, useMemo } from "react";
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
  useWatch,
} from "react-hook-form";
import { ProductVariantInputType } from "@/lib/validations/product";
import { FormFieldErrors } from "../../../_hooks/use-product-form";

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
  isSystemAdmin = false,
}: {
  register: UseFormRegister<ProductFormValues>;
  errors: FormFieldErrors;
  units: UnitType[];
  setValue: UseFormSetValue<ProductFormValues>;
  watch: UseFormWatch<ProductFormValues>;
  variantFields: InsertProductVariantInputType[];
  appendVariant: (value: ProductVariantInputType) => void;
  removeVariant: (index: number) => void;
  control: Control<ProductFormValues>;
  averageCost: number;
  isSystemAdmin?: boolean;
}) {
  const confirm = useConfirm();
  type VariantFormState = {
    id?: number;
    name?: string;
    sku?: string;
    unitId?: number;
    conversionToBase?: string;
    sellPrice?: string;
    referenceUnitId?: number;
    conversionValue?: string;
    isActive?: boolean;
  };

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

  const baseUnitId = useWatch({ control, name: "baseUnitId" });
  const watchedVariants = useWatch({
    control,
    name: "variants",
  }) as VariantFormState[] | undefined;
  const variants = useMemo(() => watchedVariants ?? [], [watchedVariants]);
  const baseUnitName = useMemo(
    () =>
      units?.find((unit: UnitType) => unit.id === baseUnitId)?.name ||
      "Satuan Terkecil",
    [units, baseUnitId],
  );

  useEffect(() => {
    if (!baseUnitId) return;

    const baseUnit = units.find((unit) => unit.id === baseUnitId);
    const current = Array.isArray(variants) ? [...variants] : [];
    let next = [...current];

    const baseIndex = next.findIndex(
      (variant) => Number(variant?.unitId) === Number(baseUnitId),
    );

    if (baseIndex === -1) {
      next = [
        {
          name: baseUnit?.name || "",
          sku: "",
          unitId: baseUnitId,
          conversionToBase: "1",
          conversionValue: "1",
          referenceUnitId: baseUnitId,
          sellPrice: "",
          isActive: true,
        },
        ...next,
      ];
    } else if (baseIndex > 0) {
      const [baseVariant] = next.splice(baseIndex, 1);
      next = [baseVariant, ...next];
    }

    if (!next.length) return;

    const lockedBase = {
      ...next[0],
      unitId: baseUnitId,
      name: baseUnit?.name || next[0]?.name || "",
      conversionToBase: "1",
      conversionValue: "1",
      referenceUnitId: baseUnitId,
      isActive: next[0]?.isActive !== false,
    };
    next[0] = lockedBase;

    const serialize = (items: VariantFormState[]) =>
      JSON.stringify(
        items.map((variant) => ({
          id: variant.id,
          unitId: variant.unitId,
          name: variant.name,
          conversionToBase: variant.conversionToBase,
          conversionValue: variant.conversionValue,
          referenceUnitId: variant.referenceUnitId,
          sellPrice: variant.sellPrice,
          isActive: variant.isActive,
        })),
      );

    if (serialize(current) !== serialize(next)) {
      setValue("variants", next as never, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [baseUnitId, units, variants, setValue]);

  useEffect(() => {
    if (!baseUnitId || variants.length === 0) return;

    variants.forEach((variant, index) => {
      const currentUnitName = units.find(
        (unit) => unit.id === variant.unitId,
      )?.name;

      if (currentUnitName && variant.name !== currentUnitName) {
        setValue(`variants.${index}.name`, currentUnitName, {
          shouldDirty: true,
          shouldValidate: false,
        });
      }

      if (index === 0) return;

      const previousVariants = variants
        .slice(0, index)
        .filter((item) => Number(item.unitId) > 0);

      if (previousVariants.length === 0) return;

      const isReferenceValid = previousVariants.some(
        (item) => item.unitId === variant.referenceUnitId,
      );
      if (!isReferenceValid) {
        setValue(
          `variants.${index}.referenceUnitId`,
          previousVariants[previousVariants.length - 1]?.unitId,
          {
            shouldDirty: true,
            shouldValidate: false,
          },
        );
      }

      const referencedVariant = previousVariants.find(
        (item) =>
          item.unitId ===
          (isReferenceValid
            ? variant.referenceUnitId
            : previousVariants[previousVariants.length - 1]?.unitId),
      );
      const referenceConversion = Number(
        referencedVariant?.conversionToBase || 0,
      );

      if (
        (!variant.conversionValue || Number(variant.conversionValue) <= 0) &&
        Number(variant.conversionToBase) > 0 &&
        Number(variant.referenceUnitId) === Number(baseUnitId)
      ) {
        setValue(
          `variants.${index}.conversionValue`,
          variant.conversionToBase,
          {
            shouldDirty: true,
            shouldValidate: false,
          },
        );
      }

      const directConversion = Number(variant.conversionValue || 0);
      const convertedToBase =
        directConversion > 0 && referenceConversion > 0
          ? String(directConversion * referenceConversion)
          : "";

      if (variant.conversionToBase !== convertedToBase) {
        setValue(`variants.${index}.conversionToBase`, convertedToBase, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    });
  }, [baseUnitId, variants, units, setValue]);
  return (
    <div className="space-y-4">
      <TabsContent value="variants" className="mt-4 space-y-4">
        {!baseUnitId && (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            Pilih dulu satuan terkecil di tab Informasi. Baris satuan dasar akan
            dibuat otomatis.
          </p>
        )}

        {variantFields.map(
          (field: InsertProductVariantInputType, index: number) => (
            <VariantCard
              key={field.id}
              index={index}
              units={units}
              watch={watch}
              register={register}
              errors={errors}
              setValue={setValue}
              control={control}
              baseUnitName={baseUnitName}
              isBaseUnit={index === 0}
              handleRemoveVariant={handleRemoveVariant}
              variantFieldsLength={variantFields.length}
              averageCost={averageCost}
              isSystemAdmin={isSystemAdmin}
            />
          ),
        )}

        <Button
          type="button"
          variant="outline"
          disabled={!baseUnitId}
          onClick={() =>
            appendVariant({
              name: "",
              sku: "",
              unitId: NaN,
              conversionToBase: "",
              sellPrice: "",
            } as ProductVariantInputType)
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Satuan Jual
        </Button>
      </TabsContent>
    </div>
  );
}
