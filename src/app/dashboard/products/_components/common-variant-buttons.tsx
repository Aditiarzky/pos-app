import { Button } from "@/components/ui/button"; // menggunakan <button> biasa agar ringan

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

type CommonVariantButtonsProps = {
  index: number;
  setValue: any;
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
