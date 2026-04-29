export type NotificationSeverity = "info" | "warning" | "critical";

export type NotificationActionIntent = "view" | "restock" | "cleanup";

export type NotificationAction = {
  label: string;
  href?: string;
  intent?: NotificationActionIntent;
};

export type NotificationState = {
  readAt: Date | null;
  dismissedAt: Date | null;
  createdAt: Date;
};

export type NotificationType =
  | "low_stock"
  | "restock"
  | "trash_cleanup"
  | "debt_overdue"
  | "qris_pending";

export type NotificationBaseItem = {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  createdAt: string;
};

export const PRIORITY_BY_SEVERITY: Record<NotificationSeverity, number> = {
  critical: 300,
  warning: 200,
  info: 100,
};

export const toDateBucket = (value: Date) => value.toISOString().slice(0, 10);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const buildLowStockId = (productId: number, _date: Date) =>
  `low_stock:${productId}`;

export const buildExpiredTrashId = (count: number, oldestAt: string | null) => {
  if (!oldestAt) return "trash_cleanup:expired_items";
  // Format: trash_cleanup:expired_items:COUNT:DATE(YYYY-MM-DD)
  // Ini memastikan jika jumlah berubah atau item tertua berubah (misal ada yang baru expired), 
  // maka ID akan berubah dan notifikasi muncul sebagai 'baru/unread' lagi.
  const dateStr = oldestAt.split("T")[0];
  return `trash_cleanup:expired_items:${count}:${dateStr}`;
};

export const buildRestockId = (
  productId: number,
  lastSaleAt: string,
  qtySold: number,
  periodDays: 7 | 30,
) => {
  const date = new Date(lastSaleAt);
  const safeTimestamp = Number.isNaN(date.getTime())
    ? "unknown"
    : date.toISOString();
  return `restock:${productId}:${periodDays}:${qtySold}:${safeTimestamp}`;
};

export const mapRestockSeverity = (
  estimatedDaysLeft: number | null,
): NotificationSeverity => {
  if (estimatedDaysLeft !== null && estimatedDaysLeft <= 3) return "critical";
  if (estimatedDaysLeft !== null && estimatedDaysLeft <= 10) return "warning";
  return "info";
};

export const resolveStableTrashCreatedAt = (oldestAt: string | undefined, cutoffDate: Date) => {
  if (!oldestAt) return cutoffDate.toISOString();
  const parsed = new Date(oldestAt);
  if (Number.isNaN(parsed.getTime())) return cutoffDate.toISOString();
  return parsed.toISOString();
};

export type RestockSignal = {
  productId: number;
  urgencyScore: number;
};

export const deduplicateRestockSignals = <T extends RestockSignal>(signals: T[]) => {
  const map = new Map<number, T>();
  for (const signal of signals) {
    const existing = map.get(signal.productId);
    if (!existing || signal.urgencyScore > existing.urgencyScore) {
      map.set(signal.productId, signal);
    }
  }
  return Array.from(map.values());
};

export const sortNotificationsByPriority = <T extends { priority: number; createdAt: string }>(
  notifications: T[],
) =>
  [...notifications].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

export const applyNotificationState = <
  T extends NotificationBaseItem & Record<string, unknown>,
>(
  item: T,
  stateMap: Map<string, NotificationState>,
): (T & { isRead: boolean; read: boolean }) | null => {
  const state = stateMap.get(item.id);
  const notificationTime = Math.floor(new Date(item.createdAt).getTime() / 1000);
  const readTime = state?.readAt ? Math.floor(new Date(state.readAt).getTime() / 1000) : 0;
  const dismissedTime = state?.dismissedAt ? Math.floor(new Date(state.dismissedAt).getTime() / 1000) : 0;

  const isLowStock = item.type === "low_stock";
  const isRestock = item.type === "restock";
  const isComputedNotification = isLowStock || isRestock;
  const isDismissed = Boolean(state?.dismissedAt) && (
    isLowStock ? dismissedTime >= notificationTime : true
  );
  if (isDismissed) return null;

  const isRead = isComputedNotification
    ? isLowStock
      ? Boolean(state?.readAt) && readTime >= notificationTime
      : Boolean(state?.readAt)
    : Boolean(state?.readAt);

  return { 
    ...item, 
    isRead, 
    read: isRead,
  };
};
