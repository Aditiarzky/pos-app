import { describe, it, expect } from "vitest";
import { insertSaleSchema } from "@/lib/validations/sale";

describe("insertSaleSchema", () => {
  const validItem = { productId: 1, variantId: 2, qty: 2 };

  const base = {
    userId: 1,
    items: [validItem],
    totalPaid: 20000,
    isDebt: false,
    paymentMethod: "cash" as const,
  };

  it("passes with valid cash sale", () => {
    const result = insertSaleSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("fails when items is empty", () => {
    const result = insertSaleSchema.safeParse({ ...base, items: [] });
    expect(result.success).toBe(false);
  });

  it("fails when cash non-debt totalPaid is 0", () => {
    const result = insertSaleSchema.safeParse({ ...base, totalPaid: 0 });
    expect(result.success).toBe(false);
  });

  it("passes when isDebt=true (totalPaid can be 0)", () => {
    const result = insertSaleSchema.safeParse({
      ...base,
      isDebt: true,
      totalPaid: 0,
      customerId: 5,
    });
    expect(result.success).toBe(true);
  });

  it("fails when QRIS + isDebt=true", () => {
    const result = insertSaleSchema.safeParse({
      ...base,
      paymentMethod: "qris",
      isDebt: true,
    });
    expect(result.success).toBe(false);
  });

  it("passes QRIS with isDebt=false", () => {
    const result = insertSaleSchema.safeParse({
      ...base,
      paymentMethod: "qris",
      isDebt: false,
      totalPaid: 0, // QRIS doesn't need totalPaid
    });
    // cash rule only applies to paymentMethod=cash, so QRIS should pass
    expect(result.success).toBe(true);
  });

  it("fails when guest uses balance (no customerId)", () => {
    const result = insertSaleSchema.safeParse({
      ...base,
      totalBalanceUsed: 5000,
      // no customerId
    });
    expect(result.success).toBe(false);
  });

  it("passes when customer uses balance", () => {
    const result = insertSaleSchema.safeParse({
      ...base,
      customerId: 3,
      totalBalanceUsed: 5000,
    });
    expect(result.success).toBe(true);
  });

  it("fails when item qty is not positive", () => {
    const result = insertSaleSchema.safeParse({
      ...base,
      items: [{ ...validItem, qty: 0 }],
    });
    expect(result.success).toBe(false);
  });
});
