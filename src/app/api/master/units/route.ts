import { suppliers, units } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { validateUnitData } from "@/lib/validations/unit";
import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET
export async function GET() {
  try {
    const unitsData = await db
      .select()
      .from(units)
      .orderBy(desc(units.createdAt));

    return NextResponse.json({
      success: true,
      data: unitsData,
    });
  } catch (error) {
    console.error("fetch units error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch units" },
      { status: 500 }
    );
  }
}

// POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateUnitData(body);

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

    const [supplier] = await db
      .insert(suppliers)
      .values(validation.data)
      .returning();

    return NextResponse.json({ success: true, supplier });
  } catch (error) {
    console.error("create supplier error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}
