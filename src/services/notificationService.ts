import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";

export type NotificationSeverity = "info" | "warning" | "critical";
export type NotificationCategory = "system" | "stock" | "trash";
export type NotificationType = "low_stock" | "restock" | "trash_cleanup";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  severity: NotificationSeverity;
  message: string;
  createdAt: string;
  read: boolean;
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

  return response.data;
};

export const markNotificationAsRead = async (id: string) => {
  const response = await axiosInstance.post<ApiResponse<{ count: number }>>(
    "/notifications/read",
    { id },
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
  const response = await axiosInstance.delete<ApiResponse<{ count: number }>>(
    "/notifications/clear",
    { data: ids && ids.length ? { ids } : undefined },
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
