import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { and, eq, notInArray } from "drizzle-orm";
import {
  categories,
  productBarcodes,
  products,
  productVariants,
  stockMutations,
  units,
} from "@/drizzle/schema";
import {
  ProductVariantInputType,
  validateProductData,
  validateUpdateProductData,
} from "@/lib/validations/product";
import { variantAdjustmentSchema } from "@/lib/validations/stock-adjustment";
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
// PATCH adjust stock via multiple variants
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    const idNum = Number(productId);
    const body = await request.json();

    const validation = variantAdjustmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, details: validation.error.format() },
        { status: 400 },
      );
    }

    const { variants: adjustments, userId } = validation.data;

    const result = await db.transaction(async (tx) => {
      // 1. Get product and variants
      const product = await tx.query.products.findFirst({
        where: eq(products.id, idNum),
        with: {
          variants: true,
        },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      // 2. Calculate new total stock in base unit
      let newTotalStockBase = 0;
      for (const adj of adjustments) {
        const variant = product.variants.find((v) => v.id === adj.variantId);
        if (!variant) {
          throw new Error(
            `Variant ${adj.variantId} not found for this product`,
          );
        }
        newTotalStockBase += Number(adj.qty) * Number(variant.conversionToBase);
      }

      const currentStockBase = Number(product.stock);
      const diff = newTotalStockBase - currentStockBase;

      // 3. Update product stock
      const [updatedProduct] = await tx
        .update(products)
        .set({
          stock: newTotalStockBase.toFixed(3),
        })
        .where(eq(products.id, idNum))
        .returning();

      // 4. Record mutation if there's a difference
      if (diff !== 0) {
        await tx.insert(stockMutations).values({
          productId: idNum,
          variantId: product.variants[0].id, // Attach to first variant as primary ref
          type: "adjustment",
          qtyBaseUnit: diff.toFixed(4),
          reference: "Stock Adjustment (Manual)",
          userId: userId,
        });
      }

      return {
        previousStock: currentStockBase,
        newStock: newTotalStockBase,
        diff: diff,
        product: updatedProduct,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Stok berhasil disesuaikan",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
