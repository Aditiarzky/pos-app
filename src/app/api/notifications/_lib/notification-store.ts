type TrashCleanupEvent = {
  id: string;
  deletedCount: number;
  skippedCount: number;
  createdAt: string;
};

type NotificationStateStore = {
  readIds: Set<string>;
  dismissedIds: Set<string>;
  trashCleanupEvents: TrashCleanupEvent[];
};

declare global {
  // eslint-disable-next-line no-var
  var __notificationStateStore: NotificationStateStore | undefined;
}

const getStore = (): NotificationStateStore => {
  if (!globalThis.__notificationStateStore) {
    globalThis.__notificationStateStore = {
      readIds: new Set<string>(),
      dismissedIds: new Set<string>(),
      trashCleanupEvents: [],
    };
  }

  return globalThis.__notificationStateStore;
};

export const isNotificationRead = (id: string) => getStore().readIds.has(id);

export const isNotificationDismissed = (id: string) =>
  getStore().dismissedIds.has(id);

export const markNotificationsAsRead = (ids: string[]) => {
  const store = getStore();

  ids.forEach((id) => {
    if (id) {
      store.readIds.add(id);
    }
  });

  return ids.length;
};

export const clearReadNotifications = (ids?: string[]) => {
  const store = getStore();

  if (!ids || ids.length === 0) {
    const readIds = [...store.readIds];
    readIds.forEach((id) => {
      store.dismissedIds.add(id);
      store.readIds.delete(id);
    });

    return readIds.length;
  }

  let cleared = 0;
  ids.forEach((id) => {
    if (store.readIds.has(id)) {
      store.dismissedIds.add(id);
      store.readIds.delete(id);
      cleared += 1;
    }
  });

  return cleared;
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
