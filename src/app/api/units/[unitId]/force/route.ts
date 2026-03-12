import { productVariants, products, units } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { and, eq, isNotNull, isNull, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(
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

    const [usage] = await db
      .select({ total: sql<number>`count(distinct ${products.id})` })
      .from(products)
      .leftJoin(
        productVariants,
        and(
          eq(productVariants.productId, products.id),
          isNull(productVariants.deletedAt),
        ),
      )
      .where(
        and(
          eq(products.isActive, true),
          isNull(products.deletedAt),
          or(
            eq(products.baseUnitId, unitId),
            eq(productVariants.unitId, unitId),
          ),
        ),
      );

    if (Number(usage?.total || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Unit masih dipakai produk aktif dan tidak bisa dihapus permanen",
        },
        { status: 400 },
      );
    }

    const [deletedUnit] = await db
      .delete(units)
      .where(and(eq(units.id, unitId), isNotNull(units.deletedAt)))
      .returning();

    if (!deletedUnit) {
      return NextResponse.json(
        {
          success: false,
          error: "Unit harus di-soft delete sebelum dihapus permanen",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedUnit,
      message: "Satuan dihapus permanen",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
