import { categories } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { validateCategoryData } from "@/lib/validations/category";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// PUT
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  try {
    const categoryId = parseInt((await params).categoryId);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: "Invalid category ID" },
        { status: 400 },
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
      .update(categories)
      .set(validation.data)
      .where(eq(categories.id, categoryId))
      .returning();

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    return handleApiError(error);
  }
}

// Delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  try {
    const categoryId = parseInt((await params).categoryId);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: "Invalid category ID" },
        { status: 400 },
      );
    }

    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 },
      );
    }

    await db.delete(categories).where(eq(categories.id, categoryId));

    return NextResponse.json({
      success: true,
      data: existingCategory,
      message: "Category deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
