import { NextRequest, NextResponse } from "next/server";
import { productVariants } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { validateProductVariantData } from "@/lib/validations/product-variant";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateProductVariantData(body);

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

    const [newProductVariant] = await db
      .insert(productVariants)
      .values(validation.data)
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newProductVariant,
        message: "Product variant created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error inserting product variant:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
