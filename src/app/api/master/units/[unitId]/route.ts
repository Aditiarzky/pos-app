import { suppliers, units } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { validateUnitUpdateData } from "@/lib/validations/unit";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// PUT
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    const unitId = parseInt((await params).unitId);

    if (isNaN(unitId)) {
      return NextResponse.json(
        { success: false, error: "Invalid unit ID" },
        { status: 400 }
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
        { status: 400 }
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
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: unit,
      message: "Unit updated successfully",
    });
  } catch (error) {
    console.error("update unit error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update unit" },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    const unitId = parseInt((await params).unitId);

    if (isNaN(unitId)) {
      return NextResponse.json(
        { success: false, error: "Invalid unit ID" },
        { status: 400 }
      );
    }

    const [unit] = await db
      .delete(units)
      .where(eq(units.id, unitId))
      .returning();

    if (!unit) {
      return NextResponse.json(
        { success: false, error: "Unit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: unit,
      message: "Unit deleted successfully",
    });
  } catch (error) {
    console.error("delete unit error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete unit" },
      { status: 500 }
    );
  }
}
