import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, isNull, not, sql } from "drizzle-orm";
import {
  customers,
  products,
  purchaseOrders,
  saleItems,
  sales,
} from "@/drizzle/schema";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";
import { verifySession } from "@/lib/auth";
import {
  getTrashCleanupEvents,
} from "./_lib/notification-store";
import { getNotificationStateMap } from "./_lib/notification-state-db";

type NotificationSeverity = "info" | "warning" | "critical";
type NotificationCategory = "system" | "stock" | "trash";
type NotificationType = "low_stock" | "restock" | "trash_cleanup";

type NotificationItem = {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  severity: NotificationSeverity;
  message: string;
  createdAt: string;
  read: boolean;
  metadata?: Record<string, string | number | null>;
};

const LOW_STOCK_FACTOR = 1.2;
const MAX_LOW_STOCK_ITEMS = 20;
const MAX_RESTOCK_ITEMS_PER_PERIOD = 8;

const toIsoDate = (value: Date | string | null | undefined): string => {
  if (!value) {
    return new Date().toISOString();
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
};

const normalizeLimit = (value: string | null, fallback: number) => {
  if (!value) return fallback;

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;

  return Math.min(parsed, 200);
};

async function getLowStockNotifications(): Promise<NotificationItem[]> {
  const rows = await db
    .select({
      productId: products.id,
      productName: products.name,
      stock: products.stock,
      minStock: products.minStock,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        isNull(products.deletedAt),
        sql`${products.minStock} > 0`,
        sql`${products.stock} <= ${products.minStock} * ${LOW_STOCK_FACTOR}`,
      ),
    )
    .orderBy(sql`${products.stock} / nullif(${products.minStock}, 0) asc`)
    .limit(MAX_LOW_STOCK_ITEMS);

  return rows.map((row) => {
    const currentStock = Number(row.stock || 0);
    const minStock = Number(row.minStock || 0);

    return {
      id: `low_stock:${row.productId}`,
      type: "low_stock",
      category: "stock",
      severity: currentStock <= minStock ? "critical" : "warning",
      createdAt: toIsoDate(row.updatedAt),
      read: false,
      message: `Stok produk "${row.productName}" hampir habis (${currentStock} / min ${minStock})`,
      metadata: {
        productId: row.productId,
        productName: row.productName,
        variant: "Semua varian",
        currentStock,
        minStock,
      },
    };
  });
}

async function getRestockNotifications(periodDays: 7 | 30): Promise<NotificationItem[]> {
  const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      productId: products.id,
      productName: products.name,
      remainingStock: products.stock,
      qtySold: sql<string>`coalesce(sum(${saleItems.qty} * ${saleItems.unitFactorAtSale}), 0)`,
      lastSaleAt: sql<string>`max(${sales.createdAt})`,
    })
    .from(saleItems)
    .innerJoin(sales, eq(sales.id, saleItems.saleId))
    .innerJoin(products, eq(products.id, saleItems.productId))
    .where(
      and(
        gte(sales.createdAt, startDate),
        not(eq(sales.status, "cancelled")),
        not(eq(sales.status, "refunded")),
        not(sales.isArchived),
        eq(products.isActive, true),
        isNull(products.deletedAt),
      ),
    )
    .groupBy(products.id, products.name, products.stock)
    .orderBy(desc(sql`sum(${saleItems.qty} * ${saleItems.unitFactorAtSale})`))
    .limit(MAX_RESTOCK_ITEMS_PER_PERIOD);

  const periodLabel = periodDays === 7 ? "minggu ini" : "bulan ini";

  return rows
    .map((row): NotificationItem | null => { // Explicitly define the return type of the map callback
      const qtySold = Number(row.qtySold || 0);
      const remainingStock = Number(row.remainingStock || 0);

      if (qtySold <= 0) return null;

      const avgDailySales = qtySold / periodDays;
      const estimatedDaysLeft =
        avgDailySales > 0 ? Number((remainingStock / avgDailySales).toFixed(1)) : null;

      const notification: NotificationItem = { // Explicitly type the notification object
        id: `restock:${periodDays}:${row.productId}`,
        type: "restock",
        category: "stock",
        severity:
          estimatedDaysLeft !== null && estimatedDaysLeft <= Math.ceil(periodDays / 2)
            ? "warning"
            : "info",
        read: false,
        createdAt: toIsoDate(row.lastSaleAt),
        message: `Produk "${row.productName}" perlu restock ${periodLabel}`,
        metadata: {
          productId: row.productId,
          productName: row.productName,
          periodDays,
          qtySold,
          remainingStock,
          estimatedDaysLeft,
        },
      };
      return notification;
    })
    .filter((item): item is NotificationItem => item !== null); // This type guard correctly filters out nulls
}

async function getExpiredTrashCount(cutoffDate: Date) {
  const [productCount, saleCount, purchaseCount, customerCount] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)` })
      .from(products)
      .where(
        sql`(${products.deletedAt} is not null or ${products.isActive} = false) and coalesce(${products.deletedAt}, ${products.updatedAt}) <= ${cutoffDate}`,
      ),
    db
      .select({ total: sql<number>`count(*)` })
      .from(sales)
      .where(
        sql`(${sales.deletedAt} is not null or ${sales.isArchived} = true) and coalesce(${sales.deletedAt}, ${sales.updatedAt}) <= ${cutoffDate}`,
      ),
    db
      .select({ total: sql<number>`count(*)` })
      .from(purchaseOrders)
      .where(
        sql`(${purchaseOrders.deletedAt} is not null or ${purchaseOrders.isArchived} = true) and coalesce(${purchaseOrders.deletedAt}, ${purchaseOrders.updatedAt}) <= ${cutoffDate}`,
      ),
    db
      .select({ total: sql<number>`count(*)` })
      .from(customers)
      .where(
        sql`(${customers.deletedAt} is not null or ${customers.isActive} = false) and coalesce(${customers.deletedAt}, ${customers.updatedAt}) <= ${cutoffDate}`,
      ),
  ]);

  return (
    Number(productCount[0]?.total || 0) +
    Number(saleCount[0]?.total || 0) +
    Number(purchaseCount[0]?.total || 0) +
    Number(customerCount[0]?.total || 0)
  );
}

const applyNotificationState = (
  item: Omit<NotificationItem, "read">,
  stateMap: Map<string, { readAt: Date | null; dismissedAt: Date | null }>,
): NotificationItem | null => {
  const state = stateMap.get(item.id);

  if (state?.dismissedAt) {
    return null;
  }

  const notificationTime = new Date(item.createdAt).getTime();
  const readTime = state?.readAt ? new Date(state.readAt).getTime() : 0;

  // For low-stock, treat newer occurrences as unread again.
  // This lets a product become unread when it re-enters low-stock state
  // after being previously read.
  const isRead =
    item.type === "low_stock"
      ? Boolean(state?.readAt) && readTime >= notificationTime
      : Boolean(state?.readAt);

  return {
    ...item,
    read: isRead,
  };
};

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const limit = normalizeLimit(request.nextUrl.searchParams.get("limit"), 50);
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [lowStock, weeklyRestock, monthlyRestock, expiredTrashCount] =
      await Promise.all([
        getLowStockNotifications(),
        getRestockNotifications(7),
        getRestockNotifications(30),
        getExpiredTrashCount(cutoffDate),
      ]);

    const cleanupEventNotifications = getTrashCleanupEvents(20).map((event) => ({
      id: event.id,
      type: "trash_cleanup" as const,
      category: "trash" as const,
      severity: "info" as const,
      message: `${event.deletedCount} data lama di trash berhasil dibersihkan`,
      createdAt: event.createdAt,
      metadata: {
        deletedCount: event.deletedCount,
        skippedCount: event.skippedCount,
      },
    }));

    const expiredTrashNotification =
      expiredTrashCount > 0
        ? [
          {
            id: "trash_cleanup:expired_items",
            type: "trash_cleanup" as const,
            category: "trash" as const,
            severity: "warning" as const,
            message: `${expiredTrashCount} data di trash sudah lebih dari 30 hari dan perlu dibersihkan`,
            createdAt: new Date().toISOString(),
            metadata: {
              expiredCount: expiredTrashCount,
            },
          },
        ]
        : [];

    const allRawNotifications = [
      ...lowStock,
      ...weeklyRestock,
      ...monthlyRestock,
      ...expiredTrashNotification,
      ...cleanupEventNotifications,
    ];

    const stateMap = await getNotificationStateMap(
      session.userId,
      allRawNotifications.map((item) => item.id),
    );

    const allNotifications = allRawNotifications
      .map((item) => applyNotificationState(item, stateMap))
      .filter((item): item is NotificationItem => item !== null)
      .sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    const notifications = allNotifications.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        lowStock,
        restockRecommendations: [...weeklyRestock, ...monthlyRestock],
        trashCleanupInfo: {
          expiredCount: expiredTrashCount,
        },
        notifications,
        unreadCount: notifications.filter((item) => !item.read).length,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
