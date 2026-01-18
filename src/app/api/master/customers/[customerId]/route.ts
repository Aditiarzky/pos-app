import { customers } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { validateCustomerUpdateData } from "@/lib/validations/customer";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// PUT
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const customerId = parseInt((await params).customerId);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { success: false, error: "Invalid unit ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const validation = validateCustomerUpdateData(body);

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

    const [customer] = await db
      .update(customers)
      .set(validation.data)
      .where(eq(customers.id, customerId))
      .returning();

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: customer,
      message: "Customer updated successfully",
    });
  } catch (error) {
    console.error("update customer error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId: rawId } = await params;
    const customerId = Number(rawId);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { success: false, error: "Invalid customer ID format" },
        { status: 400 }
      );
    }

    const [updatedCustomer] = await db
      .update(customers)
      .set({
        isActive: false,
        deletedAt: new Date(),
      })
      .where(and(eq(customers.id, customerId), eq(customers.isActive, true)))
      .returning();

    if (!updatedCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer not found or already deactivated",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
      message: "Customer successfully deactivated",
    });
  } catch (error) {
    console.error("Delete customer error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
