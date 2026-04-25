import { and, eq, isNotNull, or, sql } from "drizzle-orm";
import {
  customers,
  debts,
  products,
  purchaseItems,
  purchaseOrders,
  saleItems,
  sales,
  stockMutations,
  trashSettings,
} from "@/drizzle/schema";
import { db } from "@/lib/db";
import { appendTrashCleanupEvent } from "@/app/api/notifications/_lib/notification-store";

export type CleanupCandidate = {
  id: number;
  type: "product" | "sale" | "purchase" | "customer";
  name: string;
  expiredAt: string;
};

export const TRASH_MAX_AGE_DAYS = 30;

export async function getTrashSettings() {
  const settings = await db.select().from(trashSettings).orderBy(trashSettings.id).limit(1);
  
  if (settings.length === 0) {
    const [newSettings] = await db
      .insert(trashSettings)
      .values({
        cleanupIntervalMinutes: 360,
      })
      .returning();
    return newSettings;
  }
  return settings[0];
}

export async function updateLastCheckTimestamp() {
  const settings = await getTrashSettings();
  await db
    .update(trashSettings)
    .set({ lastCheckAt: new Date() })
    .where(eq(trashSettings.id, settings.id));
}

export async function updateLastCleanupTimestamp() {
  const settings = await getTrashSettings();
  await db
    .update(trashSettings)
    .set({ lastCleanupAt: new Date() })
    .where(eq(trashSettings.id, settings.id));
}

export async function shouldRunAutoCleanupDB() {
  const settings = await getTrashSettings();
  // Gunakan lastCheckAt (waktu pengecekan terakhir) untuk throttling
  const referenceTime = settings.lastCheckAt || settings.lastCleanupAt;
  
  if (!referenceTime) return true;

  const now = Date.now();
  const lastRun = new Date(referenceTime).getTime();
  const intervalMs = settings.cleanupIntervalMinutes * 60 * 1000;

  const diff = now - lastRun;
  return diff >= intervalMs;
}

const hasProductDependency = async (productId: number) => {
  const [saleItemCount, purchaseItemCount, stockMutationCount] =
    await Promise.all([
      db
        .select({ total: sql<number>`count(*)` })
        .from(saleItems)
        .where(eq(saleItems.productId, productId)),
      db
        .select({ total: sql<number>`count(*)` })
        .from(purchaseItems)
        .where(eq(purchaseItems.productId, productId)),
      db
        .select({ total: sql<number>`count(*)` })
        .from(stockMutations)
        .where(eq(stockMutations.productId, productId)),
    ]);

  return (
    Number(saleItemCount[0]?.total || 0) > 0 ||
    Number(purchaseItemCount[0]?.total || 0) > 0 ||
    Number(stockMutationCount[0]?.total || 0) > 0
  );
};

const hasCustomerDependency = async (customerId: number) => {
  const [activeSalesCount, activeDebtCount] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)` })
      .from(sales)
      .where(
        and(
          eq(sales.customerId, customerId),
          eq(sales.isArchived, false),
          sql`${sales.deletedAt} is null`,
        ),
      ),
    db
      .select({ total: sql<number>`count(*)` })
      .from(debts)
      .where(
        and(
          eq(debts.customerId, customerId),
          eq(debts.isActive, true),
          sql`${debts.deletedAt} is null`,
        ),
      ),
  ]);

  return (
    Number(activeSalesCount[0]?.total || 0) > 0 ||
    Number(activeDebtCount[0]?.total || 0) > 0
  );
};

const hasSaleDependency = async (saleId: number) => {
  const [activeDebtCount] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)` })
      .from(debts)
      .where(
        and(
          eq(debts.saleId, saleId),
          eq(debts.isActive, true),
          sql`${debts.deletedAt} is null`,
        ),
      ),
  ]);

  return Number(activeDebtCount[0]?.total || 0) > 0;
};

async function canDelete(candidate: CleanupCandidate) {
  if (candidate.type === "product") {
    return !(await hasProductDependency(candidate.id));
  }

  if (candidate.type === "customer") {
    return !(await hasCustomerDependency(candidate.id));
  }

  if (candidate.type === "sale") {
    return !(await hasSaleDependency(candidate.id));
  }

  return true;
}

async function deleteCandidate(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  candidate: CleanupCandidate,
): Promise<boolean> {
  if (candidate.type === "product") {
    const deleted = await tx
      .delete(products)
      .where(
        and(
          eq(products.id, candidate.id),
          or(isNotNull(products.deletedAt), eq(products.isActive, false)),
        ),
      )
      .returning({ id: products.id });
    return deleted.length > 0;
  }

  if (candidate.type === "customer") {
    const deleted = await tx
      .delete(customers)
      .where(
        and(
          eq(customers.id, candidate.id),
          or(isNotNull(customers.deletedAt), eq(customers.isActive, false)),
        ),
      )
      .returning({ id: customers.id });
    return deleted.length > 0;
  }

  if (candidate.type === "sale") {
    const deleted = await tx
      .delete(sales)
      .where(
        and(
          eq(sales.id, candidate.id),
          or(eq(sales.isArchived, true), isNotNull(sales.deletedAt)),
        ),
      )
      .returning({ id: sales.id });
    return deleted.length > 0;
  }

  const deleted = await tx
    .delete(purchaseOrders)
    .where(
      and(
        eq(purchaseOrders.id, candidate.id),
        or(eq(purchaseOrders.isArchived, true), isNotNull(purchaseOrders.deletedAt)),
      ),
    )
    .returning({ id: purchaseOrders.id });
  return deleted.length > 0;
}

export async function runTrashCleanup() {
  // Selalu perbarui waktu pengecekan (Check) agar interval ditaati
  await updateLastCheckTimestamp();

  const cutoff = new Date(Date.now() - TRASH_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

  const [productRows, saleRows, purchaseRows, customerRows] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        expiredAt: sql<string>`coalesce(${products.deletedAt}, ${products.updatedAt})`,
      })
      .from(products)
      .where(
        sql`(${products.deletedAt} is not null or ${products.isActive} = false) and coalesce(${products.deletedAt}, ${products.updatedAt}) <= ${cutoff}`,
      ),
    db
      .select({
        id: sales.id,
        name: sales.invoiceNumber,
        expiredAt: sql<string>`coalesce(${sales.deletedAt}, ${sales.updatedAt})`,
      })
      .from(sales)
      .where(
        sql`(${sales.deletedAt} is not null or ${sales.isArchived} = true) and coalesce(${sales.deletedAt}, ${sales.updatedAt}) <= ${cutoff}`,
      ),
    db
      .select({
        id: purchaseOrders.id,
        name: purchaseOrders.orderNumber,
        expiredAt: sql<string>`coalesce(${purchaseOrders.deletedAt}, ${purchaseOrders.updatedAt})`,
      })
      .from(purchaseOrders)
      .where(
        sql`(${purchaseOrders.deletedAt} is not null or ${purchaseOrders.isArchived} = true) and coalesce(${purchaseOrders.deletedAt}, ${purchaseOrders.updatedAt}) <= ${cutoff}`,
      ),
    db
      .select({
        id: customers.id,
        name: customers.name,
        expiredAt: sql<string>`coalesce(${customers.deletedAt}, ${customers.updatedAt})`,
      })
      .from(customers)
      .where(
        sql`(${customers.deletedAt} is not null or ${customers.isActive} = false) and coalesce(${customers.deletedAt}, ${customers.updatedAt}) <= ${cutoff}`,
      ),
  ]);

  const candidates: CleanupCandidate[] = [
    ...productRows.map((row) => ({
      id: row.id,
      type: "product" as const,
      name: row.name,
      expiredAt: row.expiredAt,
    })),
    ...saleRows.map((row) => ({
      id: row.id,
      type: "sale" as const,
      name: row.name,
      expiredAt: row.expiredAt,
    })),
    ...purchaseRows.map((row) => ({
      id: row.id,
      type: "purchase" as const,
      name: row.name || `PO-${row.id}`,
      expiredAt: row.expiredAt,
    })),
    ...customerRows.map((row) => ({
      id: row.id,
      type: "customer" as const,
      name: row.name,
      expiredAt: row.expiredAt,
    })),
  ];

  const oldestExpiredAt =
    candidates
      .map((item) => item.expiredAt)
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] ?? null;

  const deletableCandidates: CleanupCandidate[] = [];
  const skippedCandidates: CleanupCandidate[] = [];

  for (const candidate of candidates) {
    if (await canDelete(candidate)) {
      deletableCandidates.push(candidate);
    } else {
      skippedCandidates.push(candidate);
    }
  }

  const deletedCandidates: CleanupCandidate[] =
    deletableCandidates.length > 0
      ? await db.transaction(async (tx) => {
        const deletedWithinTx: CleanupCandidate[] = [];

        for (const candidate of deletableCandidates) {
          const deleted = await deleteCandidate(tx, candidate);
          if (deleted) {
            deletedWithinTx.push(candidate);
          }
        }

        return deletedWithinTx;
      })
      : [];

  const deletedKeys = new Set(
    deletedCandidates.map((item) => `${item.type}:${item.id}`),
  );
  const staleCandidates = deletableCandidates.filter(
    (item) => !deletedKeys.has(`${item.type}:${item.id}`),
  );
  const finalSkippedCandidates = [...skippedCandidates, ...staleCandidates];

  const event = appendTrashCleanupEvent({
    deletedCount: deletedCandidates.length,
    skippedCount: finalSkippedCandidates.length,
    expiredCount: candidates.length,
    oldestExpiredAt,
  });

  // HANYA perbarui waktu Cleanup jika ada data yang berhasil dihapus
  if (deletedCandidates.length > 0) {
    await updateLastCleanupTimestamp();
  }

  return {
    processedCount: candidates.length,
    deletedCount: deletedCandidates.length,
    skippedCount: finalSkippedCandidates.length,
    deleted: deletedCandidates,
    skipped: finalSkippedCandidates,
    event,
  };
}
