type MinStockVariantLike = {
  conversionToBase?: string | number | null;
};

export function resolveProductMinStock(
  minStock: string | number | null | undefined,
  variants: MinStockVariantLike[] = [],
) {
  const numericMinStock = Number(minStock ?? 0);
  if (Number.isFinite(numericMinStock) && numericMinStock > 0) {
    return String(numericMinStock);
  }

  const largestConversion = variants.reduce((largest, variant) => {
    const conversion = Number(variant?.conversionToBase ?? 0);
    return conversion > largest ? conversion : largest;
  }, 0);

  return String(Math.max(1, largestConversion));
}
