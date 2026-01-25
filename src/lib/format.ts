export const formatCurrency = (value: string | number) => {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numericValue)) return "";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue);
};

export const parseCurrency = (value: string) => {
  return value.replace(/[^\d]/g, "");
};

export const formatNumber = (value: string | number) => {
  if (value === "" || value === undefined || value === null) return "";
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numericValue)) return "";
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 4,
  }).format(numericValue);
};

export const formatCompactNumber = (number: number | string) => {
  const value = typeof number === "string" ? parseFloat(number) : number;

  if (isNaN(value)) return "0";

  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
};

export const parseNumber = (value: string) => {
  // Replace comma with dot for parsing
  return value.replace(/\./g, "").replace(/,/g, ".");
};
