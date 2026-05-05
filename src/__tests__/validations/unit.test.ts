import { describe, it, expect } from "vitest";
import {
  validateUnitData,
  validateUnitUpdateData,
} from "@/lib/validations/unit";

describe("validateUnitData", () => {
  it("passes with a valid name", () => {
    const result = validateUnitData({ name: "Kilogram" });
    expect(result.success).toBe(true);
  });

  it("fails when name is empty", () => {
    const result = validateUnitData({ name: "" });
    expect(result.success).toBe(false);
  });

  it("fails when name exceeds 255 characters", () => {
    const result = validateUnitData({ name: "A".repeat(256) });
    expect(result.success).toBe(false);
  });

  it("fails when name is missing", () => {
    const result = validateUnitData({});
    expect(result.success).toBe(false);
  });
});

describe("validateUnitUpdateData", () => {
  it("passes with a valid name", () => {
    const result = validateUnitUpdateData({ name: "Gram" });
    expect(result.success).toBe(true);
  });

  it("fails when name is empty string", () => {
    const result = validateUnitUpdateData({ name: "" });
    expect(result.success).toBe(false);
  });
});
