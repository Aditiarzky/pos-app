"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useClearReadNotifications,
  useMarkNotificationsAsRead,
  useNotifications,
} from "@/hooks/notifications/use-notifications";
import { NotificationItem } from "@/services/notificationService";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "system", label: "System" },
  { value: "stock", label: "Stock" },
  { value: "trash", label: "Trash" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

const PAGE_SIZE = 20;

const formatDateTime = (value: string) => {
  const date = new Date(value);

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const matchesFilter = (notification: NotificationItem, filter: FilterValue) => {
  if (filter === "all") return true;
  if (filter === "unread") return !notification.read;
  return notification.category === filter;
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const notificationsQuery = useNotifications({
    params: { limit: 200 },
  });
  const markManyAsReadMutation = useMarkNotificationsAsRead();
  const clearReadMutation = useClearReadNotifications();

  const notifications = useMemo(
    () => notificationsQuery.data?.data?.notifications || [],
    [notificationsQuery.data],
  );
  const unreadCount = notificationsQuery.data?.data?.unreadCount || 0;

  const filteredNotifications = useMemo(
    () => notifications.filter((notification) => matchesFilter(notification, filter)),
    [notifications, filter],
  );

  const visibleNotifications = filteredNotifications.slice(0, visibleCount);

  useEffect(() => {
    const unreadVisibleIds = filteredNotifications
      .slice(0, PAGE_SIZE)
      .filter((notification) => !notification.read)
      .map((notification) => notification.id);

    if (unreadVisibleIds.length === 0) {
      return;
    }

    // Only mutate if there are unread notifications to mark
    // Also, ensure the mutation isn't already pending to avoid duplicate calls on re-renders
    if (!markManyAsReadMutation.isPending) {
      markManyAsReadMutation.mutate(unreadVisibleIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsQuery.data, filter]); // Added filter as a dependency here to re-evaluate on filter change

  return (
    <>
      <header className="sticky top-6 mx-auto container z-10 flex flex-row px-4 justify-between w-full items-center gap-4 pb-16">
        <div className="overflow-hidden flex gap-2">
          <span className="w-2 bg-primary" />
          <div className="flex flex-col">
            <h1 className="text-2xl text-primary font-geist font-semibold truncate">
              Notifikasi
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitoring operasional stok, restock, dan trash cleanup
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge>{unreadCount} unread</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markManyAsReadMutation.mutate(notifications.map((n) => n.id))}
            disabled={notifications.length === 0 || markManyAsReadMutation.isPending}
          >
            {markManyAsReadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Mark all read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearReadMutation.mutate(undefined)} // Pass undefined to satisfy the expected argument type
            disabled={clearReadMutation.isPending}
          >
            {clearReadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Clear read
          </Button>
        </div>
      </header>

      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t">
        <Card className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant={item.value === filter ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilter(item.value);
                  setVisibleCount(PAGE_SIZE);
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {notificationsQuery.isLoading ? (
            <div className="p-8 text-sm text-muted-foreground">Memuat notifikasi...</div>
          ) : notificationsQuery.isError ? (
            <div className="p-8 text-sm text-destructive">Gagal memuat notifikasi</div>
          ) : visibleNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border-dashed text-muted-foreground min-h-[280px] rounded-md border">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 text-2xl">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-foreground">
                Tidak ada notifikasi
              </h3>
              <p className="text-sm max-w-xs mx-auto">
                Belum ada notifikasi yang cocok dengan filter saat ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleNotifications.map((notification) => (
                <Card key={notification.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={notification.read ? "secondary" : "default"}>
                          {notification.read ? "Read" : "Unread"}
                        </Badge>
                        <Badge variant="outline">{notification.category}</Badge>
                        <Badge variant="outline">{notification.severity}</Badge>
                      </div>

                      <p className="text-sm leading-snug">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}

              {visibleCount < filteredNotifications.length && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  >
                    Tampilkan lebih banyak
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
