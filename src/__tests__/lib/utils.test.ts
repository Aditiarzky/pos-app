import { describe, it, expect } from "vitest";
import { cn, getInitial } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-2")).toBe("px-2 py-2");
  });

  it("resolves tailwind conflicts (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("handles undefined/null gracefully", () => {
    expect(cn(undefined, null, "text-sm")).toBe("text-sm");
  });
});

describe("getInitial", () => {
  it("returns first and last word initials for multi-word names", () => {
    expect(getInitial("Budi Santoso")).toBe("BS");
  });

  it("returns first 3 chars for single word", () => {
    expect(getInitial("Budi")).toBe("BUD");
  });

  it("ignores common words like 'dan', 'pt', 'cv'", () => {
    // "PT Maju Jaya" → ignores "PT" → "Maju Jaya" → "MJ"
    expect(getInitial("PT Maju Jaya")).toBe("MJ");
  });

  it("returns empty string for empty input", () => {
    expect(getInitial("")).toBe("");
  });

  it("is uppercase", () => {
    const result = getInitial("andi budi");
    expect(result).toBe(result.toUpperCase());
  });
});
