export const getUserTimezone = () => {
  if (typeof Intl === "undefined") return "UTC";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

export const normalizeTimezone = (timezone?: string) => {
  return timezone || "UTC";
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const getLocalParts = (timezone: string, date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter
    .formatToParts(date)
    .filter((part) => part.type !== "literal");
  const result: Record<string, string> = {};
  for (const part of parts) {
    result[part.type] = part.value;
  }
  return result;
};

export const getLocalMidnightUtc = (timezone: string, offsetDays = 0) => {
  const parts = getLocalParts(timezone);
  const year = Number(parts.year);
  const month = Number(parts.month) - 1;
  const day = Number(parts.day) + offsetDays;

  // Buat tanggal "naive" di timezone lokal, lalu konversi ke UTC yang benar
  const naive = new Date(year, month, day, 0, 0, 0, 0);

  // Cari offset: selisih antara UTC vs timezone target pada waktu itu
  const inTz = new Date(naive.toLocaleString("en-US", { timeZone: timezone }));
  const inUtc = new Date(naive.toLocaleString("en-US", { timeZone: "UTC" }));
  const offsetMs = inTz.getTime() - inUtc.getTime();

  return new Date(naive.getTime() - offsetMs);
};

/**
 * Konversi tanggal lokal (string "YYYY-MM-DD") + waktu ke UTC Date,
 * berdasarkan timezone yang diberikan.
 *
 * Contoh: getUtcFromLocalDate("2026-03-13", "00:00:00.000", "Asia/Jakarta")
 * → 2026-03-12T17:00:00.000Z
 */
export const getUtcFromLocalDate = (
  localDateStr: string, // format: "YYYY-MM-DD"
  time: string, // format: "00:00:00.000" atau "23:59:59.999"
  timezone: string,
): Date => {
  const naive = new Date(`${localDateStr}T${time}`);
  const inTz = new Date(naive.toLocaleString("en-US", { timeZone: timezone }));
  const inUtc = new Date(naive.toLocaleString("en-US", { timeZone: "UTC" }));
  const offsetMs = inTz.getTime() - inUtc.getTime();
  return new Date(naive.getTime() - offsetMs);
};

export const getLocalMonthStartUtc = (timezone: string, offsetMonths = 0) => {
  const parts = getLocalParts(timezone);
  const year = Number(parts.year ?? 0);
  const month = Number(parts.month ?? 1) - 1 + offsetMonths;
  return new Date(Date.UTC(year, month, 1));
};

export const MS_DAY = MS_PER_DAY;
