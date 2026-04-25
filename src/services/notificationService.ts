import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";

export type NotificationSeverity = "info" | "warning" | "critical";
export type NotificationCategory = "stock" | "trash" | "system" | "finance" | "payment";
export type NotificationType = "low_stock" | "restock" | "trash_cleanup" | "debt_overdue" | "qris_pending";
export type NotificationActionIntent = "view" | "restock" | "cleanup";

export type NotificationItem = {
  id: string;
  key?: string;
  groupKey?: string;
  priority?: number;
  type: NotificationType;
  category: NotificationCategory;
  severity: NotificationSeverity;
  message: string;
  createdAt: string;
  isRead: boolean;
  read: boolean;
  action?: {
    label: string;
    href?: string;
    intent?: NotificationActionIntent;
  };
  metadata?: Record<string, string | number | null>;
};

export type LowStockNotification = {
  id: string;
  type: "low_stock";
  category: "stock";
  severity: NotificationSeverity;
  message: string;
  createdAt: string;
  read: boolean;
  metadata?: {
    productId: number;
    productName: string;
    variant: string;
    currentStock: number;
    minStock: number;
  };
};

export type RestockRecommendation = {
  id: string;
  type: "restock";
  category: "stock";
  severity: NotificationSeverity;
  message: string;
  createdAt: string;
  read: boolean;
  metadata?: {
    productId: number;
    productName: string;
    periodDays: number;
    qtySold: number;
    remainingStock: number;
    estimatedDaysLeft: number | null;
  };
};

export type NotificationsResponse = {
  items: NotificationItem[];
  lowStock: LowStockNotification[];
  restockRecommendations: RestockRecommendation[];
  trashCleanupInfo: {
    expiredCount: number;
  };
  notifications: NotificationItem[];
  unreadCount: number;
};

export const getNotifications = async (params?: { limit?: number }) => {
  const response = await axiosInstance.get<ApiResponse<NotificationsResponse>>(
    "/notifications",
    { params },
  );

  const payload = response.data.data;
  if (payload?.items && !payload.notifications) {
    payload.notifications = payload.items;
  }

  return response.data;
};

export const markNotificationAsRead = async (id: string) => {
  const notificationId = id.trim();
  if (!notificationId) {
    throw new Error("Notification id wajib diisi");
  }

  const response = await axiosInstance.patch<ApiResponse<{ count: number }>>(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
  );

  return response.data;
};

export const markNotificationsAsRead = async (ids: string[]) => {
  const response = await axiosInstance.post<ApiResponse<{ count: number }>>(
    "/notifications/read",
    { ids },
  );

  return response.data;
};

export const clearReadNotifications = async (ids?: string[]) => {
  const response = await axiosInstance.post<ApiResponse<{ count: number }>>(
    "/notifications/read/clear",
    ids && ids.length ? { ids } : {},
  );

  return response.data;
};

export const getLowStockNotifications = async () => {
  const response = await getNotifications();
  return response.data?.lowStock || [];
};

export const getRestockRecommendations = async () => {
  const response = await getNotifications();
  return response.data?.restockRecommendations || [];
};
