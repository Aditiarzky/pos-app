import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productVariants, stockMutations } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { handleApiError } from "@/lib/api-utils";
import { z } from "zod";

const adjustmentSchema = z.object({
  productId: z.number(),
  actualStock: z.number(),
  reason: z.string().optional(),
  userId: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = adjustmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.format() },
        { status: 400 },
      );
    }

    const { productId, actualStock, reason, userId } = validation.data;

    const result = await db.transaction(async (tx) => {
      // 1. Get current product stock
      const product = await tx.query.products.findFirst({
        where: eq(products.id, productId),
        columns: {
          id: true,
          stock: true,
          baseUnitId: true,
        },
        with: {
          variants: {
            limit: 1,
            columns: { id: true },
          },
        },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      if (product.variants.length === 0) {
        throw new Error("Product has no variants to attach mutation record to");
      }

      const currentStock = Number(product.stock);
      const diff = actualStock - currentStock;

      if (diff === 0) {
        return { message: "No stock change needed" };
      }

      // 2. Insert Mutation
      await tx.insert(stockMutations).values({
        productId: product.id,
        variantId: product.variants[0].id,
        type: "adjustment",
        qtyBaseUnit: diff.toString(),
        reference: "Stock Adjustment",
        userId: userId,
      });

      // 3. Update Product Stock
      await tx
        .update(products)
        .set({ stock: actualStock.toString() })
        .where(eq(products.id, productId));

      return {
        previousStock: currentStock,
        newStock: actualStock,
        adjustment: diff,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
