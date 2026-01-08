import { categories } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { validateCategoryData } from "@/lib/validations/category";
import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET
export async function GET() {
  try {
    const categoriesData = await db
      .select()
      .from(categories)
      .orderBy(desc(categories.createdAt));

    return NextResponse.json({
      success: true,
      data: categoriesData,
    });
  } catch (error) {
    console.error("fetch categories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateCategoryData(body);

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

    const [category] = await db
      .insert(categories)
      .values(validation.data)
      .returning();

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("create category error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create category" },
      { status: 500 }
    );
  }
}
