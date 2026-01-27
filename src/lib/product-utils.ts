export interface VariantMargin {
  hpp: number;
  margin: number;
  marginPercent: number;
  formattedHpp: string;
  isProfitable: boolean;
}

export function calculateVariantMargin(
  variant: {
    sellPrice: string | number;
    conversionToBase: string | number;
  },
  averageCost: string | number | null | undefined = 0,
): VariantMargin {
  const avgCostNum = Math.max(Number(averageCost) || 0, 0);
  const conversion = Math.max(Number(variant.conversionToBase) || 1, 1);
  const sellPriceNum = Math.max(Number(variant.sellPrice) || 0, 0);

  const hpp = avgCostNum * conversion;
  const margin = sellPriceNum - hpp;
  const marginPercent =
    sellPriceNum > 0 ? Math.round((margin / sellPriceNum) * 100) : 0;

  return {
    hpp,
    margin,
    marginPercent,
    formattedHpp: Math.round(hpp).toLocaleString("id-ID"),
    isProfitable: margin > 0,
  };
}
