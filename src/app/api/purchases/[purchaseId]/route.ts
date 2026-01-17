import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import {
  products,
  productVariants,
  purchaseItems,
  purchaseOrders,
  stockMutations,
} from "@/drizzle/schema";
import { validateInsertPurchaseData } from "@/lib/validations/purchase";

// GET detail purchase
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  try {
    const purchaseId = (await params).purchaseId;

    if (!purchaseId) {
      return NextResponse.json(
        { success: false, error: "Purchase ID is required" },
        { status: 400 }
      );
    }

    const purchase = await db.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, Number(purchaseId)),
      with: {
        supplier: {
          columns: {
            id: true,
            name: true,
          },
        },
        items: {
          columns: {
            id: true,
            price: true,
            qty: true,
            subtotal: true,
          },
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                stock: true,
                averageCost: true,
              },
            },
            productVariant: {
              columns: {
                id: true,
                name: true,
                conversionToBase: true,
              },
            },
          },
        },
        user: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!purchase) {
      return NextResponse.json(
        { success: false, error: "Purchase not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: purchase });
  } catch (error) {
    console.error("Error fetching purchase:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT update purchase
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  try {
    const poId = Number((await params).purchaseId);
    const { supplierId, userId, items: newItems } = await request.json();

    const variantIds = newItems.map((item: any) => item.variantId);
    const duplicateVariant = variantIds.find(
      (id: number, index: number) => variantIds.indexOf(id) !== index
    );

    if (duplicateVariant) {
      return NextResponse.json(
        {
          success: false,
          error: `Input tidak valid: Varian ID ${duplicateVariant} muncul lebih dari satu kali. Silakan gabungkan kuantitasnya.`,
        },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      const existingOrder = await tx.query.purchaseOrders.findFirst({
        where: eq(purchaseOrders.id, poId),
      });
      if (!existingOrder) {
        throw new Error("Purchase order not found");
      }
      if (existingOrder.isArchived)
        throw new Error("Cannot update archived purchase order");

      const oldItems = await tx
        .select()
        .from(purchaseItems)
        .where(eq(purchaseItems.purchaseId, poId))
        .orderBy(asc(purchaseItems.id));

      const revertedProducts = new Set<number>();

      for (const oldItem of oldItems) {
        const variant = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, oldItem.variantId),
        });
        if (variant) {
          const qtyToRevert =
            Number(oldItem.qty) * Number(variant.conversionToBase);

          const updateData: any = {
            stock: sql`${products.stock} - ${qtyToRevert.toFixed(3)}`,
          };

          // jika product belum pernah di revert, kembalikan averageCost ke 'costBefore'
          if (!revertedProducts.has(oldItem.productId)) {
            updateData.averageCost = oldItem.costBefore;
            revertedProducts.add(oldItem.productId);
          }

          // Revert Stock & Revert Average Cost ke costBefore
          await tx
            .update(products)
            .set(updateData)
            .where(eq(products.id, oldItem.productId));
        }
      }

      // Bersihkan item & mutasi lama
      await tx.delete(purchaseItems).where(eq(purchaseItems.purchaseId, poId));
      await tx
        .delete(stockMutations)
        .where(
          eq(stockMutations.reference, `PO-${poId.toString().padStart(6, "0")}`)
        );

      let grandTotal = 0;
      const insertedItems = [];
      const insertedMutations = [];

      for (const item of newItems) {
        const productData = await tx.query.products.findFirst({
          where: eq(products.id, item.productId),
        });
        const variantData = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, item.variantId),
        });

        if (!productData || !variantData) {
          throw new Error("Product or variant not found");
        }

        const conversion = Number(variantData!.conversionToBase);
        const qtyInBaseUnit = Number(item.qty) * conversion;
        const pricePerBaseUnit = Number(item.price) / conversion;
        const subtotal = Number(item.qty) * Number(item.price);
        grandTotal += subtotal;

        const currentStock = Number(productData!.stock);
        const costBefore = Number(productData!.averageCost) || 0;

        const newStock = currentStock + qtyInBaseUnit;
        const newAvgCost =
          currentStock > 0
            ? (currentStock * costBefore + qtyInBaseUnit * pricePerBaseUnit) /
              newStock
            : pricePerBaseUnit;

        await tx
          .update(products)
          .set({
            stock: newStock.toFixed(3),
            averageCost: newAvgCost.toFixed(4),
            lastPurchaseCost: pricePerBaseUnit.toFixed(4),
          })
          .where(eq(products.id, item.productId));

        const [insertItem] = await tx
          .insert(purchaseItems)
          .values({
            purchaseId: poId,
            productId: item.productId,
            variantId: item.variantId,
            qty: item.qty,
            price: item.price,
            subtotal: subtotal.toFixed(2),
            costBefore: costBefore.toFixed(4),
          })
          .returning();

        insertedItems.push(insertItem);

        const [insertMutation] = await tx
          .insert(stockMutations)
          .values({
            productId: item.productId,
            variantId: item.variantId,
            type: "purchase",
            qtyBaseUnit: qtyInBaseUnit.toFixed(4),
            reference: `PO-${poId.toString().padStart(6, "0")}`,
            userId,
          })
          .returning();

        insertedMutations.push(insertMutation);
      }

      const [finalUpdate] = await tx
        .update(purchaseOrders)
        .set({ supplierId, total: grandTotal.toFixed(2) })
        .where(eq(purchaseOrders.id, poId))
        .returning();

      return {
        order: finalUpdate,
        items: insertedItems,
        mutations: insertedMutations,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Purchase updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating purchase:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// soft delete purchase order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  try {
    const { purchaseId } = await params;
    const poId = Number(purchaseId);

    if (isNaN(poId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      const existingOrder = await tx.query.purchaseOrders.findFirst({
        where: eq(purchaseOrders.id, poId),
      });

      if (!existingOrder) throw new Error("Purchase Order not found");
      if (existingOrder.isArchived)
        throw new Error("Purchase Order already archived");

      const oldItems = await tx
        .select()
        .from(purchaseItems)
        .where(eq(purchaseItems.purchaseId, poId))
        .orderBy(asc(purchaseItems.id));

      const revertedProducts = new Set<number>();

      for (const item of oldItems) {
        const variant = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, item.variantId),
        });

        if (variant) {
          const qtyToRevert =
            Number(item.qty) * Number(variant.conversionToBase);

          const updateData: any = {
            stock: sql`${products.stock} - ${qtyToRevert.toFixed(3)}`,
          };

          // jika product belum pernah di revert, kembalikan averageCost ke 'costBefore'
          if (!revertedProducts.has(item.productId)) {
            updateData.averageCost = item.costBefore;
            revertedProducts.add(item.productId);
          }

          await tx
            .update(products)
            .set(updateData)
            .where(eq(products.id, item.productId));
          // buat mutasi stok adjusment
          await tx.insert(stockMutations).values({
            productId: item.productId,
            variantId: item.variantId,
            type: "adjustment",
            qtyBaseUnit: (-qtyToRevert).toFixed(4),
            reference: `VOID-PO-${poId.toString().padStart(6, "0")}`,
            userId: existingOrder.userId,
          });
        }
      }

      const [archivedOrder] = await tx
        .update(purchaseOrders)
        .set({
          isArchived: true,
          updatedAt: new Date(),
        })
        .where(eq(purchaseOrders.id, poId))
        .returning();

      return archivedOrder;
    });

    return NextResponse.json({
      success: true,
      message: "Purchase Order archived successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Delete Purchase Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
