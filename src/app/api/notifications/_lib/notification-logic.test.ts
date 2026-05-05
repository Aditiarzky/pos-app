import { describe, expect, it } from "vitest";
import {
  applyNotificationState,
  buildLowStockId,
  buildExpiredTrashId,
  buildRestockId,
  deduplicateRestockSignals,
  PRIORITY_BY_SEVERITY,
  resolveStableTrashCreatedAt,
  sortNotificationsByPriority,
} from "./notification-logic";

describe("notification-logic", () => {
  it("sorts notifications by priority then createdAt desc", () => {
    const sorted = sortNotificationsByPriority([
      { id: "a", priority: PRIORITY_BY_SEVERITY.info, createdAt: "2026-04-10T00:00:00.000Z" },
      { id: "b", priority: PRIORITY_BY_SEVERITY.critical, createdAt: "2026-04-08T00:00:00.000Z" },
      { id: "c", priority: PRIORITY_BY_SEVERITY.warning, createdAt: "2026-04-12T00:00:00.000Z" },
      { id: "d", priority: PRIORITY_BY_SEVERITY.warning, createdAt: "2026-04-13T00:00:00.000Z" },
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["b", "d", "c", "a"]);
  });

  it("builds low stock id without daily suffix", () => {
    const id = buildLowStockId(99, new Date("2026-04-17T08:00:00.000Z"));
    expect(id).toBe("low_stock:99");
  });

  it("builds dynamic expired trash id", () => {
    const id = buildExpiredTrashId(5, "2026-04-10T10:00:00.000Z");
    expect(id).toBe("trash_cleanup:expired_items:5:2026-04-10");
  });

  it("builds dynamic restock id from occurrence fingerprint", () => {
    const id = buildRestockId(7, "2026-04-20T08:00:00.000Z", 12, 7);
    expect(id).toBe("restock:7:7:12:2026-04-20T08:00:00.000Z");
  });

  it("deduplicates restock signals by choosing highest urgency", () => {
    const deduped = deduplicateRestockSignals([
      { productId: 1, urgencyScore: 15 },
      { productId: 1, urgencyScore: 45 },
      { productId: 2, urgencyScore: 10 },
    ]);

    expect(deduped).toHaveLength(2);
    expect(deduped.find((item) => item.productId === 1)?.urgencyScore).toBe(45);
  });

  it("returns stable trash createdAt based on oldest source timestamp", () => {
    const stable = resolveStableTrashCreatedAt(
      "2026-03-10T10:00:00.000Z",
      new Date("2026-04-17T00:00:00.000Z"),
    );
    expect(stable).toBe("2026-03-10T10:00:00.000Z");
  });

  it("keeps low_stock createdAt from current event even when state exists", () => {
    const item = {
      id: "low_stock:1",
      type: "low_stock" as const,
      severity: "warning" as const,
      createdAt: "2026-04-21T10:00:00.000Z",
    };
    const stateMap = new Map([
      [
        item.id,
        {
          readAt: null,
          dismissedAt: null,
          createdAt: new Date("2026-04-20T08:00:00.000Z"),
        },
      ],
    ]);

    const result = applyNotificationState(item, stateMap);
    expect(result?.createdAt).toBe("2026-04-21T10:00:00.000Z");
  });

  it("reopens computed notification when previous read is older than new occurrence", () => {
    const item = {
      id: "low_stock:1",
      type: "low_stock" as const,
      severity: "warning" as const,
      createdAt: "2026-04-17T07:00:00.000Z",
    };
    const stateMap = new Map([
      [
        item.id,
        {
          readAt: new Date("2026-04-16T07:00:00.000Z"),
          dismissedAt: null,
          createdAt: new Date("2026-04-16T07:00:00.000Z"),
        },
      ],
    ]);

    const result = applyNotificationState(item, stateMap);
    expect(result?.isRead).toBe(false);
  });

  it("keeps restock read state for same occurrence even when createdAt is newer", () => {
    const item = {
      id: "restock:7:7:12:2026-04-20",
      type: "restock" as const,
      severity: "warning" as const,
      createdAt: "2026-04-28T10:00:00.000Z",
    };
    const stateMap = new Map([
      [
        item.id,
        {
          readAt: new Date("2026-04-28T09:00:00.000Z"),
          dismissedAt: null,
          createdAt: new Date("2026-04-28T09:00:00.000Z"),
        },
      ],
    ]);

    const result = applyNotificationState(item, stateMap);
    expect(result?.isRead).toBe(true);
    expect(result?.createdAt).toBe("2026-04-28T10:00:00.000Z");
  });
});
