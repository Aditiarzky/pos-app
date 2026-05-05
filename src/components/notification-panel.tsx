"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  Loader2,
  PackageSearch,
  Trash2,
  TriangleAlert,
  CreditCard,
  HandCoins,
  History,
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
import { toast } from "sonner";

const POPOVER_MAX_ITEMS = 8;
const isNotificationRead = (notification: NotificationItem) =>
  notification.isRead ?? notification.read;

const getNotificationIcon = (notification: NotificationItem) => {
  if (notification.type === "low_stock") return <TriangleAlert className="h-4 w-4 text-amber-500" />;
  if (notification.type === "restock") return <PackageSearch className="h-4 w-4 text-blue-500" />;
  if (notification.type === "debt_overdue") return <HandCoins className="h-4 w-4 text-rose-500" />;
  if (notification.type === "qris_pending") return <CreditCard className="h-4 w-4 text-indigo-500" />;
  if (notification.category === "trash") return <Trash2 className="h-4 w-4 text-emerald-500" />;
  return <Bell className="h-4 w-4 text-muted-foreground" />;
};

const getSeverityBadge = (severity: NotificationItem["severity"]) => {
  if (severity === "critical") {
    return <Badge className="bg-destructive text-white text-[10px] px-1.5 py-2 h-4 uppercase">Kritis</Badge>;
  }
  if (severity === "warning") {
    return <Badge className="bg-amber-500/15 text-amber-700 border-amber-300 text-[10px] px-1.5 py-2 h-4 uppercase">Peringatan</Badge>;
  }
  return <Badge variant="secondary" className="text-[10px] px-1.5 py-2 h-4 uppercase">Info</Badge>;
};

const getTypeLabel = (notification: NotificationItem) => {
  switch (notification.type) {
    case "low_stock": return "Stok Rendah";
    case "restock": return "Restock";
    case "debt_overdue": return "Piutang";
    case "qris_pending": return "QRIS";
    case "trash_cleanup": return "Trash";
    default: return notification.category;
  }
};

const formatTimeAgo = (createdAt: string) => {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 10) return "Baru saja";
  if (seconds < 60) return `${seconds} detik lalu`;

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days <= 7) return `${days} hari lalu`;

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export function NotificationPanel() {
  const [isOpen, setIsOpen] = React.useState(false);
  const notificationsQuery = useNotifications({
    params: { limit: 60 },
  });
  const { refetch: refetchNotifications } = notificationsQuery;
  const markManyAsReadMutation = useMarkNotificationsAsRead();
  const clearReadMutation = useClearReadNotifications();

  const notifications = useMemo(
    () => notificationsQuery.data?.data?.items || [],
    [notificationsQuery.data]
  );

  const unreadCount = notificationsQuery.data?.data?.unreadCount || 0;
  const readCount = notifications.filter((item) => isNotificationRead(item)).length;

  // Panel selalu tampilkan berdasarkan waktu terbaru (createdAt)
  const latestNotifications = useMemo(() => {
    return [...notifications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, POPOVER_MAX_ITEMS);
  }, [notifications]);

  const handleMarkVisibleAsRead = async () => {
    const unreadIds = latestNotifications
      .filter((notification) => !isNotificationRead(notification))
      .map((notification) => notification.id);

    if (!unreadIds.length) return;

    try {
      await markManyAsReadMutation.mutateAsync(unreadIds);
      toast.success(`${unreadIds.length} notifikasi ditandai dibaca`);
    } catch {
      toast.error("Gagal memperbarui notifikasi");
    }
  };

  const handleClearRead = async () => {
    if (readCount === 0) return;
    try {
      const result = await clearReadMutation.mutateAsync(undefined);
      toast.success(result.message || "Riwayat notifikasi dibersihkan");
    } catch {
      toast.error("Gagal membersihkan riwayat");
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      void refetchNotifications();
    }

  }, [isOpen, refetchNotifications]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group hover:bg-primary/10 transition-colors rounded-full">
          <Bell className="w-5 h-5 group-hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-4.5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-background animate-in zoom-in">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[380px] p-0 shadow-2xl rounded-2xl overflow-hidden border-primary/10">
        <div className="bg-primary/5 border-b px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-sm text-primary">Notifikasi</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
              {unreadCount} Belum Dibaca
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] font-bold hover:bg-primary/10 hover:text-primary"
              onClick={handleMarkVisibleAsRead}
              disabled={markManyAsReadMutation.isPending || unreadCount === 0}
            >
              {markManyAsReadMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Check className="h-3 w-3 mr-1" />
              )}
              BACA SEMUA
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] font-bold text-destructive hover:bg-destructive/10"
              onClick={handleClearRead}
              disabled={clearReadMutation.isPending || readCount === 0}
            >
              BERSIHKAN
            </Button>
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {notificationsQuery.isLoading ? (
            <div className="p-8 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
              <p className="text-xs text-muted-foreground">Memuat...</p>
            </div>
          ) : notificationsQuery.isError ? (
            <div className="p-6 text-center text-xs text-destructive bg-destructive/5">
              Gagal memuat notifikasi.
            </div>
          ) : latestNotifications.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Bell className="h-6 w-6 opacity-20" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">Belum ada pemberitahuan.</p>
            </div>
          ) : (
            <div className="divide-y divide-primary/5">
              {latestNotifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`w-full text-left px-4 py-3.5 transition-all duration-200 ${!isNotificationRead(notification)
                    ? "bg-primary/[0.03] hover:bg-primary/[0.06]"
                    : "hover:bg-muted/50"
                    }`}
                  onClick={() => {
                    if (isNotificationRead(notification)) return;
                    markManyAsReadMutation.mutate([notification.id]);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 flex-shrink-0 flex items-center justify-center rounded-full border bg-background h-8 w-8 shadow-sm ${!isNotificationRead(notification) ? 'border-primary/20' : ''}`}>
                      {getNotificationIcon(notification)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          {getSeverityBadge(notification.severity)}
                          <span className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                            {getTypeLabel(notification)}
                          </span>
                        </div>
                        {!isNotificationRead(notification) && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </div>

                      <p className={`text-xs leading-snug ${!isNotificationRead(notification) ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between gap-2 mt-2">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <History className="h-2.5 w-3.5" />
                          {formatTimeAgo(notification.createdAt)}
                        </p>

                        {notification.action?.href ? (
                          <Link
                            href={notification.action.href}
                            className="text-[10px] font-bold text-primary hover:underline bg-primary/10 py-0.5 px-2 rounded-md"
                            onClick={(event) => event.stopPropagation()}
                          >
                            LIHAT
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-3 bg-muted/20">
          <Button asChild variant="outline" className="w-full h-9 rounded-xl border-primary/10 text-primary font-bold text-xs hover:bg-primary/5">
            <Link href="/dashboard/notifications">LIHAT SEMUA</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
