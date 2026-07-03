import { useEffect, useMemo } from "react";
import { Info, Plus } from "lucide-react";
import { UnitType } from "@/drizzle/type";
import { InsertProductVariantInputType } from "@/lib/validations/product-variant";
import { Button } from "@/components/ui/button";
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

  const handleRemoveVariant = (index: number) => {
    removeVariant(index);
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

      if (index === 0) {
        if (currentUnitName && variant.name !== currentUnitName) {
          setValue(`variants.${index}.name`, currentUnitName, {
            shouldDirty: true,
            shouldValidate: false,
          });
        }
      } else {
        if (currentUnitName && !variant.name) {
          setValue(`variants.${index}.name`, currentUnitName, {
            shouldDirty: true,
            shouldValidate: false,
          });
        }
      }

      if (index === 0) return;

      // referenceUnitId now stores the variant array index.
      // E.g. if variant 2 references variant 1, referenceUnitId is 1.
      const isReferenceValid =
        variant.referenceUnitId !== undefined &&
        Number(variant.referenceUnitId) >= 0 &&
        Number(variant.referenceUnitId) < index;

      if (!isReferenceValid) {
        setValue(
          `variants.${index}.referenceUnitId`,
          0, // Default reference is always index 0 (base unit)
          {
            shouldDirty: true,
            shouldValidate: false,
          },
        );
      }

      const refIdx = isReferenceValid ? Number(variant.referenceUnitId) : 0;
      const referencedVariant = variants[refIdx];
      const referenceConversion = Number(
        referencedVariant?.conversionToBase || 1,
      );

      if (
        (!variant.conversionValue || Number(variant.conversionValue) <= 0) &&
        Number(variant.conversionToBase) > 0 &&
        refIdx === 0
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
      <div className="space-y-4">
        {!baseUnitId && (
          <div className="flex items-start gap-2 rounded-md border border-dashed border-border bg-muted/20 p-3">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Pilih dulu satuan terkecil di tab Informasi. Baris satuan dasar
              akan dibuat otomatis.
            </p>
          </div>
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
          className="w-full border-dashed text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Satuan Jual
        </Button>
      </div>
    </div>
  );
}
