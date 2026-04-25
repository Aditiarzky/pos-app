import { beforeEach, describe, expect, it } from "vitest";
import {
  appendTrashCleanupEvent,
  getTrashCleanupEvents,
  resetNotificationStoreForTest,
} from "./notification-store";

describe("notification-store", () => {
  beforeEach(() => {
    resetNotificationStoreForTest();
  });

  it("does not append cleanup event when both deleted and expired count are zero", () => {
    const result = appendTrashCleanupEvent({
      deletedCount: 0,
      skippedCount: 4,
      expiredCount: 0,
      oldestExpiredAt: null,
    });
    expect(result).toBeNull();
    expect(getTrashCleanupEvents()).toHaveLength(0);
  });

  it("appends event even if deletedCount is zero but expiredCount is positive", () => {
    const result = appendTrashCleanupEvent({
      deletedCount: 0,
      skippedCount: 4,
      expiredCount: 10,
      oldestExpiredAt: "2026-04-10T00:00:00.000Z",
    });
    expect(result).not.toBeNull();
    expect(getTrashCleanupEvents()).toHaveLength(1);
    expect(getTrashCleanupEvents()[0]?.expiredCount).toBe(10);
  });

  it("removes events older than retention window", () => {
    const now = new Date("2026-04-17T00:00:00.000Z");
    const old = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString();

    // Seed store with an expired event.
    (globalThis).__notificationStateStore = {
      trashCleanupEvents: [
        {
          id: "trash_cleanup:old",
          deletedCount: 3,
          skippedCount: 0,
          expiredCount: 3,
          oldestExpiredAt: old,
          createdAt: old,
        },
      ],
      lastCleanupRun: 0,
    };

    const realNow = Date.now;
    Date.now = () => now.getTime();

    try {
      appendTrashCleanupEvent({
        deletedCount: 2,
        skippedCount: 0,
        expiredCount: 2,
        oldestExpiredAt: now.toISOString(),
      });
      const events = getTrashCleanupEvents();
      expect(events).toHaveLength(1);
      expect(events[0]?.id).not.toBe("trash_cleanup:old");
    } finally {
      Date.now = realNow;
    }
  });
});
