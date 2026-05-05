import { describe, it, expect } from "vitest";
import { validateProductData, validateUpdateProductData } from "@/lib/validations/product";

describe("validateProductData", () => {
  const validVariant = {
    name: "Kilogram",
    sellPrice: "15000",
    conversionToBase: "1000",
    unitId: 1,
  };

  it("passes with minimal valid data", () => {
    const result = validateProductData({
      name: "Gula Pasir",
      baseUnitId: 1,
    });
    expect(result.success).toBe(true);
  });

  it("fails when name is shorter than 3 chars", () => {
    const result = validateProductData({ name: "AB", baseUnitId: 1 });
    expect(result.success).toBe(false);
  });

  it("fails when baseUnitId is missing", () => {
    const result = validateProductData({ name: "Gula Pasir" });
    expect(result.success).toBe(false);
  });

  it("passes with variants", () => {
    const result = validateProductData({
      name: "Gula Pasir",
      baseUnitId: 1,
      variants: [validVariant],
    });
    expect(result.success).toBe(true);
  });

  it("fails when variant sellPrice < 1 and isActive is not false", () => {
    const result = validateProductData({
      name: "Gula Pasir",
      baseUnitId: 1,
      variants: [{ ...validVariant, sellPrice: "0" }],
    });
    expect(result.success).toBe(false);
  });

  it("passes when variant isActive=false even with sellPrice=0", () => {
    const result = validateProductData({
      name: "Gula Pasir",
      baseUnitId: 1,
      variants: [{ ...validVariant, sellPrice: "0", isActive: false }],
    });
    expect(result.success).toBe(true);
  });

  it("fails when variant conversionToBase < 1", () => {
    const result = validateProductData({
      name: "Gula Pasir",
      baseUnitId: 1,
      variants: [{ ...validVariant, conversionToBase: "0" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("validateUpdateProductData", () => {
  it("passes with partial data (all fields optional)", () => {
    const result = validateUpdateProductData({ name: "Tepung Terigu" });
    expect(result.success).toBe(true);
  });

  it("passes with empty object", () => {
    const result = validateUpdateProductData({});
    expect(result.success).toBe(true);
  });

  it("fails when name is too short", () => {
    const result = validateUpdateProductData({ name: "AB" });
    expect(result.success).toBe(false);
  });
});
