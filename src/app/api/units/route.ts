import { units } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateUnitData } from "@/lib/validations/unit";
import { and, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_ROLES = ["admin toko", "admin sistem"] as const;

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

    const rows = await db
      .select({
        id: units.id,
        name: units.name,
        isActive: units.isActive,
        createdAt: units.createdAt,
        updatedAt: units.updatedAt,
        deletedAt: units.deletedAt,
        usageCount: sql<number>`(
          select count(distinct "products"."id")
          from "products"
          left join "product_variants"
            on "product_variants"."product_id" = "products"."id"
            and "product_variants"."deleted_at" is null
          where "products"."deleted_at" is null
            and "products"."is_active" = true
            and (
              "products"."base_unit_id" = "units"."id"
              or "product_variants"."unit_id" = "units"."id"
            )
        )`,
      })
      .from(units)
      .where(
        and(
          includeDeleted ? undefined : eq(units.isActive, true),
          includeDeleted ? undefined : isNull(units.deletedAt),
          search ? ilike(units.name, `%${search}%`) : undefined,
        ),
      )
      .orderBy(desc(units.deletedAt), desc(units.createdAt));

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
    const validation = validateUnitData(body);

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

    const [unit] = await db
      .insert(units)
      .values({
        ...validation.data,
        isActive: true,
        deletedAt: null,
      })
      .returning();

    return NextResponse.json(
      { success: true, data: unit, message: "Satuan berhasil dibuat" },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
