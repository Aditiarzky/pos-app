import { OperationalCost, TaxConfig } from "@/services/costService";

export type { OperationalCost, TaxConfig };

export const CATEGORY_LABELS: Record<string, string> = {
  utilities: "Utilitas",
  salary: "Gaji",
  rent: "Sewa",
  logistics: "Logistik",
  marketing: "Pemasaran",
  maintenance: "Perawatan",
  other: "Lainnya",
};

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  utilities: "Listrik, air, internet, telepon",
  salary: "Gaji karyawan, tunjangan",
  rent: "Sewa tempat usaha, gudang",
  logistics: "Ongkos kirim, bensin, transportasi",
  marketing: "Iklan, promosi, spanduk",
  maintenance: "Servis peralatan, perbaikan",
  other: "Biaya lain-lain",
};

export const PERIOD_LABELS: Record<string, string> = {
  daily: "Per Hari",
  weekly: "Per Minggu",
  monthly: "Per Bulan",
  yearly: "Per Tahun",
  one_time: "Sekali Bayar",
};

export const PERIOD_DESCRIPTIONS: Record<string, string> = {
  daily: "Biaya yang terjadi setiap hari",
  weekly: "Biaya yang terjadi setiap minggu",
  monthly: "Biaya yang terjadi setiap bulan",
  yearly: "Biaya yang terjadi setiap tahun",
  one_time: "Biaya yang hanya terjadi sekali",
};

export const TAX_TYPE_LABELS: Record<string, string> = {
  percentage: "Persentase (%)",
  fixed: "Nominal Tetap (Rp)",
};

export const TAX_APPLIES_TO_LABELS: Record<string, string> = {
  revenue: "Dari Omset (Pendapatan)",
  gross_profit: "Dari Laba Kotor",
};

export const TAX_APPLIES_TO_DESCRIPTIONS: Record<string, string> = {
  revenue:
    "Pajak dihitung dari total penjualan. Contoh: PPh Final UMKM 0.5% dari omset.",
  gross_profit:
    "Pajak dihitung dari laba kotor (omset - HPP). Contoh: PPh Badan.",
};

export const CATEGORY_COLORS: Record<string, string> = {
  utilities: "bg-blue-100 text-blue-700 border-blue-200",
  salary: "bg-violet-100 text-violet-700 border-violet-200",
  rent: "bg-amber-100 text-amber-700 border-amber-200",
  logistics: "bg-orange-100 text-orange-700 border-orange-200",
  marketing: "bg-pink-100 text-pink-700 border-pink-200",
  maintenance: "bg-teal-100 text-teal-700 border-teal-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};
