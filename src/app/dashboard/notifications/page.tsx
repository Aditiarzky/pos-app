"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  CircleAlert,
  Loader2,
  PackageSearch,
  Trash2,
  TriangleAlert,
  CreditCard,
  HandCoins,
  History,
  ShieldAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useClearReadNotifications,
  useMarkNotificationsAsRead,
  useNotifications,
} from "@/hooks/notifications/use-notifications";
import { NotificationItem } from "@/services/notificationService";
import { RoleGuard } from "@/components/role-guard";
import { AccessDenied } from "@/components/access-denied";
import { useQueryState } from "@/hooks/use-query-state";
import { useAuth } from "@/hooks/use-auth";

const FILTERS = [
  { value: "all", label: "Semua" },
  { value: "unread", label: "Belum Dibaca" },
  { value: "stock", label: "Stok" },
  { value: "finance", label: "Keuangan" },
  { value: "payment", label: "Pembayaran" },
  { value: "trash", label: "Tempat Sampah" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

const PAGE_SIZE = 20;

const isNotificationRead = (notification: NotificationItem) =>
  notification.isRead ?? notification.read;

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getDateKey = (value: string) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTimelineLabel = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const targetDate = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffInDays = Math.floor(
    (today.getTime() - targetDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (diffInDays === 0) return "Hari ini";
  if (diffInDays === 1) return "Kemarin";
  if (diffInDays > 1 && diffInDays < 7) {
    return targetDate.toLocaleDateString("id-ID", { weekday: "long" });
  }

  return targetDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getPriorityLabel = (priority?: number) => {
  if ((priority || 0) >= 300) return "Tinggi";
  if ((priority || 0) >= 200) return "Sedang";
  return "Rendah";
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case "stock": return "Stok";
    case "finance": return "Keuangan";
    case "payment": return "Pembayaran";
    case "trash": return "Sampah";
    case "system": return "Sistem";
    default: return category;
  }
};

const getSeverityBadgeClass = (severity: NotificationItem["severity"]) => {
  if (severity === "critical") return "bg-destructive text-white border-transparent";
  if (severity === "warning") return "bg-amber-500/15 text-amber-700 border-amber-300";
  return "bg-blue-500/15 text-blue-700 border-blue-300";
};

const getNotificationIcon = (notification: NotificationItem) => {
  if (notification.type === "low_stock") return <TriangleAlert className="h-4 w-4 text-amber-500" />;
  if (notification.type === "restock") return <PackageSearch className="h-4 w-4 text-blue-500" />;
  if (notification.type === "debt_overdue") return <HandCoins className="h-4 w-4 text-rose-500" />;
  if (notification.type === "qris_pending") return <CreditCard className="h-4 w-4 text-indigo-500" />;
  if (notification.category === "trash") return <Trash2 className="h-4 w-4 text-emerald-500" />;
  return <Bell className="h-4 w-4 text-muted-foreground" />;
};

const matchesFilter = (notification: NotificationItem, filter: FilterValue) => {
  if (filter === "all") return true;
  if (filter === "unread") return !isNotificationRead(notification);
  return notification.category === filter;
};

function NotificationsContent() {
  const { roles } = useAuth();
  const userRoles = roles as string[];
  const isSystemAdmin = userRoles.includes("admin sistem");

  const [filter, setFilter] = useQueryState<FilterValue>("filter", "all");
  const [page, setPage] = useQueryState<number>("page", 1);
  const [sortBy, setSortBy] = useState<"time" | "priority">("time");

  const notificationsQuery = useNotifications({
    params: { limit: 200 },
  });
  const markManyAsReadMutation = useMarkNotificationsAsRead();
  const clearReadMutation = useClearReadNotifications();

  const notifications = useMemo(
    () => notificationsQuery.data?.data?.items || [],
    [notificationsQuery.data],
  );

  const unreadCount = notificationsQuery.data?.data?.unreadCount || 0;

  const filteredNotifications = useMemo(() => {
    let result = notifications.filter((notification) => matchesFilter(notification, filter));

    if (sortBy === "priority") {
      result = [...result].sort((a, b) => {
        if (b.priority !== a.priority) return b.priority! - a.priority!;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      result = [...result].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [notifications, filter, sortBy]);

  const visibleCount = page * PAGE_SIZE;
  const visibleNotifications = filteredNotifications.slice(0, visibleCount);
  const groupedVisibleNotifications = useMemo(() => {
    const groupedMap = new Map<string, NotificationItem[]>();

    for (const notification of visibleNotifications) {
      const dateKey = getDateKey(notification.createdAt);
      const existing = groupedMap.get(dateKey) || [];
      existing.push(notification);
      groupedMap.set(dateKey, existing);
    }

    return Array.from(groupedMap.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, items]) => ({
        dateKey,
        label: getTimelineLabel(dateKey),
        items,
      }));
  }, [visibleNotifications]);

  return (
    <>
      <header className="sticky top-6 mx-auto container z-10 flex sm:flex-row flex-col px-4 sm:px-6 justify-between w-full items-center gap-4 pb-16">
        <div className="flex items-center gap-4">
          <div className="h-12 w-1.5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
          <div className="flex flex-col">
            <h1 className="text-3xl text-primary font-bold tracking-tight">
              Notifikasi
            </h1>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-80">
              Pusat Pemberitahuan • Operasional Toko
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Badge variant="outline">{notifications.length} Total</Badge>
          <Badge className="bg-primary">{unreadCount} Belum Dibaca</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              markManyAsReadMutation.mutate(notifications.map((n) => n.id))
            }
            disabled={notifications.length === 0 || markManyAsReadMutation.isPending}
            aria-label="Tandai semua notifikasi sebagai dibaca"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            {markManyAsReadMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <span className="sm:hidden">Dibaca</span>
            <span className="hidden sm:inline">Tandai Semua Dibaca</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => clearReadMutation.mutate(undefined)}
            disabled={clearReadMutation.isPending}
            aria-label="Bersihkan riwayat notifikasi yang sudah dibaca"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {clearReadMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <span className="sm:hidden">Bersihkan</span>
            <span className="hidden sm:inline">Bersihkan Riwayat</span>
          </Button>
        </div>
      </header>

      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.filter(f => isSystemAdmin || f.value !== "trash").map((item) => (
              <Button
                key={item.value}
                type="button"
                variant={item.value === filter ? "default" : "outline"}
                size="sm"
                className="rounded-full px-4 "
                onClick={() => {
                  setFilter(item.value);
                  setPage(1);
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg self-start">
            <Button
              variant={sortBy === "time" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setSortBy("time")}
            >
              <History className="h-3.5 w-3.5" />
              Terkini
            </Button>
            <Button
              variant={sortBy === "priority" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setSortBy("priority")}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Prioritas
            </Button>
          </div>
        </div>

        {notificationsQuery.isLoading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          </div>
        ) : notificationsQuery.isError ? (
          <div className="p-8 text-sm text-destructive text-center card border-destructive/20 bg-destructive/5 rounded-xl">
            Gagal memuat notifikasi. Silakan coba lagi nanti.
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border-dashed text-muted-foreground min-h-[280px] rounded-3xl border-2">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 opacity-20" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              Tidak ada notifikasi
            </h3>
            <p className="text-sm max-w-xs mx-auto">
              {filter === "all"
                ? "Semua notifikasi sudah dibersihkan."
                : "Tidak ada notifikasi untuk kategori ini."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedVisibleNotifications.map((group) => (
              <section key={group.dateKey} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground capitalize">
                      {group.label}
                    </h3>
                    <Badge variant="outline" className="text-[10px]">
                      {group.items.length}
                    </Badge>
                  </div>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {group.items.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`relative p-0 overflow-hidden transition-all duration-200 hover:shadow-md ${isNotificationRead(notification)
                      ? "opacity-80"
                      : "border-l-4 border-l-primary bg-primary/5 shadow-sm ring-1 ring-primary/10"
                      }`}
                  >
                    <div className="p-3 sm:p-4">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 flex-shrink-0 flex items-center justify-center rounded-full border bg-background h-9 w-9 shadow-sm ${!isNotificationRead(notification) ? 'border-primary/20' : ''}`}>
                          {getNotificationIcon(notification)}
                        </div>

                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="capitalize font-medium text-[10px]">
                              {getCategoryLabel(notification.category)}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`${getSeverityBadgeClass(notification.severity)} text-[10px] font-bold uppercase tracking-tight`}
                            >
                              {notification.severity === 'critical' ? 'Kritis' : notification.severity === 'warning' ? 'Peringatan' : 'Info'}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] bg-muted/50">
                              {getPriorityLabel(notification.priority)}
                            </Badge>
                          </div>

                          <p className={`text-sm sm:text-base leading-relaxed ${!isNotificationRead(notification) ? 'font-semibold' : 'text-muted-foreground'}`}>
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between gap-4 pt-1">
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <History className="h-3 w-3" />
                              {formatDateTime(notification.createdAt)}
                            </p>

                            {notification.action?.href && (
                              <Link
                                href={notification.action.href}
                                className="text-xs font-bold text-primary flex items-center gap-1.5 hover:underline py-1 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                              >
                                {notification.action.label}
                                <CircleAlert className="h-3.5 w-3.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </section>
            ))}

            {visibleCount < filteredNotifications.length && (
              <div className="flex justify-center pt-6">
                <Button
                  variant="outline"
                  className="rounded-full px-8 border-primary/20 text-primary hover:bg-primary/5"
                  onClick={() => setPage(page + 1)}
                >
                  Tampilkan Lebih Banyak
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

export default function NotificationsPage() {
  return (
    <RoleGuard
      allowedRoles={["admin toko", "admin sistem"]}
      fallback={<AccessDenied />}
    >
      <NotificationsContent />
    </RoleGuard>
  );
}
