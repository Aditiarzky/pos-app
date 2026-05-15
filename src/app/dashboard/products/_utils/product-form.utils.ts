import { ProductResponse } from "@/services/productService";

export const defaultProductValues = {
  name: "",
  sku: "",
  categoryId: undefined,
  baseUnitId: undefined,
  minStock: "",
  variants: [],
  barcodes: [{ barcode: "" }],
};

export function mapProductToForm(product: ProductResponse) {
  const baseVariant = product.variants?.find(
    (variant) => variant.unitId === product.baseUnitId,
  );

  const nonBaseVariants =
    product.variants?.filter(
      (variant) => variant.unitId !== product.baseUnitId,
    ) ?? [];

  const mappedVariants = [
    {
      id: baseVariant?.id,
      name: baseVariant?.name || product.unit?.name || "",
      sku: baseVariant?.sku || "",
      unitId: product.baseUnitId,
      conversionToBase: "1",
      conversionValue: "1",
      referenceUnitId: product.baseUnitId,
      sellPrice: baseVariant?.sellPrice || "",
      isActive: !!baseVariant,
    },
    ...nonBaseVariants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      unitId: variant.unitId,
      conversionToBase: variant.conversionToBase,
      conversionValue: variant.conversionToBase,
      referenceUnitId: product.baseUnitId,
      sellPrice: variant.sellPrice,
      isActive: true,
    })),
  ];

  return {
    name: product.name,
    sku: product.sku,
    categoryId: product.categoryId ?? undefined,
    baseUnitId: product.baseUnitId,
    minStock: product.minStock ?? "",
    variants: mappedVariants,
    barcodes: product.barcodes?.length
      ? product.barcodes.map((b) => ({ barcode: b.barcode }))
      : defaultProductValues.barcodes,
    image: product.image,
  };
}
