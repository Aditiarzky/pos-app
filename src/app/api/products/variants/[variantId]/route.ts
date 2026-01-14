import { NextRequest, NextResponse } from "next/server";
import { productVariants } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { validateUpdateProductVariantData } from "@/lib/validations/product-variant";

// GET detail product variant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const variantId = (await params).variantId;

    if (!variantId) {
      return NextResponse.json(
        { success: false, error: "Variant ID is required" },
        { status: 400 }
      );
    }

    const variant = await db.query.productVariants.findFirst({
      with: {
        product: true,
        unit: true,
      },
      where: eq(productVariants.id, Number(variantId)),
    });

    if (!variant) {
      return NextResponse.json(
        { success: false, error: "Variant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: variant });
  } catch (error) {
    console.error("Error fetching variant:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH update product variant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const variantId = (await params).variantId;
    const body = await request.json();

    const validation = validateUpdateProductVariantData(body);

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

    if (!variantId) {
      return NextResponse.json(
        { success: false, error: "Variant ID is required" },
        { status: 400 }
      );
    }

    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, Number(variantId)),
    });
    if (!variant) {
      return NextResponse.json(
        { success: false, error: "Variant not found" },
        { status: 404 }
      );
    }

    const updatedVariant = await db
      .update(productVariants)
      .set(body)
      .where(eq(productVariants.id, Number(variantId)))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedVariant,
      message: "Variant updated successfully",
    });
  } catch (error) {
    console.error("Error updating variant:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE delete product variant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const variantId = (await params).variantId;

    if (!variantId) {
      return NextResponse.json(
        { success: false, error: "Variant ID is required" },
        { status: 400 }
      );
    }

    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, Number(variantId)),
    });
    if (!variant) {
      return NextResponse.json(
        { success: false, error: "Variant not found" },
        { status: 404 }
      );
    }

    const deletedVariant = await db
      .delete(productVariants)
      .where(eq(productVariants.id, Number(variantId)))
      .returning();

    return NextResponse.json({
      success: true,
      data: deletedVariant,
      message: "Variant deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting variant:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
