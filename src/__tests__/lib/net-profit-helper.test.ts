import { vi, describe, it, expect } from "vitest";

// Mock the db module
vi.mock("@/lib/db", () => {
  return {
    db: {
      query: {
        taxConfigs: {
          findMany: vi.fn(),
        },
        operationalCosts: {
          findMany: vi.fn(),
        },
      },
    },
  };
});

import { db } from "@/lib/db";
import { calculateNetProfit } from "@/lib/net-profit-helper";

describe("calculateNetProfit", () => {
  it("calculates taxes correctly, including net_profit appliesTo", async () => {
    // Mock operational costs:
    // One monthly cost of 3,000,000 IDR
    vi.mocked(db.query.operationalCosts.findMany).mockResolvedValue([
      {
        id: 1,
        name: "Sewa Tempat",
        amount: "3000000",
        period: "monthly",
        isActive: true,
        category: "rent",
        effectiveFrom: "2026-01-01",
        effectiveTo: null,
      },
    ] as any);

    // Mock active taxes:
    // 1. Fixed tax of 100,000 IDR per month
    // 2. Revenue percentage tax of 1% (appliesTo = revenue)
    // 3. Net profit percentage tax of 10% (appliesTo = net_profit)
    vi.mocked(db.query.taxConfigs.findMany).mockResolvedValue([
      {
        id: 1,
        name: "Retribusi Bulanan",
        type: "fixed",
        fixedAmount: "100000",
        rate: null,
        appliesTo: null,
        period: "monthly",
        isActive: true,
        effectiveFrom: "2026-01-01",
        effectiveTo: null,
      },
      {
        id: 2,
        name: "Pajak Omset",
        type: "percentage",
        fixedAmount: null,
        rate: "0.01", // 1%
        appliesTo: "revenue",
        period: "monthly",
        isActive: true,
        effectiveFrom: "2026-01-01",
        effectiveTo: null,
      },
      {
        id: 3,
        name: "Pajak Laba Bersih",
        type: "percentage",
        fixedAmount: null,
        rate: "0.10", // 10%
        appliesTo: "net_profit",
        period: "monthly",
        isActive: true,
        effectiveFrom: "2026-01-01",
        effectiveTo: null,
      },
    ] as any);

    // Input parameters for 30 days (1 month)
    const revenue = 10000000; // 10,000,000
    const grossProfit = 8000000; // 8,000,000
    const startDate = new Date("2026-07-01T00:00:00.000Z");
    const endDate = new Date("2026-07-30T23:59:59.000Z");

    const result = await calculateNetProfit(
      revenue,
      grossProfit,
      startDate,
      endDate,
    );

    // Operational costs: 3,000,000 IDR
    expect(result.totalOperationalCost).toBe(3000000);

    // Non-net-profit taxes:
    // Fixed: 100,000 IDR
    // Revenue percentage: 1% * 10,000,000 = 100,000 IDR
    // Total non-net profit taxes = 200,000 IDR
    // EBT (Earnings Before net_profit Tax) = grossProfit (8,000,000) - totalOperationalCost (3,000,000) - totalNonNetProfitTax (200,000) = 4,800,000 IDR
    // Net profit tax: 10% * 4,800,000 = 480,000 IDR
    // Total Tax: 200,000 + 480,000 = 680,000 IDR
    // Net Profit: EBT (4,800,000) - Net Profit Tax (480,000) = 4,320,000 IDR

    expect(result.totalTax).toBe(680000);
    expect(result.netProfit).toBe(4320000);

    // Check breakdown details
    const fixedTax = result.breakdown.taxes.find((t) => t.id === 1);
    expect(fixedTax?.amount).toBe(100000);

    const revenueTax = result.breakdown.taxes.find((t) => t.id === 2);
    expect(revenueTax?.amount).toBe(100000);

    const netProfitTax = result.breakdown.taxes.find((t) => t.id === 3);
    expect(netProfitTax?.amount).toBe(480000);
  });

  it("handles negative EBT correctly, making net_profit tax 0", async () => {
    // Mock operational costs to be very high: 9,000,000 IDR
    vi.mocked(db.query.operationalCosts.findMany).mockResolvedValue([
      {
        id: 1,
        name: "Biaya Operasional Besar",
        amount: "9000000",
        period: "monthly",
        isActive: true,
        category: "rent",
        effectiveFrom: "2026-01-01",
        effectiveTo: null,
      },
    ] as any);

    // Mock 10% net profit percentage tax
    vi.mocked(db.query.taxConfigs.findMany).mockResolvedValue([
      {
        id: 3,
        name: "Pajak Laba Bersih",
        type: "percentage",
        fixedAmount: null,
        rate: "0.10",
        appliesTo: "net_profit",
        period: "monthly",
        isActive: true,
        effectiveFrom: "2026-01-01",
        effectiveTo: null,
      },
    ] as any);

    const revenue = 10000000;
    const grossProfit = 8000000; // 8,000,000
    const startDate = new Date("2026-07-01T00:00:00.000Z");
    const endDate = new Date("2026-07-30T23:59:59.000Z");

    const result = await calculateNetProfit(
      revenue,
      grossProfit,
      startDate,
      endDate,
    );

    // EBT = 8,000,000 (grossProfit) - 9,000,000 (operationalCost) = -1,000,000 IDR (negative)
    // Net profit tax rate * max(0, EBT) = 0.10 * 0 = 0
    expect(result.totalTax).toBe(0);
    expect(result.netProfit).toBe(-1000000); // 8,000,000 - 9,000,000 - 0 = -1,000,000
  });
});
