import { suppliers } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { validateSupplierData } from "@/lib/validations/supplier";
import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET
export async function GET() {
  try {
    const suppliersData = await db
      .select()
      .from(suppliers)
      .orderBy(desc(suppliers.createdAt));

    return NextResponse.json({
      success: true,
      data: suppliersData,
    });
  } catch (error) {
    console.error("fetch suppliers error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

// POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateSupplierData(body);

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

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: supplier,
      message: "Supplier created successfully",
    });
  } catch (error) {
    console.error("create supplier error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}
