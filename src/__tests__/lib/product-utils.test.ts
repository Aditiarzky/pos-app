import { describe, it, expect } from "vitest";
import { calculateVariantMargin } from "@/lib/product-utils";

describe("calculateVariantMargin", () => {
  it("calculates HPP correctly (averageCost × conversionToBase)", () => {
    const result = calculateVariantMargin(
      { sellPrice: 20000, conversionToBase: 1000 },
      15, // averageCost per base unit (e.g. per gram)
    );
    // hpp = 15 * 1000 = 15000
    expect(result.hpp).toBe(15000);
  });

  it("calculates margin correctly", () => {
    const result = calculateVariantMargin(
      { sellPrice: 20000, conversionToBase: 1000 },
      15,
    );
    // margin = 20000 - 15000 = 5000
    expect(result.margin).toBe(5000);
  });

  it("calculates marginPercent correctly", () => {
    const result = calculateVariantMargin(
      { sellPrice: 20000, conversionToBase: 1000 },
      15,
    );
    // marginPercent = round(5000 / 20000 * 100) = 25
    expect(result.marginPercent).toBe(25);
  });

  it("marks profitable when margin > 0", () => {
    const result = calculateVariantMargin(
      { sellPrice: 20000, conversionToBase: 1000 },
      15,
    );
    expect(result.isProfitable).toBe(true);
  });

  it("marks not profitable when margin <= 0", () => {
    const result = calculateVariantMargin(
      { sellPrice: 10000, conversionToBase: 1000 },
      15, // hpp = 15000 > sellPrice
    );
    expect(result.isProfitable).toBe(false);
  });

  it("handles zero averageCost", () => {
    const result = calculateVariantMargin(
      { sellPrice: 5000, conversionToBase: 1 },
      0,
    );
    expect(result.hpp).toBe(0);
    expect(result.margin).toBe(5000);
    expect(result.isProfitable).toBe(true);
  });

  it("handles null/undefined averageCost as 0", () => {
    const result = calculateVariantMargin(
      { sellPrice: 5000, conversionToBase: 1 },
      null,
    );
    expect(result.hpp).toBe(0);
  });

  it("handles zero sellPrice — marginPercent is 0", () => {
    const result = calculateVariantMargin(
      { sellPrice: 0, conversionToBase: 1 },
      10,
    );
    expect(result.marginPercent).toBe(0);
  });

  it("handles string inputs for sellPrice and conversionToBase", () => {
    const result = calculateVariantMargin(
      { sellPrice: "20000", conversionToBase: "1000" },
      "15.3333",
    );
    // hpp = 15.3333 * 1000 = 15333.3
    expect(result.hpp).toBeCloseTo(15333.3, 1);
  });

  it("clamps negative conversionToBase to 1", () => {
    const result = calculateVariantMargin(
      { sellPrice: 5000, conversionToBase: -5 },
      100,
    );
    // conversionToBase clamped to 1 → hpp = 100
    expect(result.hpp).toBe(100);
  });
});
