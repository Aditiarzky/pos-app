import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { productBarcodes, products } from "@/drizzle/schema";
import {
  validateProductData,
  validateUpdateProductData,
} from "@/lib/validations/product";

// GET detail product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const productId = (await params).productId;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 },
      );
    }

    const product = await db.query.products.findFirst({
      where: eq(products.id, Number(productId)),
      with: {
        unit: true,
        variants: true,
        category: true,
      },
    });
    if (product?.isActive === false) {
      return NextResponse.json(
        { success: false, error: "Product is not active" },
        { status: 404 },
      );
    }
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// PATCH update product
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    const body = await request.json();

    const validation = validateUpdateProductData(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const idNum = Number(productId);
    if (!idNum) {
      return NextResponse.json(
        { success: false, error: "ID tidak valid" },
        { status: 400 },
      );
    }

    const { barcodes, ...productUpdateData } = body;

    const updatedBarcodes: any[] = [];

    const result = await db.transaction(async (tx) => {
      const existingProduct = await tx.query.products.findFirst({
        where: eq(products.id, idNum),
      });

      if (!existingProduct) throw new Error("Produk tidak ditemukan");

      const [updatedProduct] = await tx
        .update(products)
        .set({
          ...productUpdateData,
          updatedAt: new Date(),
        })
        .where(eq(products.id, idNum))
        .returning();

      if (barcodes && Array.isArray(barcodes)) {
        await tx
          .delete(productBarcodes)
          .where(eq(productBarcodes.productId, idNum));
        if (barcodes.length > 0) {
          const barcodeValues = barcodes.map((b: string) => ({
            productId: idNum,
            barcode: b,
          }));
          const insertedBarcodes = await tx
            .insert(productBarcodes)
            .values(barcodeValues)
            .returning({
              id: productBarcodes.id,
              barcode: productBarcodes.barcode,
            });
          updatedBarcodes.push(...insertedBarcodes);
        }
      }

      return { product: updatedProduct, barcodes: updatedBarcodes };
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Produk berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("Error updating product:", error);
    if (error.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          error: "Barcode sudah digunakan oleh produk lain",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

// DELETE delete product

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const productId = (await params).productId;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 },
      );
    }

    const product = await db.query.products.findFirst({
      where: eq(products.id, Number(productId)),
    });
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    const deletedProduct = await db
      .delete(products)
      .where(eq(products.id, Number(productId)))
      .returning();

    return NextResponse.json({
      success: true,
      data: deletedProduct,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
