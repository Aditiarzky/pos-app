import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { and, eq, notInArray } from "drizzle-orm";
import {
  categories,
  productBarcodes,
  products,
  productVariants,
  units,
} from "@/drizzle/schema";
import {
  ProductVariantInputType,
  validateProductData,
  validateUpdateProductData,
} from "@/lib/validations/product";
import { handleApiError } from "@/lib/api-utils";
import { getInitial } from "@/lib/utils";

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
        variants: {
          where: eq(productVariants.isActive, true),
        },
        category: true,
        barcodes: true,
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

    const { barcodes, variants, stock, ...productUpdateData } = validation.data;

    const result = await db.transaction(async (tx) => {
      const oldProduct = await tx.query.products.findFirst({
        where: and(eq(products.id, idNum), eq(products.isActive, true)),
      });

      if (!oldProduct) {
        return NextResponse.json(
          { success: false, error: "Product not found" },
          { status: 404 },
        );
      }

      const category = await tx.query.categories.findFirst({
        where: eq(categories.id, Number(productUpdateData.categoryId)),
      });

      if (!category) {
        return NextResponse.json(
          { success: false, error: "Category not found" },
          { status: 404 },
        );
      }

      const catCode = getInitial(category?.name || "NON");
      const prodCode = getInitial(productUpdateData.name || oldProduct.name);
      const newParentSku = `${catCode}-${prodCode}-${idNum}`;

      // Exclude stock from update - stock is only managed through stock mutations
      const [updatedProduct] = await tx
        .update(products)
        .set({
          ...productUpdateData,
          sku: newParentSku,
        })
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
            .update(productVariants)
            .set({
              isActive: false,
              deletedAt: new Date(),
            })
            .where(
              and(
                eq(productVariants.productId, idNum),
                notInArray(productVariants.id, incomingVariantIds),
              ),
            );
        } else {
          await tx
            .update(productVariants)
            .set({
              isActive: false,
              deletedAt: new Date(),
            })
            .where(eq(productVariants.productId, idNum));
        }

        for (const v of variants) {
          const unit = await tx.query.units.findFirst({
            where: eq(units.id, v.unitId),
          });
          const unitCode = unit?.name.toUpperCase();
          const vSku = `${newParentSku}-${unitCode}-${v.id}`;

          if (v.id) {
            const [updatedVariant] = await tx
              .update(productVariants)
              .set({
                ...v,
                sku: vSku,
                isActive: true,
                deletedAt: null,
              })
              .where(eq(productVariants.id, v.id))
              .returning();
            updatedVariants.push(updatedVariant);
          } else {
            const [insertedVariant] = await tx
              .insert(productVariants)
              .values({ ...v, productId: idNum, sku: vSku })
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
      .update(products)
      .set({
        isActive: false,
        deletedAt: new Date(),
      })
      .where(eq(products.id, Number(productId)))
      .returning();
    return NextResponse.json({
      success: true,
      data: deletedProduct,
      message: "Produk berhasil dipindahkan ke tempat sampah",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
