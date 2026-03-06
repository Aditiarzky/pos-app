"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Check,
  Loader2,
  PackageSearch,
  Trash2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useClearReadNotifications,
  useMarkNotificationsAsRead,
  useNotifications,
} from "@/hooks/notifications/use-notifications";
import { NotificationItem } from "@/services/notificationService";

const POPOVER_MAX_ITEMS = 8;

const getNotificationIcon = (notification: NotificationItem) => {
  if (notification.type === "low_stock") {
    return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  }

  if (notification.type === "restock") {
    return <PackageSearch className="h-4 w-4 text-blue-500" />;
  }

  if (notification.type === "trash_cleanup") {
    return <Trash2 className="h-4 w-4 text-emerald-500" />;
  }

  return <Bell className="h-4 w-4 text-muted-foreground" />;
};

const getSeverityBadge = (severity: NotificationItem["severity"]) => {
  if (severity === "critical") {
    return <Badge className="bg-destructive text-white">Critical</Badge>;
  }

  if (severity === "warning") {
    return <Badge variant="outline">Warning</Badge>;
  }

  return <Badge variant="secondary">Info</Badge>;
};

const formatTimeAgo = (createdAt: string) => {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));

  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
};

export function NotificationPanel() {
  const [isOpen, setIsOpen] = React.useState(false);
  const notificationsQuery = useNotifications({
    params: { limit: 60 },
  });
  const markManyAsReadMutation = useMarkNotificationsAsRead();
  const clearReadMutation = useClearReadNotifications();

  const notifications = notificationsQuery.data?.data?.notifications || [];
  const unreadCount = notificationsQuery.data?.data?.unreadCount || 0;

  const latestNotifications = notifications.slice(0, POPOVER_MAX_ITEMS);

  const handleMarkVisibleAsRead = async () => {
    const unreadIds = latestNotifications
      .filter((notification) => !notification.read)
      .map((notification) => notification.id);

    if (!unreadIds.length) return;

    await markManyAsReadMutation.mutateAsync(unreadIds);
  };

  const handleClearRead = async () => {
    await clearReadMutation.mutateAsync(undefined);
  };

  React.useEffect(() => {
    if (isOpen) {
      notificationsQuery.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-white text-[10px] font-semibold flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Notifikasi</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount} unread dari {notifications.length} notifikasi
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={handleMarkVisibleAsRead}
              disabled={markManyAsReadMutation.isPending || unreadCount === 0}
            >
              {markManyAsReadMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span className="ml-1">Mark Read</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={handleClearRead}
              disabled={clearReadMutation.isPending}
            >
              {clearReadMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Clear Read
            </Button>
          </div>
        </div>

        <div className="max-h-[380px] overflow-y-auto">
          {notificationsQuery.isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Memuat notifikasi...</div>
          ) : notificationsQuery.isError ? (
            <div className="p-4 text-sm text-destructive">Gagal memuat notifikasi</div>
          ) : latestNotifications.length === 0 ? (
            <div className="p-6 text-sm text-center text-muted-foreground">
              Belum ada notifikasi operasional.
            </div>
          ) : (
            <div className="divide-y">
              {latestNotifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    if (notification.read) return;
                    markManyAsReadMutation.mutate([notification.id]);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getNotificationIcon(notification)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(notification.severity)}
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>

                      <p className="text-sm mt-1 leading-snug">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-3">
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/notifications">Lihat semua notifikasi</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
