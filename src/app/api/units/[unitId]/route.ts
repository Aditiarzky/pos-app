import { units } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateUnitUpdateData } from "@/lib/validations/unit";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

async function requireSystemAdmin() {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  if (!session.roles.includes("admin sistem")) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  return null;
}

async function getUnitId(params: Promise<{ unitId: string }>): Promise<number> {
  return Number.parseInt((await params).unitId, 10);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> },
) {
  try {
    const authError = await requireSystemAdmin();

    if (authError) {
      return authError;
    }

    const unitId = await getUnitId(params);

    if (Number.isNaN(unitId)) {
      return NextResponse.json(
        { success: false, error: "Invalid unit ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validation = validateUnitUpdateData(body);

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
      .update(units)
      .set(validation.data)
      .where(eq(units.id, unitId))
      .returning();

    if (!unit) {
      return NextResponse.json(
        { success: false, error: "Unit not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: unit,
      message: "Satuan berhasil diperbarui",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> },
) {
  try {
    const authError = await requireSystemAdmin();

    if (authError) {
      return authError;
    }

    const unitId = await getUnitId(params);

    if (Number.isNaN(unitId)) {
      return NextResponse.json(
        { success: false, error: "Invalid unit ID" },
        { status: 400 },
      );
    }

    const [unit] = await db
      .update(units)
      .set({
        isActive: false,
        deletedAt: new Date(),
      })
      .where(eq(units.id, unitId))
      .returning();

    if (!unit) {
      return NextResponse.json(
        { success: false, error: "Unit not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: unit,
      message: "Satuan dipindahkan ke trash",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
