import { describe, it, expect } from "vitest";
import {
  getUserTimezone,
  normalizeTimezone,
  getUtcFromLocalDate,
} from "@/lib/timezone";

describe("getUserTimezone", () => {
  it("returns a non-empty string", () => {
    const tz = getUserTimezone();
    expect(typeof tz).toBe("string");
    expect(tz.length).toBeGreaterThan(0);
  });
});

describe("normalizeTimezone", () => {
  it("returns the given timezone when provided", () => {
    expect(normalizeTimezone("Asia/Jakarta")).toBe("Asia/Jakarta");
  });

  it("returns UTC when undefined", () => {
    expect(normalizeTimezone(undefined)).toBe("UTC");
  });

  it("returns UTC when empty string", () => {
    expect(normalizeTimezone("")).toBe("UTC");
  });
});

describe("getUtcFromLocalDate", () => {
  /**
   * We derive expected values dynamically so the tests pass regardless of
   * the machine's local timezone (the test runner is in Asia/Jakarta).
   */
  it("converts a local midnight to a UTC Date object", () => {
    const result = getUtcFromLocalDate("2025-01-15", "00:00:00.000", "Asia/Jakarta");
    // The result must be a valid Date
    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result.getTime())).toBe(false);
  });

  it("midnight in Asia/Jakarta is 7 hours behind UTC (UTC+7)", () => {
    const result = getUtcFromLocalDate("2025-01-15", "00:00:00.000", "Asia/Jakarta");
    // UTC hour should be 17 (24 - 7) of the previous day
    expect(result.getUTCHours()).toBe(17);
    expect(result.getUTCDate()).toBe(14); // previous day
  });

  it("end-of-day in Asia/Jakarta maps to correct UTC", () => {
    const result = getUtcFromLocalDate("2025-01-15", "23:59:59.999", "Asia/Jakarta");
    // 23:59 WIB = 16:59 UTC same day
    expect(result.getUTCHours()).toBe(16);
    expect(result.getUTCDate()).toBe(15);
  });

  it("UTC timezone has no offset — midnight stays midnight", () => {
    const result = getUtcFromLocalDate("2025-06-01", "00:00:00.000", "UTC");
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCDate()).toBe(1);
    expect(result.getUTCMonth()).toBe(5); // June = month index 5
  });

  it("returns a Date earlier than the naive local time for UTC+7", () => {
    const result = getUtcFromLocalDate("2025-03-10", "12:00:00.000", "Asia/Jakarta");
    // 12:00 WIB = 05:00 UTC
    expect(result.getUTCHours()).toBe(5);
  });
});
