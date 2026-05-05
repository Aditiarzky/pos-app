import { describe, it, expect } from "vitest";
import { fillDailyGaps } from "@/lib/chart-utils";

describe("fillDailyGaps", () => {
  const keys = ["revenue", "profit"];

  it("fills missing days with zeros", () => {
    const data = [{ date: "2025-01-01", revenue: 100, profit: 50 }];
    const result = fillDailyGaps(data, "2025-01-01", "2025-01-03", keys);

    expect(result).toHaveLength(3);
    expect(result[1]).toMatchObject({ date: "2025-01-02", revenue: 0, profit: 0 });
    expect(result[2]).toMatchObject({ date: "2025-01-03", revenue: 0, profit: 0 });
  });

  it("preserves existing data points", () => {
    const data = [{ date: "2025-01-02", revenue: 200, profit: 80 }];
    const result = fillDailyGaps(data, "2025-01-01", "2025-01-03", keys);

    const jan2 = result.find((d) => d.date === "2025-01-02");
    expect(jan2?.revenue).toBe(200);
    expect(jan2?.profit).toBe(80);
  });

  it("adds a previous day when start === end (single day range)", () => {
    const data = [{ date: "2025-01-05", revenue: 500, profit: 100 }];
    const result = fillDailyGaps(data, "2025-01-05", "2025-01-05", keys);

    // Should have 2 points: 2025-01-04 (zero) and 2025-01-05
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe("2025-01-04");
    expect(result[0].revenue).toBe(0);
    expect(result[1].date).toBe("2025-01-05");
    expect(result[1].revenue).toBe(500);
  });

  it("returns correct date strings in yyyy-MM-dd format", () => {
    const result = fillDailyGaps([], "2025-03-01", "2025-03-03", keys);
    expect(result.map((d) => d.date)).toEqual([
      "2025-03-01",
      "2025-03-02",
      "2025-03-03",
    ]);
  });
});
