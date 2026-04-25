type TrashCleanupEvent = {
  id: string;
  deletedCount: number;
  skippedCount: number;
  expiredCount: number;
  oldestExpiredAt: string | null;
  createdAt: string;
};

type NotificationStateStore = {
  trashCleanupEvents: TrashCleanupEvent[];
  lastCleanupRun?: number;
};

declare global {
  var __notificationStateStore: NotificationStateStore | undefined;
}

const MAX_TRASH_EVENTS = 100;
const TRASH_EVENT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const AUTO_CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

const getStore = (): NotificationStateStore => {
  if (!globalThis.__notificationStateStore) {
    globalThis.__notificationStateStore = {
      trashCleanupEvents: [],
      lastCleanupRun: 0,
    };
  }

  return globalThis.__notificationStateStore;
};

export const shouldRunAutoCleanup = () => {
  const store = getStore();
  const now = Date.now();
  // The 'getStore' function ensures that 'lastCleanupRun' is always initialized
  // to a number (0) if the store was not yet created. Therefore, it will not
  // be undefined at this point, and we can use a non-null assertion.
  if (now - store.lastCleanupRun! >= AUTO_CLEANUP_INTERVAL_MS) {
    store.lastCleanupRun = now;
    return true;
  }
  return false;
};

export const appendTrashCleanupEvent = ({
  deletedCount,
  skippedCount,
  expiredCount = 0,
  oldestExpiredAt = null,
}: {
  deletedCount: number;
  skippedCount: number;
  expiredCount?: number;
  oldestExpiredAt?: string | null;
}) => {
  const store = getStore();

  if (deletedCount <= 0 && expiredCount <= 0) {
    return null;
  }

  const event: TrashCleanupEvent = {
    id: `trash_cleanup:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    deletedCount,
    skippedCount,
    expiredCount,
    oldestExpiredAt,
    createdAt: new Date().toISOString(),
  };

  store.trashCleanupEvents.unshift(event);
  const now = Date.now();
  store.trashCleanupEvents = store.trashCleanupEvents.filter((item) => {
    const createdAt = new Date(item.createdAt).getTime();
    if (Number.isNaN(createdAt)) return false;
    return now - createdAt <= TRASH_EVENT_TTL_MS;
  });

  // Keep only recent and bounded events to prevent unbounded memory usage.
  if (store.trashCleanupEvents.length > MAX_TRASH_EVENTS) {
    store.trashCleanupEvents = store.trashCleanupEvents.slice(0, MAX_TRASH_EVENTS);
  }

  return event;
};

export const getTrashCleanupEvents = (limit = 20): TrashCleanupEvent[] => {
  const store = getStore();
  const now = Date.now();
  store.trashCleanupEvents = store.trashCleanupEvents.filter((item) => {
    const createdAt = new Date(item.createdAt).getTime();
    if (Number.isNaN(createdAt)) return false;
    return now - createdAt <= TRASH_EVENT_TTL_MS;
  });
  return store.trashCleanupEvents.slice(0, limit);
};

export const resetNotificationStoreForTest = () => {
  globalThis.__notificationStateStore = { trashCleanupEvents: [], lastCleanupRun: 0 };
};
