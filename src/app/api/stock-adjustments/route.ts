import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, stockMutations } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { handleApiError } from "@/lib/api-utils";
import { z } from "zod";

const adjustmentSchema = z.object({
  productId: z.number(),
  actualStock: z.number().optional(),
  minStock: z.number().or(z.string()).optional(),
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

    const { productId, actualStock, minStock, userId } = validation.data;

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
            columns: { id: true, name: true },
            with: {
              unit: {
                columns: { name: true },
              },
            },
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
      const diff = actualStock! - currentStock;

      if (diff === 0) {
        return { message: "No stock change needed" };
      }

      // 2. Insert Mutation if actualStock changed
      if (actualStock !== undefined && actualStock !== currentStock) {
        await tx.insert(stockMutations).values({
          productId: product.id,
          variantId: product.variants[0].id,
          type: "adjustment",
          qtyBaseUnit: diff.toString(),
          reference: "Stock Adjustment",
          userId: userId,
        });
      }

      // 3. Update Product
      const updateData: { stock?: string; minStock?: string } = {};
      if (actualStock !== undefined) updateData.stock = actualStock.toString();
      if (minStock !== undefined) updateData.minStock = minStock.toString();

      if (Object.keys(updateData).length > 0) {
        await tx
          .update(products)
          .set(updateData)
          .where(eq(products.id, productId));
      }

      return {
        previousStock: currentStock,
        newStock: actualStock ?? currentStock,
        adjustment: actualStock !== undefined ? diff : 0,
        minStock: minStock !== undefined ? minStock : undefined,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
