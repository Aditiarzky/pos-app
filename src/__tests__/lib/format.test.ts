import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  parseCurrency,
  formatNumber,
  formatCompactNumber,
  parseNumber,
  parseNumberToFloat,
  formatDate,
} from "@/lib/format";

describe("formatCurrency", () => {
  it("formats a number as IDR currency", () => {
    expect(formatCurrency(10000)).toContain("10.000");
  });

  it("formats a string number", () => {
    expect(formatCurrency("50000")).toContain("50.000");
  });

  it("returns empty string for NaN", () => {
    expect(formatCurrency("abc")).toBe("");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toContain("0");
  });
});

describe("parseCurrency", () => {
  it("strips non-digit characters", () => {
    expect(parseCurrency("Rp 10.000")).toBe("10000");
  });

  it("returns digits only", () => {
    expect(parseCurrency("1,234,567")).toBe("1234567");
  });
});

describe("formatNumber", () => {
  it("formats a number with id-ID locale", () => {
    expect(formatNumber(1234.5)).toContain("1.234");
  });

  it("returns empty string for empty input", () => {
    expect(formatNumber("")).toBe("");
  });

  it("returns empty string for NaN", () => {
    expect(formatNumber("xyz")).toBe("");
  });
});

describe("formatCompactNumber", () => {
  it("formats large numbers compactly", () => {
    const result = formatCompactNumber(1500000);
    expect(result).toMatch(/1[,.]?5\s*[Jj]/); // "1,5 jt" or similar
  });

  it("returns '0' for NaN", () => {
    expect(formatCompactNumber("abc")).toBe("0");
  });
});

describe("parseNumber", () => {
  it("converts id-ID formatted number to parseable float string", () => {
    // "1.234,56" → "1234.56"
    expect(parseNumber("1.234,56")).toBe("1234.56");
  });

  it("handles plain number string", () => {
    expect(parseNumber("100")).toBe("100");
  });
});

describe("parseNumberToFloat", () => {
  it("replaces dots with commas", () => {
    expect(parseNumberToFloat("1234.56")).toBe("1234,56");
  });
});

describe("formatDate", () => {
  it("returns '-' for falsy input", () => {
    expect(formatDate("")).toBe("-");
  });

  it("formats a valid date string", () => {
    const result = formatDate("2025-01-15T00:00:00.000Z");
    expect(result).toBeTruthy();
    expect(result).not.toBe("-");
  });
});
