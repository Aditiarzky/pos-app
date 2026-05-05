import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productAuditLogs, users } from "@/drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { verifySession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { parsePagination, formatMeta } from "@/lib/query-helper";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await params;
    const idNum = Number(productId);
    const { page, limit, offset } = parsePagination(request);

    const [logs, totalRes] = await Promise.all([
      db
        .select({
          id: productAuditLogs.id,
          productId: productAuditLogs.productId,
          action: productAuditLogs.action,
          changes: productAuditLogs.changes,
          snapshot: productAuditLogs.snapshot,
          createdAt: productAuditLogs.createdAt,
          userName: users.name,
          userId: productAuditLogs.userId,
        })
        .from(productAuditLogs)
        .leftJoin(users, eq(productAuditLogs.userId, users.id))
        .where(eq(productAuditLogs.productId, idNum))
        .orderBy(desc(productAuditLogs.createdAt))
        .limit(limit)
        .offset(offset),

      db
        .select({ count: sql<number>`count(*)` })
        .from(productAuditLogs)
        .where(eq(productAuditLogs.productId, idNum)),
    ]);

    const total = Number(totalRes[0]?.count ?? 0);

    return NextResponse.json({
      success: true,
      data: logs,
      meta: formatMeta(total, page, limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
