import { categories } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateCategoryUpdateData } from "@/lib/validations/category";
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

async function getCategoryId(
  params: Promise<{ categoryId: string }>,
): Promise<number> {
  return Number.parseInt((await params).categoryId, 10);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  try {
    const authError = await requireSystemAdmin();

    if (authError) {
      return authError;
    }

    const categoryId = await getCategoryId(params);

    if (Number.isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: "Invalid category ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validation = validateCategoryUpdateData(body);

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

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
      message: "Kategori berhasil diperbarui",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  try {
    const authError = await requireSystemAdmin();

    if (authError) {
      return authError;
    }

    const categoryId = await getCategoryId(params);

    if (Number.isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: "Invalid category ID" },
        { status: 400 },
      );
    }

    const [category] = await db
      .update(categories)
      .set({
        isActive: false,
        deletedAt: new Date(),
      })
      .where(eq(categories.id, categoryId))
      .returning();

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
      message: "Kategori dipindahkan ke trash",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
