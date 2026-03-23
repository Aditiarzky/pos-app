import {
  eachDayOfInterval,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";

// Sama persis dengan ChartData di chart-area-interactive agar assignable
export type ChartData = {
  date: string;
  [key: string]: string | number;
};

/**
 * Mengisi gap tanggal agar chart area/line selalu punya minimal 2 titik data.
 *
 * Masalah: kalau filter "Hari Ini" atau "Kemarin" hanya menghasilkan 1 hari,
 * chart line tidak terbentuk karena butuh minimal 2 koordinat x.
 *
 * Solusi: kalau range hanya 1 hari, tambahkan satu hari sebelumnya
 * sebagai titik nol (semua key = 0) agar line bisa digambar.
 */
export const fillDailyGaps = (
  data: Record<string, string | number>[],
  startDate: string,
  endDate: string,
  keys: string[],
): ChartData[] => {
  let start = startOfDay(parseISO(startDate));
  const end = startOfDay(parseISO(endDate));

  // Pastikan minimal 2 titik data agar line chart bisa terbentuk
  if (start.getTime() === end.getTime()) {
    start = subDays(start, 1);
  }

  const days = eachDayOfInterval({ start, end });

  return days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const existing = data.find((d) => isSameDay(parseISO(String(d.date)), day));

    if (existing) return { ...existing, date: dateStr };

    const obj: ChartData = { date: dateStr };
    keys.forEach((key) => { obj[key] = 0; });
    return obj;
  });
};
