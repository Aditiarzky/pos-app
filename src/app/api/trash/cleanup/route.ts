import { NextResponse } from "next/server";
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
} from "@/drizzle/schema";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";
import { appendTrashCleanupEvent } from "@/app/api/notifications/_lib/notification-store";

type CleanupCandidate = {
  id: number;
  type: "product" | "sale" | "purchase" | "customer";
  name: string;
};

const TRASH_MAX_AGE_DAYS = 30;

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
) {
  if (candidate.type === "product") {
    await tx
      .delete(products)
      .where(
        and(
          eq(products.id, candidate.id),
          or(isNotNull(products.deletedAt), eq(products.isActive, false)),
        ),
      );
    return;
  }

  if (candidate.type === "customer") {
    await tx
      .delete(customers)
      .where(
        and(
          eq(customers.id, candidate.id),
          or(isNotNull(customers.deletedAt), eq(customers.isActive, false)),
        ),
      );
    return;
  }

  if (candidate.type === "sale") {
    await tx
      .delete(sales)
      .where(
        and(
          eq(sales.id, candidate.id),
          or(eq(sales.isArchived, true), isNotNull(sales.deletedAt)),
        ),
      );
    return;
  }

  await tx
    .delete(purchaseOrders)
    .where(
      and(
        eq(purchaseOrders.id, candidate.id),
        or(eq(purchaseOrders.isArchived, true), isNotNull(purchaseOrders.deletedAt)),
      ),
    );
}

export async function POST() {
  try {
    const cutoff = new Date(Date.now() - TRASH_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

    const [productRows, saleRows, purchaseRows, customerRows] = await Promise.all([
      db
        .select({ id: products.id, name: products.name })
        .from(products)
        .where(
          sql`(${products.deletedAt} is not null or ${products.isActive} = false) and coalesce(${products.deletedAt}, ${products.updatedAt}) <= ${cutoff}`,
        ),
      db
        .select({ id: sales.id, name: sales.invoiceNumber })
        .from(sales)
        .where(
          sql`(${sales.deletedAt} is not null or ${sales.isArchived} = true) and coalesce(${sales.deletedAt}, ${sales.updatedAt}) <= ${cutoff}`,
        ),
      db
        .select({ id: purchaseOrders.id, name: purchaseOrders.orderNumber })
        .from(purchaseOrders)
        .where(
          sql`(${purchaseOrders.deletedAt} is not null or ${purchaseOrders.isArchived} = true) and coalesce(${purchaseOrders.deletedAt}, ${purchaseOrders.updatedAt}) <= ${cutoff}`,
        ),
      db
        .select({ id: customers.id, name: customers.name })
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
      })),
      ...saleRows.map((row) => ({
        id: row.id,
        type: "sale" as const,
        name: row.name,
      })),
      ...purchaseRows.map((row) => ({
        id: row.id,
        type: "purchase" as const,
        name: row.name || `PO-${row.id}`,
      })),
      ...customerRows.map((row) => ({
        id: row.id,
        type: "customer" as const,
        name: row.name,
      })),
    ];

    const deletableCandidates: CleanupCandidate[] = [];
    const skippedCandidates: CleanupCandidate[] = [];

    for (const candidate of candidates) {
      if (await canDelete(candidate)) {
        deletableCandidates.push(candidate);
      } else {
        skippedCandidates.push(candidate);
      }
    }

    if (deletableCandidates.length > 0) {
      await db.transaction(async (tx) => {
        for (const candidate of deletableCandidates) {
          await deleteCandidate(tx, candidate);
        }
      });
    }

    appendTrashCleanupEvent({
      deletedCount: deletableCandidates.length,
      skippedCount: skippedCandidates.length,
    });

    return NextResponse.json({
      success: true,
      message:
        deletableCandidates.length > 0
          ? `${deletableCandidates.length} data lama berhasil dibersihkan`
          : "Tidak ada data lama yang bisa dibersihkan",
      data: {
        processedCount: candidates.length,
        deletedCount: deletableCandidates.length,
        skippedCount: skippedCandidates.length,
        deleted: deletableCandidates,
        skipped: skippedCandidates,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
