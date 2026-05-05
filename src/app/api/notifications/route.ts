import { NextRequest, NextResponse } from "next/server";
import {
  and,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  not,
  or,
  sql,
} from "drizzle-orm";
import {
  customers,
  debts,
  products,
  productVariants,
  purchaseOrders,
  saleItems,
  sales,
  stockMutations,
  units,
} from "@/drizzle/schema";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";
import { verifySession } from "@/lib/auth";
import { getTrashCleanupEvents } from "./_lib/notification-store";
import { getNotificationStateMap } from "./_lib/notification-state-db";
import {
  applyNotificationState,
  buildExpiredTrashId,
  buildLowStockId,
  buildRestockId,
  deduplicateRestockSignals,
  mapRestockSeverity,
  NotificationAction,
  NotificationSeverity,
  NotificationType,
  PRIORITY_BY_SEVERITY,
  resolveStableTrashCreatedAt,
} from "./_lib/notification-logic";
import {
  runTrashCleanup,
  shouldRunAutoCleanupDB,
  getTrashSettings,
} from "../trash/_lib/cleanup-logic";

type NotificationCategory =
  | "system"
  | "stock"
  | "trash"
  | "finance"
  | "payment";

type NotificationItem = {
  id: string;
  key: string;
  groupKey: string;
  priority: number;
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
    intent?: NotificationAction["intent"];
  };
  metadata?: Record<string, string | number | null>;
};

const LOW_STOCK_FACTOR = 1.2;
const MAX_LOW_STOCK_ITEMS = 20;
const MAX_RESTOCK_ITEMS_PER_PERIOD = 8;
const RESTOCK_TARGET_DAYS = 14;

const toIsoDate = (value: Date | string | null | undefined): string => {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  let dateStr: string = value;
  if (
    !dateStr.includes("Z") &&
    !dateStr.includes("+") &&
    !/-\d{2}:\d{2}$/.test(dateStr)
  ) {
    dateStr = dateStr.replace(" ", "T") + "Z";
  }
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
};

const normalizeLimit = (value: string | null, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : Math.min(parsed, 200);
};

const formatQty = (value: string | number | null | undefined): string => {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "0";
  return Number.isInteger(numeric)
    ? String(numeric)
    : String(Number(numeric.toFixed(3)));
};

async function getLowStockNotifications(): Promise<NotificationItem[]> {
  const rows = await db
    .select({
      productId: products.id,
      productName: products.name,
      sku: products.sku,
      stock: products.stock,
      minStock: products.minStock,
      updatedAt: products.updatedAt,
      lastStockActivityAt: sql<string>`max(${stockMutations.createdAt})`,
      baseUnitName: units.name,
    })
    .from(products)
    .innerJoin(units, eq(units.id, products.baseUnitId))
    .leftJoin(stockMutations, eq(stockMutations.productId, products.id))
    .where(
      and(
        eq(products.isActive, true),
        isNull(products.deletedAt),
        sql`${products.minStock} > 0`,
        sql`${products.stock} <= ${products.minStock} * ${LOW_STOCK_FACTOR}`,
      ),
    )
    .groupBy(
      products.id,
      products.name,
      products.sku,
      products.stock,
      products.minStock,
      products.updatedAt,
      units.name,
    )
    .orderBy(sql`${products.stock} / nullif(${products.minStock}, 0) asc`)
    .limit(MAX_LOW_STOCK_ITEMS);

  return rows.map((row): NotificationItem => {
    const severity: NotificationSeverity =
      Number(row.stock || 0) <= Number(row.minStock || 0)
        ? "critical"
        : "warning";
    return {
      id: buildLowStockId(row.productId, new Date()),
      key: `LOW_STOCK:${row.productId}`,
      groupKey: `LOW_STOCK:${row.productId}`,
      priority: PRIORITY_BY_SEVERITY[severity],
      type: "low_stock",
      category: "stock",
      severity,
      createdAt: toIsoDate(row.lastStockActivityAt || row.updatedAt),
      isRead: false,
      read: false,
      message: `Stok produk "${row.productName}" hampir habis (${formatQty(row.stock)} ${row.baseUnitName} / min ${formatQty(row.minStock)} ${row.baseUnitName})`,
      action: {
        label: "Cek produk",
        href: `/dashboard/products?q=${encodeURIComponent(row.sku || "")}`,
        intent: "restock",
      },
      metadata: {
        productId: row.productId,
        productName: row.productName,
        sku: row.sku,
        currentStock: Number(row.stock),
        minStock: Number(row.minStock),
        unit: row.baseUnitName,
      },
    };
  });
}

type RestockSignal = {
  productId: number;
  productName: string;
  sku: string;
  remainingStock: number;
  minStock: number;
  periodDays: 7 | 30;
  qtySold: number;
  avgDailySales: number;
  estimatedDaysLeft: number | null;
  recommendedRestockQty: number;
  lastSaleAt: string;
  urgencyScore: number;
};

type PreferredRestockUnit = {
  unitName: string;
  conversionToBase: number;
};

async function getPreferredRestockUnitMap(
  productIds: number[],
): Promise<Map<number, PreferredRestockUnit>> {
  if (productIds.length === 0) return new Map();

  const rows = await db
    .select({
      productId: productVariants.productId,
      unitName: units.name,
      conversionToBase: productVariants.conversionToBase,
    })
    .from(productVariants)
    .innerJoin(units, eq(units.id, productVariants.unitId))
    .where(
      and(
        inArray(productVariants.productId, productIds),
        eq(productVariants.isActive, true),
        isNull(productVariants.deletedAt),
        eq(units.isActive, true),
        isNull(units.deletedAt),
      ),
    )
    .orderBy(
      productVariants.productId,
      desc(productVariants.conversionToBase),
      productVariants.id,
    );

  const result = new Map<number, PreferredRestockUnit>();
  for (const row of rows) {
    if (!result.has(row.productId)) {
      result.set(row.productId, {
        unitName: row.unitName || "unit",
        conversionToBase: Number(row.conversionToBase || 1),
      });
    }
  }

  return result;
}

async function getRestockNotifications(): Promise<NotificationItem[]> {
  const periods: Array<7 | 30> = [7, 30];
  const perPeriodSignals = await Promise.all(
    periods.map(async (periodDays: 7 | 30) => {
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
      const rows = await db
        .select({
          productId: products.id,
          productName: products.name,
          sku: products.sku,
          remainingStock: products.stock,
          minStock: products.minStock,
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
            sql`${products.minStock} > 0`,
          ),
        )
        .groupBy(
          products.id,
          products.name,
          products.stock,
          products.sku,
          products.minStock,
        )
        .orderBy(
          desc(sql`sum(${saleItems.qty} * ${saleItems.unitFactorAtSale})`),
        )
        .limit(MAX_RESTOCK_ITEMS_PER_PERIOD);

      return rows
        .map((row): RestockSignal | null => {
          const qtySold = Number(row.qtySold || 0);
          const remainingStock = Number(row.remainingStock || 0);
          const minStock = Number(row.minStock || 0);
          if (qtySold <= 0) return null;
          const avgDailySales = qtySold / periodDays;
          const estimatedDaysLeft =
            avgDailySales > 0
              ? Number((remainingStock / avgDailySales).toFixed(1))
              : null;
          const targetStockFromDemand = Math.ceil(
            avgDailySales * RESTOCK_TARGET_DAYS,
          );
          const targetStock = Math.max(targetStockFromDemand, minStock);
          const recommendedRestockQty = Math.max(
            targetStock - remainingStock,
            0,
          );
          const urgencyScore =
            estimatedDaysLeft === null
              ? 0
              : Number((1000 / Math.max(estimatedDaysLeft, 0.5)).toFixed(2));
          return {
            productId: row.productId,
            productName: row.productName,
            sku: row.sku || "",
            remainingStock,
            minStock,
            periodDays,
            qtySold,
            avgDailySales,
            estimatedDaysLeft,
            recommendedRestockQty,
            lastSaleAt: toIsoDate(row.lastSaleAt),
            urgencyScore,
          };
        })
        .filter(
          (item: RestockSignal | null): item is RestockSignal => item !== null,
        );
    }),
  );

  const deduplicatedSignals = deduplicateRestockSignals(
    perPeriodSignals.flat(),
  );
  const preferredUnitMap = await getPreferredRestockUnitMap(
    deduplicatedSignals.map((signal) => signal.productId),
  );
  return deduplicatedSignals
    .map((signal: RestockSignal): NotificationItem | null => {
      const preferredUnit = preferredUnitMap.get(signal.productId);
      const conversion = Math.max(
        1,
        Number(preferredUnit?.conversionToBase || 1),
      );
      const displayQty = Math.ceil(signal.recommendedRestockQty / conversion);
      if (signal.recommendedRestockQty <= 0 || displayQty <= 0) return null;

      const severity = mapRestockSeverity(signal.estimatedDaysLeft);
      const displayUnit = preferredUnit?.unitName || "unit";
      return {
        id: buildRestockId(
          signal.productId,
          signal.lastSaleAt,
          signal.qtySold,
          signal.periodDays,
        ),
        key: `RESTOCK_RECOMMENDATION:${signal.productId}`,
        groupKey: `RESTOCK_RECOMMENDATION:${signal.productId}`,
        priority: PRIORITY_BY_SEVERITY[severity],
        type: "restock",
        category: "stock",
        severity,
        read: false,
        isRead: false,
        createdAt: signal.lastSaleAt,
        message: `Produk "${signal.productName}" perlu restock (${signal.periodDays === 7 ? "7 hari" : "30 hari"}). Saran restock ±${displayQty} ${displayUnit}.`,
        action: {
          label: "Cek produk",
          href: `/dashboard/products?q=${encodeURIComponent(signal.sku)}`,
          intent: "restock",
        },
        metadata: {
          productId: signal.productId,
          productName: signal.productName,
          sku: signal.sku,
          periodDays: signal.periodDays,
          qtySold: signal.qtySold,
          remainingStock: signal.remainingStock,
          minStock: signal.minStock,
          estimatedDaysLeft: signal.estimatedDaysLeft,
          recommendedRestockQty: signal.recommendedRestockQty,
          recommendedRestockQtyDisplay: displayQty,
          recommendedRestockUnit: displayUnit,
        },
      };
    })
    .filter((item): item is NotificationItem => item !== null);
}

type SummaryRow = { total: number; oldestAt: string | null };

async function getExpiredTrashSummary(
  cutoffDate: Date,
): Promise<{ count: number; oldestAt: string }> {
  const [pRows, sRows, poRows, cRows] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)`,
        oldestAt: sql<string>`min(coalesce(${products.deletedAt}, ${products.updatedAt}))`,
      })
      .from(products)
      .where(
        sql`(${products.deletedAt} is not null or ${products.isActive} = false) and coalesce(${products.deletedAt}, ${products.updatedAt}) <= ${cutoffDate}`,
      ),
    db
      .select({
        total: sql<number>`count(*)`,
        oldestAt: sql<string>`min(coalesce(${sales.deletedAt}, ${sales.updatedAt}))`,
      })
      .from(sales)
      .where(
        sql`(${sales.deletedAt} is not null or ${sales.isArchived} = true) and coalesce(${sales.deletedAt}, ${sales.updatedAt}) <= ${cutoffDate}`,
      ),
    db
      .select({
        total: sql<number>`count(*)`,
        oldestAt: sql<string>`min(coalesce(${purchaseOrders.deletedAt}, ${purchaseOrders.updatedAt}))`,
      })
      .from(purchaseOrders)
      .where(
        sql`(${purchaseOrders.deletedAt} is not null or ${purchaseOrders.isArchived} = true) and coalesce(${purchaseOrders.deletedAt}, ${purchaseOrders.updatedAt}) <= ${cutoffDate}`,
      ),
    db
      .select({
        total: sql<number>`count(*)`,
        oldestAt: sql<string>`min(coalesce(${customers.deletedAt}, ${customers.updatedAt}))`,
      })
      .from(customers)
      .where(
        sql`(${customers.deletedAt} is not null or ${customers.isActive} = false) and coalesce(${customers.deletedAt}, ${customers.updatedAt}) <= ${cutoffDate}`,
      ),
  ]);

  const all: SummaryRow[] = [
    {
      total: Number(pRows[0]?.total || 0),
      oldestAt: pRows[0]?.oldestAt || null,
    },
    {
      total: Number(sRows[0]?.total || 0),
      oldestAt: sRows[0]?.oldestAt || null,
    },
    {
      total: Number(poRows[0]?.total || 0),
      oldestAt: poRows[0]?.oldestAt || null,
    },
    {
      total: Number(cRows[0]?.total || 0),
      oldestAt: cRows[0]?.oldestAt || null,
    },
  ];

  const count = all.reduce(
    (sum: number, r: SummaryRow): number => sum + r.total,
    0,
  );
  const oldestAt = all
    .map((r: SummaryRow): string | null => r.oldestAt)
    .filter((v: string | null): v is string => Boolean(v))
    .sort(
      (a: string, b: string): number =>
        new Date(a).getTime() - new Date(b).getTime(),
    )[0];

  return {
    count,
    oldestAt: resolveStableTrashCreatedAt(oldestAt || undefined, cutoffDate),
  };
}

async function getDebtNotifications(): Promise<NotificationItem[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      debtId: debts.id,
      customerId: debts.customerId,
      customerName: customers.name,
      remainingAmount: debts.remainingAmount,
      updatedAt: debts.updatedAt,
    })
    .from(debts)
    .innerJoin(customers, eq(customers.id, debts.customerId))
    .where(
      and(
        eq(debts.isActive, true),
        or(eq(debts.status, "unpaid"), eq(debts.status, "partial")),
        sql`${debts.remainingAmount} > 0`,
        sql`${debts.updatedAt} <= ${sevenDaysAgo}`,
      ),
    )
    .orderBy(desc(debts.remainingAmount))
    .limit(10);

  return rows.map(
    (row): NotificationItem => ({
      id: `debt_overdue:${row.debtId}`,
      key: `DEBT_OVERDUE:${row.debtId}`,
      groupKey: "DEBT_ALERTS",
      priority: PRIORITY_BY_SEVERITY.warning,
      type: "debt_overdue",
      category: "finance",
      severity: "warning",
      createdAt: toIsoDate(row.updatedAt),
      isRead: false,
      read: false,
      message: `Piutang "${row.customerName}" sebesar Rp${Number(row.remainingAmount).toLocaleString("id-ID")} belum ada angsuran selama 7 hari.`,
      action: {
        label: "Tagih piutang",
        href: `/dashboard/sales?tab=history-sales&customerId=${row.customerId}`,
        intent: "view",
      },
      metadata: {
        debtId: row.debtId,
        customerId: row.customerId,
        customerName: row.customerName,
        amount: Number(row.remainingAmount),
      },
    }),
  );
}

async function getQrisPendingNotifications(): Promise<NotificationItem[]> {
  const now = new Date();
  const rows = await db
    .select({
      id: sales.id,
      invoiceNumber: sales.invoiceNumber,
      totalPrice: sales.totalPrice,
      qrisExpiredAt: sales.qrisExpiredAt,
      createdAt: sales.createdAt,
    })
    .from(sales)
    .where(
      and(
        eq(sales.paymentMethod, "qris"),
        eq(sales.status, "pending_payment"),
        isNotNull(sales.qrisExpiredAt),
        gte(sales.qrisExpiredAt, now),
      ),
    )
    .orderBy(sales.qrisExpiredAt)
    .limit(5);
  return rows.map(
    (row): NotificationItem => ({
      id: `qris_pending:${row.id}`,
      key: `QRIS_PENDING:${row.id}`,
      groupKey: "PAYMENT_ALERTS",
      priority: PRIORITY_BY_SEVERITY.warning,
      type: "qris_pending",
      category: "payment",
      severity: "warning",
      createdAt: toIsoDate(row.createdAt),
      isRead: false,
      read: false,
      message: `QRIS ${row.invoiceNumber} (Rp${Number(row.totalPrice).toLocaleString("id-ID")}) menunggu pembayaran.`,
      action: {
        label: "Cek status",
        href: `/dashboard/sales?tab=history-sales&q=${encodeURIComponent(row.invoiceNumber || "")}`,
        intent: "view",
      },
      metadata: {
        saleId: row.id,
        invoiceNumber: row.invoiceNumber,
        expiredAt: toIsoDate(row.qrisExpiredAt),
      },
    }),
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session)
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );

    if (await shouldRunAutoCleanupDB()) {
      try {
        await runTrashCleanup();
      } catch (err: unknown) {
        console.error("Auto cleanup error:", err);
      }
    }

    const limit: number = normalizeLimit(
      request.nextUrl.searchParams.get("limit"),
      50,
    );
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      lowStock,
      restockRecs,
      expiredTrashSummary,
      settings,
      debtAlerts,
      qrisAlerts,
    ] = await Promise.all([
      getLowStockNotifications(),
      getRestockNotifications(),
      getExpiredTrashSummary(cutoffDate),
      getTrashSettings(),
      getDebtNotifications(),
      getQrisPendingNotifications(),
    ]);

    const cleanupEvents = getTrashCleanupEvents(20);
    const cleanupEventNotifications: NotificationItem[] = cleanupEvents
      .filter((e): boolean => Number(e.deletedCount || 0) > 0)
      .map(
        (e): NotificationItem => ({
          id: e.id,
          key: e.id.toUpperCase(),
          groupKey: "TRASH_CLEANUP:EVENTS",
          priority: PRIORITY_BY_SEVERITY.info,
          type: "trash_cleanup",
          category: "trash",
          severity: "info",
          message: `${e.deletedCount} data lama di trash berhasil dibersihkan`,
          createdAt: e.createdAt,
          isRead: false,
          read: false,
          action: {
            label: "Buka trash",
            href: "/dashboard/trash",
            intent: "cleanup",
          },
          metadata: {
            deletedCount: e.deletedCount,
            skippedCount: e.skippedCount,
          },
        }),
      );

    const expiredTrashNotification: NotificationItem[] =
      expiredTrashSummary.count > 0
        ? [
            {
              id: buildExpiredTrashId(
                expiredTrashSummary.count,
                expiredTrashSummary.oldestAt,
              ),
              key: "TRASH_CLEANUP:EXPIRED_ITEMS",
              groupKey: "TRASH_CLEANUP:EXPIRED_ITEMS",
              priority: PRIORITY_BY_SEVERITY.warning,
              type: "trash_cleanup",
              category: "trash",
              severity: "warning",
              message: `${expiredTrashSummary.count} data di trash sudah > 30 hari dan perlu dibersihkan`,
              createdAt: toIsoDate(settings.lastCleanupAt || new Date()),
              isRead: false,
              read: false,
              action: {
                label: "Bersihkan trash",
                href: "/dashboard/trash",
                intent: "cleanup",
              },
              metadata: { expiredCount: expiredTrashSummary.count },
            },
          ]
        : [];

    const allRaw: NotificationItem[] = [
      ...lowStock,
      ...restockRecs,
      ...expiredTrashNotification,
      ...cleanupEventNotifications,
      ...debtAlerts,
      ...qrisAlerts,
    ];

    const userRoles = session.roles as string[];
    const isSystemAdmin = userRoles.includes("admin sistem");
    const isAdminToko = userRoles.includes("admin toko");

    const filteredRaw = allRaw.filter((item: NotificationItem): boolean => {
      if (isSystemAdmin) return true;
      if (isAdminToko)
        return (
          item.category === "stock" ||
          item.category === "finance" ||
          item.category === "payment"
        );
      return false;
    });

    const uniqueRaw = Array.from(
      new Map(
        filteredRaw.map((i: NotificationItem): [string, NotificationItem] => [
          i.id,
          i,
        ]),
      ).values(),
    );
    const stateMap = await getNotificationStateMap(
      session.userId,
      uniqueRaw.map((i: NotificationItem): string => i.id),
    );

    const processed = uniqueRaw
      .map((item: NotificationItem) => applyNotificationState(item, stateMap))
      .filter(
        (item): item is NotificationItem & { isRead: boolean; read: boolean } =>
          item !== null,
      )
      .sort(
        (a, b): number =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return NextResponse.json({
      success: true,
      data: {
        items: processed.slice(0, limit),
        unreadCount: processed.filter((i): boolean => !i.isRead).length,
      },
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
