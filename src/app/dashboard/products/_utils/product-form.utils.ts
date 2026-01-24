import {
  InsertProductInputType,
  UpdateProductInputType,
} from "@/lib/validations/product";

export const defaultProductValues = {
  name: "",
  sku: "",
  categoryId: undefined,
  baseUnitId: undefined,
  minStock: "0",
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

export function mapProductToForm(
  product: any,
): InsertProductInputType | UpdateProductInputType {
  return {
    name: product.name,
    sku: product.sku,
    categoryId: product.categoryId ?? undefined,
    baseUnitId: product.baseUnitId,
    minStock: product.minStock,
    variants: product.variants?.length
      ? product.variants.map((v: any) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          unitId: v.unitId,
          conversionToBase: v.conversionToBase,
          sellPrice: v.sellPrice,
        }))
      : defaultProductValues.variants,
    barcodes: product.barcodes?.length
      ? product.barcodes.map((b: any) => ({ barcode: b.barcode }))
      : defaultProductValues.barcodes,
    image: product.image,
  };
}
