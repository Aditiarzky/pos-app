import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productAuditLogs, products, users } from "@/drizzle/schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { verifySession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { parsePagination, formatMeta } from "@/lib/query-helper";
import type { ProductAuditActionEnumType } from "@/drizzle/type";

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!session.roles.includes("admin sistem")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(request);

    const productIdParam = searchParams.get("productId");
    const userIdParam = searchParams.get("userId");
    const actionParam = searchParams.get("action");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const conditions = [];
    if (productIdParam) conditions.push(eq(productAuditLogs.productId, Number(productIdParam)));
    if (userIdParam) conditions.push(eq(productAuditLogs.userId, Number(userIdParam)));
    if (actionParam) conditions.push(eq(productAuditLogs.action, actionParam as ProductAuditActionEnumType));
    if (dateFrom) conditions.push(gte(productAuditLogs.createdAt, new Date(dateFrom)));
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      conditions.push(lte(productAuditLogs.createdAt, to));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [logs, totalRes] = await Promise.all([
      db
        .select({
          id: productAuditLogs.id,
          productId: productAuditLogs.productId,
          action: productAuditLogs.action,
          changes: productAuditLogs.changes,
          snapshot: productAuditLogs.snapshot,
          createdAt: productAuditLogs.createdAt,
          userId: productAuditLogs.userId,
          userName: users.name,
          productName: products.name,
          productSku: products.sku,
        })
        .from(productAuditLogs)
        .leftJoin(users, eq(productAuditLogs.userId, users.id))
        .leftJoin(products, eq(productAuditLogs.productId, products.id))
        .where(where)
        .orderBy(desc(productAuditLogs.createdAt))
        .limit(limit)
        .offset(offset),

      db
        .select({ count: sql<number>`count(*)` })
        .from(productAuditLogs)
        .where(where),
    ]);

    // For hard_delete rows where productId is null, use snapshot.name
    const enriched = logs.map((log) => ({
      ...log,
      productName:
        log.productName ??
        (log.snapshot as Record<string, unknown> | null)?.name ??
        null,
    }));

    const total = Number(totalRes[0]?.count ?? 0);

    return NextResponse.json({
      success: true,
      data: enriched,
      meta: formatMeta(total, page, limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
