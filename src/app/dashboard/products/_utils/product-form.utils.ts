import { ProductResponse } from "@/services/productService";

export const defaultProductValues = {
  name: "",
  sku: "",
  categoryId: undefined,
  baseUnitId: undefined,
  variants: [
    {
      name: "",
      sku: "",
      unitId: undefined,
      conversionToBase: "",
      sellPrice: "",
    },
  ],
  barcodes: [{ barcode: "" }],
};

export function mapProductToForm(product: ProductResponse) {
  return {
    name: product.name,
    sku: product.sku,
    categoryId: product.categoryId ?? undefined,
    baseUnitId: product.baseUnitId,
    variants: product.variants?.length
      ? product.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          unitId: v.unitId,
          conversionToBase: v.conversionToBase,
          sellPrice: v.sellPrice,
        }))
      : defaultProductValues.variants,
    barcodes: product.barcodes?.length
      ? product.barcodes.map((b) => ({ barcode: b.barcode }))
      : defaultProductValues.barcodes,
    image: product.image,
  };
}
