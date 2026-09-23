import { describe, it, expect, beforeEach, vi } from "vitest";

const mockReturningFns: Array<() => Promise<unknown[]>> = [];
const mockUpdateReturningFns: Array<() => Promise<unknown[]>> = [];
let deleteCallCount = 0;
let updateCallCount = 0;

vi.mock("@/lib/db", () => ({
  db: {
    delete: vi.fn(() => {
      const idx = deleteCallCount++;
      return {
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockImplementation(() => mockReturningFns[idx]?.() ?? Promise.resolve([])),
        }),
      };
    }),
    update: vi.fn(() => {
      const idx = updateCallCount++;
      return {
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockImplementation(() => mockUpdateReturningFns[idx]?.() ?? Promise.resolve([])),
          }),
        }),
      };
    }),
  },
}));

import { db } from "@/lib/db";
import {
  cleanExpiredData,
  cleanExpiredDataWithArchive,
} from "@/lib/clean-expired-data";
import {
  sales,
  purchaseOrders,
  stockMutations,
  customerReturns,
  supplierReturns,
} from "@/drizzle/schema";

describe("cleanExpiredData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteCallCount = 0;
    updateCallCount = 0;
    mockReturningFns.length = 0;
    mockUpdateReturningFns.length = 0;
  });

  it("deletes expired records across all tables and returns counts", async () => {
    mockReturningFns.push(
      () => Promise.resolve([{ id: 1 }]),
      () => Promise.resolve([{ id: 2 }, { id: 3 }]),
      () => Promise.resolve([{ id: 4 }]),
      () => Promise.resolve([{ id: 5 }]),
      () => Promise.resolve([]),
    );

    const result = await cleanExpiredData();

    expect(result.success).toBe(true);
    expect(result.deleted).toEqual({
      sales: 1,
      purchases: 2,
      stockMutations: 1,
      customerReturns: 1,
      supplierReturns: 0,
    });

    expect(db.delete).toHaveBeenCalledTimes(5);
    const calledTables = (db.delete as any).mock.calls.map((c: any) => c[0]);
    expect(calledTables).toContain(sales);
    expect(calledTables).toContain(purchaseOrders);
    expect(calledTables).toContain(stockMutations);
    expect(calledTables).toContain(customerReturns);
    expect(calledTables).toContain(supplierReturns);
  });

  it("returns success with zeros when nothing to delete", async () => {
    for (let i = 0; i < 5; i++) {
      mockReturningFns.push(() => Promise.resolve([]));
    }

    const result = await cleanExpiredData();

    expect(result.success).toBe(true);
    expect(result.deleted).toEqual({
      sales: 0,
      purchases: 0,
      stockMutations: 0,
      customerReturns: 0,
      supplierReturns: 0,
    });
  });

  it("returns success:false on database error", async () => {
    mockReturningFns.push(() =>
      Promise.reject(new Error("connection refused")),
    );

    const result = await cleanExpiredData();

    expect(result.success).toBe(false);
    expect(result.error).toContain("connection refused");
  });
});

describe("cleanExpiredDataWithArchive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteCallCount = 0;
    updateCallCount = 0;
    mockReturningFns.length = 0;
    mockUpdateReturningFns.length = 0;
  });

  it("archives expired sales, purchases, and customer returns", async () => {
    mockUpdateReturningFns.push(
      () => Promise.resolve([{ id: 10 }]),
      () => Promise.resolve([{ id: 20 }, { id: 30 }]),
      () => Promise.resolve([{ id: 40 }]),
    );

    const result = await cleanExpiredDataWithArchive();

    expect(result.success).toBe(true);
    expect(result.archived).toEqual({
      sales: 1,
      purchases: 2,
      customerReturns: 1,
    });
    expect(db.update).toHaveBeenCalledTimes(3);
  });

  it("returns zeros when nothing to archive", async () => {
    mockUpdateReturningFns.push(
      () => Promise.resolve([]),
      () => Promise.resolve([]),
      () => Promise.resolve([]),
    );

    const result = await cleanExpiredDataWithArchive();

    expect(result.success).toBe(true);
    expect(result.archived).toEqual({
      sales: 0,
      purchases: 0,
      customerReturns: 0,
    });
  });

  it("returns success:false on database error", async () => {
    mockUpdateReturningFns.push(() =>
      Promise.reject(new Error("timeout")),
    );

    const result = await cleanExpiredDataWithArchive();

    expect(result.success).toBe(false);
    expect(result.error).toContain("timeout");
  });
});
