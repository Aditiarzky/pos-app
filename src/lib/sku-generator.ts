/**
 * Generate SKU bersih (Uppercase, Alphanumeric, Hyphen).
 */
const generateBaseSKU = (name: string, parentSKU?: string): string => {
  if (!name) return "";

  // 1. Trim & Hapus karakter spesial (kecuali huruf, angka, spasi)
  let cleanName = name.trim().replace(/[^a-zA-Z0-9\s]/g, "");

  // 2. Ubah spasi jadi strip, UPPERCASE
  let formattedSKU = cleanName.replace(/\s+/g, "-").toUpperCase();

  // 3. Ambil maksimal 3 kata agar tidak terlalu panjang
  const words = formattedSKU.split("-").filter((word) => word.length > 0);
  const shortSKU = words.slice(0, 3).join("-");

  // 4. Gabungkan dengan Parent SKU jika ada (untuk variant)
  return parentSKU ? `${parentSKU}-${shortSKU}` : shortSKU;
};

/**
 * Generate SKU Unik (Auto-increment jika duplikat).
 *
 * @param name - Nama produk/variant
 * @param parentSKU - SKU Produk Induk (hanya untuk variant)
 * @param existingSkus - Array semua SKU yang sudah ada di database
 * @returns String SKU yang unik
 */
export const generateUniqueSKU = (
  name: string,
  parentSKU: string | undefined = undefined,
  existingSkus: string[] = [],
): string => {
  // 1. Buat bentuk dasar SKU
  let baseSku = generateBaseSKU(name, parentSKU);

  // 2. Cek keberadaan
  if (!baseSku || !existingSkus.includes(baseSku)) {
    return baseSku;
  }

  // 3. Jika duplikat, tambahkan suffix angka (-2, -3, dst)
  let suffix = 1;
  let uniqueSku = baseSku;

  while (existingSkus.includes(uniqueSku)) {
    suffix++;
    uniqueSku = `${baseSku}-${suffix}`;
  }

  return uniqueSku;
};
