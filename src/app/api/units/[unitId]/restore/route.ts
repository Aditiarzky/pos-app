import { units } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ unitId: string }> },
) {
  try {
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

    const unitId = Number.parseInt((await params).unitId, 10);

    if (Number.isNaN(unitId)) {
      return NextResponse.json(
        { success: false, error: "Invalid unit ID" },
        { status: 400 },
      );
    }

    const [unit] = await db
      .update(units)
      .set({
        isActive: true,
        deletedAt: null,
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
      message: "Satuan berhasil direstore",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
