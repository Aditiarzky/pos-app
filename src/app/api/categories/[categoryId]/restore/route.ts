import { categories } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
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

    const categoryId = Number.parseInt((await params).categoryId, 10);

    if (Number.isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: "Invalid category ID" },
        { status: 400 },
      );
    }

    const [category] = await db
      .update(categories)
      .set({
        isActive: true,
        deletedAt: null,
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
      message: "Kategori berhasil direstore",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
