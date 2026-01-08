import { suppliers, units } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { validateUnitUpdateData } from "@/lib/validations/unit";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// PUT
export async function PATCH(
  request: NextRequest,
  { params }: { params: { unitId: string } }
) {
  try {
    const { unitId: rawId } = await params;
    const unitId = parseInt(rawId);
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

    return NextResponse.json({ success: true, unit });
  } catch (error) {
    console.error("update unit error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update supplier" },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE({ params }: { params: { unitId: string } }) {
  try {
    const { unitId: rawId } = await params;
    const unitId = parseInt(rawId);

    const [unit] = await db
      .delete(units)
      .where(eq(units.id, unitId))
      .returning();

    return NextResponse.json({ success: true, unit });
  } catch (error) {
    console.error("delete unit error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
