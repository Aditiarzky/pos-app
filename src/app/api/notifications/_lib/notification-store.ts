type TrashCleanupEvent = {
  id: string;
  deletedCount: number;
  skippedCount: number;
  createdAt: string;
};

type NotificationStateStore = {
  trashCleanupEvents: TrashCleanupEvent[];
};

declare global {
  var __notificationStateStore: NotificationStateStore | undefined;
}

const getStore = (): NotificationStateStore => {
  if (!globalThis.__notificationStateStore) {
    globalThis.__notificationStateStore = {
      trashCleanupEvents: [],
    };
  }

  return globalThis.__notificationStateStore;
};

export const appendTrashCleanupEvent = ({
  deletedCount,
  skippedCount,
}: {
  deletedCount: number;
  skippedCount: number;
}) => {
  const store = getStore();

  if (deletedCount <= 0) {
    return null;
  }

  const event: TrashCleanupEvent = {
    id: `trash_cleanup:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    deletedCount,
    skippedCount,
    createdAt: new Date().toISOString(),
  };

  store.trashCleanupEvents.unshift(event);

  // Keep only recent events to prevent unbounded memory usage.
  if (store.trashCleanupEvents.length > 100) {
    store.trashCleanupEvents = store.trashCleanupEvents.slice(0, 100);
  }

  return event;
};

export const getTrashCleanupEvents = (limit = 20): TrashCleanupEvent[] => {
  return getStore().trashCleanupEvents.slice(0, limit);
};
