import { categories, products } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(
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

    const [usage] = await db
      .select({ total: sql<number>`count(*)` })
      .from(products)
      .where(
        and(
          eq(products.categoryId, categoryId),
          eq(products.isActive, true),
          isNull(products.deletedAt),
        ),
      );

    if (Number(usage?.total || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Category masih dipakai produk aktif dan tidak bisa dihapus permanen",
        },
        { status: 400 },
      );
    }

    const [deletedCategory] = await db
      .delete(categories)
      .where(and(eq(categories.id, categoryId), isNotNull(categories.deletedAt)))
      .returning();

    if (!deletedCategory) {
      return NextResponse.json(
        {
          success: false,
          error: "Category harus di-soft delete sebelum dihapus permanen",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedCategory,
      message: "Kategori dihapus permanen",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
