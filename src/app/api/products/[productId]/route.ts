import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { and, eq, notInArray } from "drizzle-orm";
import { productBarcodes, products, productVariants } from "@/drizzle/schema";
import {
  ProductVariantInputType,
  validateProductData,
  validateUpdateProductData,
} from "@/lib/validations/product";
import { handleApiError } from "@/lib/api-utils";

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
    return handleApiError(error);
  }
}

// PUT update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    const idNum = Number(productId);
    const body = await request.json();
    const validation = validateUpdateProductData(body);

    if (!validation.success)
      return NextResponse.json(
        { success: false, details: validation.error.format() },
        { status: 400 },
      );

    const { barcodes, variants, ...productUpdateData } = validation.data;

    const result = await db.transaction(async (tx) => {
      const product = await tx.query.products.findFirst({
        where: and(eq(products.id, idNum), eq(products.isActive, true)),
      });

      if (!product) {
        return NextResponse.json(
          { success: false, error: "Product not found" },
          { status: 404 },
        );
      }

      const [updatedProduct] = await tx
        .update(products)
        .set({ ...productUpdateData, updatedAt: new Date() })
        .where(eq(products.id, idNum))
        .returning();

      let updatedBarcodes;
      if (barcodes !== undefined) {
        await tx
          .delete(productBarcodes)
          .where(eq(productBarcodes.productId, idNum));
        if (barcodes.length > 0) {
          updatedBarcodes = await tx
            .insert(productBarcodes)
            .values(
              barcodes.map((b) => ({ productId: idNum, barcode: b.barcode })),
            )
            .returning({
              id: productBarcodes.id,
              barcode: productBarcodes.barcode,
            });
        }
      }
      const updatedVariants: ProductVariantInputType[] = [];

      if (variants !== undefined) {
        const incomingVariantIds = variants
          .map((v) => v.id)
          .filter((id): id is number => !!id);

        if (incomingVariantIds.length > 0) {
          await tx
            .delete(productVariants)
            .where(
              and(
                eq(productVariants.productId, idNum),
                notInArray(productVariants.id, incomingVariantIds),
              ),
            );
        } else {
          await tx
            .delete(productVariants)
            .where(eq(productVariants.productId, idNum));
        }

        for (const v of variants) {
          if (v.id) {
            const [updatedVariant] = await tx
              .update(productVariants)
              .set(v)
              .where(eq(productVariants.id, v.id))
              .returning();
            updatedVariants.push(updatedVariant);
          } else {
            const [insertedVariant] = await tx
              .insert(productVariants)
              .values({ ...v, productId: idNum })
              .returning();
            updatedVariants.push(insertedVariant);
          }
        }
      }

      return {
        ...updatedProduct,
        variants: updatedVariants,
        barcodes: updatedBarcodes,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return handleApiError(error);
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
    return handleApiError(error);
  }
}
