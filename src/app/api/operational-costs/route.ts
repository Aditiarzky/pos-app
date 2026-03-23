import { operationalCosts } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { parsePagination, formatMeta } from "@/lib/query-helper";
import { validateOperationalCost } from "@/lib/validations/operational-cost";
import { and, ilike, eq, desc, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// ── Helper: normalisasi amount ke periode laporan ─────────────────────────────
// Digunakan saat menghitung laba bersih di laporan
export const normalizeCostToRange = (
  amount: number,
  period: string,
  rangeDays: number,
): number => {
  switch (period) {
    case "daily":
      return amount * rangeDays;
    case "weekly":
      return amount * (rangeDays / 7);
    case "monthly":
      return amount * (rangeDays / 30);
    case "yearly":
      return amount * (rangeDays / 365);
    case "one_time":
      return amount;
    default:
      return amount;
  }
};

// GET /api/operational-costs
export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category");
    const period = searchParams.get("period");
    const isActive = searchParams.get("isActive");

    // Filter
    const filter = and(
      search ? ilike(operationalCosts.name, `%${search}%`) : undefined,
      category
        ? eq(operationalCosts.category, category as typeof operationalCosts.category._.data)
        : undefined,
      period
        ? eq(operationalCosts.period, period as typeof operationalCosts.period._.data)
        : undefined,
      isActive !== null && isActive !== undefined
        ? eq(operationalCosts.isActive, isActive === "true")
        : undefined,
    );

    const [data, totalRes] = await Promise.all([
      db.query.operationalCosts.findMany({
        where: filter,
        orderBy: [desc(operationalCosts.createdAt)],
        limit: params.limit,
        offset: params.offset,
        with: {
          creator: {
            columns: { id: true, name: true },
          },
        },
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(operationalCosts)
        .where(filter),
    ]);

    const totalCount = Number(totalRes[0]?.count ?? 0);

    return NextResponse.json({
      success: true,
      data,
      meta: formatMeta(totalCount, params.page, params.limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ── POST /api/operational-costs ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateOperationalCost(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.issues[0].message },
        { status: 400 },
      );
    }

    const { effectiveTo, notes, ...rest } = validated.data;

    const [newCost] = await db
      .insert(operationalCosts)
      .values({
        ...rest,
        amount: rest.amount.toFixed(2),
        effectiveTo: effectiveTo ?? null,
        notes: notes ?? null,
      })
      .returning();

    return NextResponse.json({ success: true, data: newCost }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
