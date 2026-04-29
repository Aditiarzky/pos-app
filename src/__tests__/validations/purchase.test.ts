import { describe, it, expect } from "vitest";
import { insertPurchaseSchema } from "@/lib/validations/purchase";

describe("insertPurchaseSchema", () => {
  const validItem = {
    productId: 1,
    variantId: 2,
    qty: 10,
    price: 5000,
  };

  it("passes with valid data", () => {
    const result = insertPurchaseSchema.safeParse({
      supplierId: 1,
      userId: 1,
      items: [validItem],
    });
    expect(result.success).toBe(true);
  });

  it("fails when supplierId is missing", () => {
    const result = insertPurchaseSchema.safeParse({
      userId: 1,
      items: [validItem],
    });
    expect(result.success).toBe(false);
  });

  it("fails when items array is empty", () => {
    const result = insertPurchaseSchema.safeParse({
      supplierId: 1,
      userId: 1,
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("fails when item qty < 1", () => {
    const result = insertPurchaseSchema.safeParse({
      supplierId: 1,
      userId: 1,
      items: [{ ...validItem, qty: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("fails when item price is negative", () => {
    const result = insertPurchaseSchema.safeParse({
      supplierId: 1,
      userId: 1,
      items: [{ ...validItem, price: -100 }],
    });
    expect(result.success).toBe(false);
  });

  it("passes with price = 0 (free item)", () => {
    const result = insertPurchaseSchema.safeParse({
      supplierId: 1,
      userId: 1,
      items: [{ ...validItem, price: 0 }],
    });
    expect(result.success).toBe(true);
  });
});
