import { suppliers } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { validateSupplierUpdateData } from "@/lib/validations/supplier";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// PUT
export async function PATCH(
  request: NextRequest,
  { params }: { params: { supplierId: string } }
) {
  try {
    const { supplierId: rawId } = await params;
    const supplierId = parseInt(rawId);
    const body = await request.json();

    const validation = validateSupplierUpdateData(body);

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
      .update(suppliers)
      .set(validation.data)
      .where(eq(suppliers.id, supplierId))
      .returning();

    return NextResponse.json({ success: true, supplier });
  } catch (error) {
    console.error("update supplier error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update supplier" },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE({ params }: { params: { supplierId: string } }) {
  try {
    const { supplierId: rawId } = await params;
    const supplierId = parseInt(rawId);

    const [supplier] = await db
      .delete(suppliers)
      .where(eq(suppliers.id, supplierId))
      .returning();

    return NextResponse.json({ success: true, supplier });
  } catch (error) {
    console.error("delete supplier error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
