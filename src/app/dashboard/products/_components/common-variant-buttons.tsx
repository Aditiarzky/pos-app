import { Button } from "@/components/ui/button"; // menggunakan <button> biasa agar ringan
import {
  InsertProductInputType,
  UpdateProductInputType,
} from "@/lib/validations/product";
import { UseFormSetValue } from "react-hook-form";

const COMMON_VARIANT_NAMES = [
  "Dus",
  "Rentengan",
  "Pack",
  "Lusin",
  "Krat",
  "Karton",
  "Ikat",
  "Pcs",
  "Bungkus",
  "Karung",
];

type CommonVariantButtonsProps = {
  index: number;
  setValue: UseFormSetValue<InsertProductInputType | UpdateProductInputType>;
};

export function CommonVariantButtons({
  index,
  setValue,
}: CommonVariantButtonsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COMMON_VARIANT_NAMES.map((name) => (
        <Button
          key={name}
          type="button"
          size="sm"
          className="text-xs font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors border border-transparent"
          onClick={() =>
            setValue(`variants.${index}.name`, name, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        >
          {name}
        </Button>
      ))}
    </div>
  );
}
