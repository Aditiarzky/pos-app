import { suppliers } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { validateSupplierUpdateData } from "@/lib/validations/supplier";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

// GET DETAIL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> },
) {
  try {
    const id = parseInt((await params).supplierId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid supplier ID" },
        { status: 400 },
      );
    }

    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: supplier });
  } catch (error) {
    console.error("get supplier error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get supplier" },
      { status: 500 },
    );
  }
}

// PATCH
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> },
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (
      !session.roles.includes("admin sistem") &&
      !session.roles.includes("admin toko")
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Unauthorized role" },
        { status: 403 },
      );
    }

    const supplierId = parseInt((await params).supplierId);

    if (isNaN(supplierId)) {
      return NextResponse.json(
        { success: false, error: "Invalid supplier ID" },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Check for restore flag
    if (body.restore === true) {
      const [restoredSupplier] = await db
        .update(suppliers)
        .set({
          deletedAt: null,
          isActive: true,
        })
        .where(eq(suppliers.id, supplierId))
        .returning();

      if (!restoredSupplier) {
        return NextResponse.json(
          { success: false, error: "Supplier not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: restoredSupplier,
        message: "Supplier restored successfully",
      });
    }

    const validation = validateSupplierUpdateData(body);

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

    const [supplier] = await db
      .update(suppliers)
      .set(validation.data)
      .where(eq(suppliers.id, supplierId))
      .returning();

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: supplier,
      message: "Supplier updated successfully",
    });
  } catch (error) {
    console.error("update supplier error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update supplier" },
      { status: 500 },
    );
  }
}

// DELETE
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> },
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (
      !session.roles.includes("admin sistem") &&
      !session.roles.includes("admin toko")
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Unauthorized role" },
        { status: 403 },
      );
    }

    const supplierId = parseInt((await params).supplierId);

    if (isNaN(supplierId)) {
      return NextResponse.json(
        { success: false, error: "Invalid supplier ID" },
        { status: 400 },
      );
    }

    // Soft delete: update deletedAt and isActive
    const [supplier] = await db
      .update(suppliers)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(eq(suppliers.id, supplierId))
      .returning();

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: supplier,
      message: "Supplier moved to trash successfully",
    });
  } catch (error) {
    console.error("delete supplier error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete supplier" },
      { status: 500 },
    );
  }
}
