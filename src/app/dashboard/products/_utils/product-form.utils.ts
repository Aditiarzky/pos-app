import { ProductResponse } from "@/services/productService";

export const defaultProductValues = {
  name: "",
  sku: "",
  categoryId: undefined,
  baseUnitId: undefined,
  minStock: "0",
  variants: [],
  barcodes: [{ barcode: "" }],
};

export function mapProductToForm(product: ProductResponse) {
  const baseVariant = product.variants?.find(
    (variant) => variant.unitId === product.baseUnitId,
  );

  const nonBaseVariants = (
    product.variants?.filter(
      (variant) => variant.unitId !== product.baseUnitId,
    ) ?? []
  ).sort((a, b) => Number(a.conversionToBase) - Number(b.conversionToBase));

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
    ...nonBaseVariants.map((variant) => {
      const refVariant = variant.conversionReferenceVariantId
        ? product.variants?.find(
            (v) => v.id === variant.conversionReferenceVariantId,
          )
        : null;

      const refConversionToBase = refVariant
        ? Number(refVariant.conversionToBase)
        : 1;

      let refArrayIndex = 0;
      if (refVariant) {
        if (refVariant.unitId === product.baseUnitId) {
          refArrayIndex = 0;
        } else {
          const nonBaseIdx = nonBaseVariants.findIndex(
            (v) => v.id === refVariant.id,
          );
          refArrayIndex = nonBaseIdx !== -1 ? 1 + nonBaseIdx : 0;
        }
      }

      const reconstructedConversionValue =
        refConversionToBase > 0
          ? String(Number(variant.conversionToBase) / refConversionToBase)
          : variant.conversionToBase;

      return {
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        unitId: variant.unitId,
        conversionToBase: variant.conversionToBase,
        conversionValue: reconstructedConversionValue,
        referenceUnitId: refArrayIndex,
        sellPrice: variant.sellPrice,
        isActive: true,
      };
    }),
  ];

  return {
    name: product.name,
    sku: product.sku,
    categoryId: product.categoryId ?? undefined,
    baseUnitId: product.baseUnitId,
    minStock: product.minStock ?? "0",
    variants: mappedVariants,
    barcodes: product.barcodes?.length
      ? product.barcodes.map((b) => ({ barcode: b.barcode }))
      : defaultProductValues.barcodes,
    image: product.image,
  };
}
