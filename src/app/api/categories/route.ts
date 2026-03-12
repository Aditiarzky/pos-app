import { categories, products } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateCategoryData } from "@/lib/validations/category";
import { and, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_ROLES = ["admin toko", "admin sistem"] as const;

const getUsageCount = sql<number>`count(${products.id})`;

function canAccessMasterData(session: Awaited<ReturnType<typeof verifySession>>) {
  return !!session && ADMIN_ROLES.some((role) => session.roles.includes(role));
}

function isSystemAdmin(session: Awaited<ReturnType<typeof verifySession>>) {
  return !!session && session.roles.includes("admin sistem");
}

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();

    if (!canAccessMasterData(session)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const search = request.nextUrl.searchParams.get("search")?.trim();
    const includeDeleted =
      request.nextUrl.searchParams.get("includeDeleted") === "true";

    if (includeDeleted && !isSystemAdmin(session)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const whereClause = and(
      includeDeleted ? undefined : eq(categories.isActive, true),
      includeDeleted ? undefined : isNull(categories.deletedAt),
      search ? ilike(categories.name, `%${search}%`) : undefined,
    );

    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        isActive: categories.isActive,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        deletedAt: categories.deletedAt,
        usageCount: getUsageCount,
      })
      .from(categories)
      .leftJoin(
        products,
        and(
          eq(products.categoryId, categories.id),
          eq(products.isActive, true),
          isNull(products.deletedAt),
        ),
      )
      .where(whereClause)
      .groupBy(
        categories.id,
        categories.name,
        categories.isActive,
        categories.createdAt,
        categories.updatedAt,
        categories.deletedAt,
      )
      .orderBy(desc(categories.deletedAt), desc(categories.createdAt));

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();

    if (!canAccessMasterData(session)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validation = validateCategoryData(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.format() || "Unknown error",
        },
        { status: 400 },
      );
    }

    const [category] = await db
      .insert(categories)
      .values({
        ...validation.data,
        isActive: true,
        deletedAt: null,
      })
      .returning();

    return NextResponse.json(
      { success: true, data: category, message: "Kategori berhasil dibuat" },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
