import { describe, it, expect } from "vitest";
import {
  validateCategoryData,
  validateCategoryUpdateData,
} from "@/lib/validations/category";

describe("validateCategoryData", () => {
  it("passes with a valid name", () => {
    const result = validateCategoryData({ name: "Minuman" });
    expect(result.success).toBe(true);
  });

  it("fails when name is too short (< 3 chars)", () => {
    const result = validateCategoryData({ name: "AB" });
    expect(result.success).toBe(false);
  });

  it("fails when name is too long (> 255 chars)", () => {
    const result = validateCategoryData({ name: "A".repeat(256) });
    expect(result.success).toBe(false);
  });

  it("fails when name is missing", () => {
    const result = validateCategoryData({});
    expect(result.success).toBe(false);
  });
});

describe("validateCategoryUpdateData", () => {
  it("passes with a valid name", () => {
    const result = validateCategoryUpdateData({ name: "Makanan" });
    expect(result.success).toBe(true);
  });

  it("passes with empty object (all fields optional)", () => {
    const result = validateCategoryUpdateData({});
    expect(result.success).toBe(true);
  });

  it("fails when name is too short", () => {
    const result = validateCategoryUpdateData({ name: "AB" });
    expect(result.success).toBe(false);
  });
});
