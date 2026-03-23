import { taxConfigs } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { parsePagination, formatMeta } from "@/lib/query-helper";
import { validateTaxConfig } from "@/lib/validations/tax-config";
import { and, ilike, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// ── Helper: normalisasi pajak tetap ke periode laporan ────────────────────────
export const normalizeTaxToRange = (
  fixedAmount: number,
  period: string,
  rangeDays: number,
): number => {
  switch (period) {
    case "daily": return fixedAmount * rangeDays;
    case "weekly": return fixedAmount * (rangeDays / 7);
    case "monthly": return fixedAmount * (rangeDays / 30);
    case "yearly": return fixedAmount * (rangeDays / 365);
    case "one_time": return fixedAmount;
    default: return fixedAmount;
  }
};

/**
 * Hitung total pajak untuk suatu periode laporan.
 * Dipanggil dari reports/route.ts saat menghitung laba bersih.
 *
 * @param revenue     - Total pendapatan (omset) periode
 * @param grossProfit - Laba kotor periode
 * @param rangeDays   - Jumlah hari periode laporan
 */
export const calculateTotalTax = async (
  revenue: number,
  grossProfit: number,
  rangeDays: number,
  startDate: Date,
  endDate: Date,
): Promise<{
  totalTax: number;
  breakdown: Array<{ name: string; type: string; amount: number }>;
}> => {
  const activeTaxes = await db.query.taxConfigs.findMany({
    where: and(
      eq(taxConfigs.isActive, true),
      // effectiveFrom <= endDate laporan
      sql`${taxConfigs.effectiveFrom} <= ${endDate.toISOString().slice(0, 10)}`,
      // effectiveTo IS NULL atau effectiveTo >= startDate laporan
      sql`(${taxConfigs.effectiveTo} IS NULL OR ${taxConfigs.effectiveTo} >= ${startDate.toISOString().slice(0, 10)})`,
    ),
  });

  const breakdown: Array<{ name: string; type: string; amount: number }> = [];
  let totalTax = 0;

  for (const tax of activeTaxes) {
    let taxAmount = 0;

    if (tax.type === "percentage" && tax.rate != null) {
      const rate = Number(tax.rate);
      const basis = tax.appliesTo === "revenue" ? revenue : grossProfit;
      taxAmount = rate * basis;
    } else if (tax.type === "fixed" && tax.fixedAmount != null) {
      taxAmount = normalizeTaxToRange(
        Number(tax.fixedAmount),
        tax.period ?? "monthly",
        rangeDays,
      );
    }

    breakdown.push({ name: tax.name, type: tax.type, amount: taxAmount });
    totalTax += taxAmount;
  }

  return { totalTax, breakdown };
};

// ── GET /api/tax-configs

export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") ?? "";
    const type = searchParams.get("type");
    const appliesTo = searchParams.get("appliesTo");
    const isActive = searchParams.get("isActive");

    const filter = and(
      search ? ilike(taxConfigs.name, `%${search}%`) : undefined,
      type
        ? eq(taxConfigs.type, type as typeof taxConfigs.type.enumValues[number])
        : undefined,
      appliesTo
        ? eq(taxConfigs.appliesTo, appliesTo as typeof taxConfigs.appliesTo.enumValues[number])
        : undefined,
      isActive !== null && isActive !== undefined
        ? eq(taxConfigs.isActive, isActive === "true")
        : undefined,
    );

    const [data, totalRes] = await Promise.all([
      db.query.taxConfigs.findMany({
        where: filter,
        orderBy: [sql`${taxConfigs.isActive} desc`, sql`${taxConfigs.createdAt} desc`],
        limit: params.limit,
        offset: params.offset,
        with: {
          creator: { columns: { id: true, name: true } },
        },
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(taxConfigs)
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

// ── POST /api/tax-configs ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = validateTaxConfig(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { rate, fixedAmount, appliesTo, effectiveTo, notes, ...rest } = parsed.data;

    const [newTax] = await db
      .insert(taxConfigs)
      .values({
        ...rest,
        rate: rate != null ? rate.toFixed(4) : null,
        fixedAmount: fixedAmount != null ? fixedAmount.toFixed(2) : null,
        appliesTo: appliesTo ?? null,
        effectiveTo: effectiveTo ?? null,
        notes: notes ?? null,
      })
      .returning();

    return NextResponse.json({ success: true, data: newTax }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
