import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import {
  products,
  productVariants,
  purchaseItems,
  purchaseOrders,
  stockMutations,
} from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { insertPurchaseItemType } from "@/lib/validations/purchase";
import { verifySession } from "@/lib/auth";

// GET detail purchase
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> },
) {
  try {
    const purchaseId = (await params).purchaseId;

    if (!purchaseId) {
      return NextResponse.json(
        { success: false, error: "Purchase ID is required" },
        { status: 400 },
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
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                stock: true,
                averageCost: true,
                lastPurchaseCost: true,
                image: true,
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
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: purchase });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> },
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (
      !session.roles.includes("admin sistem") &&
      !session.roles.includes("admin toko")
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin role required" },
        { status: 403 },
      );
    }

    const poId = Number((await params).purchaseId);
    const body = await request.json();
    // Gunakan validator yang sama atau validator update
    const { supplierId, userId, items: newItems } = body;

    // Validasi Varian Duplikat di Input Baru
    const variantIds = newItems.map(
      (item: insertPurchaseItemType) => item.variantId,
    );
    if (new Set(variantIds).size !== variantIds.length) {
      return NextResponse.json(
        { success: false, error: "Duplicate variants in input" },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      // Cek Order Existing
      const existingOrder = await tx.query.purchaseOrders.findFirst({
        where: eq(purchaseOrders.id, poId),
      });
      if (!existingOrder) throw new Error("Purchase order not found");
      if (existingOrder.isArchived)
        throw new Error("Cannot update archived order");

      // --- STEP 1: REVERT (KEMBALIKAN KE KONDISI SEBELUM PO INI) ---
      // Ambil items lama
      const oldItems = await tx
        .select()
        .from(purchaseItems)
        .where(eq(purchaseItems.purchaseId, poId));

      for (const oldItem of oldItems) {
        const product = await tx.query.products.findFirst({
          where: eq(products.id, oldItem.productId),
        });
        const variant = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, oldItem.variantId),
        });

        if (product && variant) {
          const conversion = Number(variant.conversionToBase);
          const oldQtyBase = Number(oldItem.qty) * conversion;
          const oldPriceBase = Number(oldItem.price) / conversion; // Harga beli lama per base unit

          const currentStock = Number(product.stock);
          const currentAvgCost = Number(product.averageCost);

          // LOGIKA REVERSE WEIGHTED AVERAGE
          const currentTotalAssetValue = currentStock * currentAvgCost;
          const valueToRemove = oldQtyBase * oldPriceBase;

          const revertedStock = currentStock - oldQtyBase;
          const revertedTotalAssetValue =
            currentTotalAssetValue - valueToRemove;

          let revertedAvgCost = 0;
          if (revertedStock <= 0) {
            revertedAvgCost = Number(oldItem.costBefore);
          } else {
            revertedAvgCost = revertedTotalAssetValue / revertedStock;
          }

          if (revertedAvgCost < 0) revertedAvgCost = 0;

          await tx
            .update(products)
            .set({
              stock: revertedStock.toFixed(3),
              averageCost: revertedAvgCost.toFixed(4),
            })
            .where(eq(products.id, oldItem.productId));

          // Insert mutasi pembatalan (audit trail untuk item lama)
          await tx.insert(stockMutations).values({
            productId: oldItem.productId,
            variantId: oldItem.variantId,
            type: "purchase_cancel",
            qtyBaseUnit: (-oldQtyBase).toFixed(4),
            unitFactorAtMutation: variant.conversionToBase,
            reference: `EDIT-PO-${poId.toString().padStart(6, "0")}`,
            userId: existingOrder.userId,
          });
        }
      }

      // Hapus Item Lama (mutasi lama tetap disimpan sebagai audit trail)
      await tx.delete(purchaseItems).where(eq(purchaseItems.purchaseId, poId));

      // --- STEP 2: APPLY NEW ITEMS (Sama persis seperti POST) ---
      let grandTotal = 0;
      const insertedItems = [];
      const insertedMutations = [];

      for (const item of newItems) {
        // Fetch ulang produk karena nilai stok & avgCost sudah berubah di Step 1
        const productData = await tx.query.products.findFirst({
          where: eq(products.id, item.productId),
        });
        const variantData = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, item.variantId),
        });

        if (!productData || !variantData)
          throw new Error("Product/Variant not found");

        const conversion = Number(variantData.conversionToBase);
        const qtyInBaseUnit = Number(item.qty) * conversion;
        const pricePerBaseUnit = Number(item.price) / conversion;
        const subtotal = Number(item.qty) * Number(item.price);
        grandTotal += subtotal;

        const currentStock = Number(productData.stock);
        const currentAvgCost = Number(productData.averageCost);

        // Simpan snapshot cost saat ini (setelah revert)
        const costBefore = currentAvgCost;

        const newStock = currentStock + qtyInBaseUnit;

        // Hitung Avg Cost Baru
        let newAvgCost = 0;
        if (newStock > 0) {
          newAvgCost =
            (currentStock * currentAvgCost + qtyInBaseUnit * pricePerBaseUnit) /
            newStock;
        } else {
          newAvgCost = pricePerBaseUnit;
        }

        // Update Final ke DB
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
            qty: String(item.qty),
            price: String(item.price),
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
            type: "purchase", // atau "purchase_update"
            qtyBaseUnit: qtyInBaseUnit.toFixed(4),
            reference: `PO-${poId.toString().padStart(6, "0")}`,
            userId: userId,
          })
          .returning();
        insertedMutations.push(insertMutation);
      }

      // Update Header
      const [finalUpdate] = await tx
        .update(purchaseOrders)
        .set({
          supplierId,
          total: grandTotal.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(purchaseOrders.id, poId))
        .returning();

      return {
        order: finalUpdate,
        items: insertedItems,
        mutations: insertedMutations,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

// --- DELETE: HARD DELETE PURCHASE (REVERSE WAC + CASCADE) ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> },
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!session.roles.includes("admin sistem")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin Sistem role required" },
        { status: 403 },
      );
    }

    const poId = Number((await params).purchaseId);
    if (isNaN(poId))
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 },
      );

    await db.transaction(async (tx) => {
      const existingOrder = await tx.query.purchaseOrders.findFirst({
        where: eq(purchaseOrders.id, poId),
      });
      if (!existingOrder) throw new Error("Purchase Order not found");

      const oldItems = await tx
        .select()
        .from(purchaseItems)
        .where(eq(purchaseItems.purchaseId, poId));

      // STEP 1: Reverse WAC per item + insert cancel mutation
      for (const item of oldItems) {
        const product = await tx.query.products.findFirst({
          where: eq(products.id, item.productId),
        });
        const variant = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, item.variantId),
        });

        if (product && variant) {
          const conversion = Number(variant.conversionToBase);
          const qtyToRemove = Number(item.qty) * conversion;
          const pricePaidBase = Number(item.price) / conversion;

          const currentStock = Number(product.stock);
          const currentAvgCost = Number(product.averageCost);

          const currentTotalValue = currentStock * currentAvgCost;
          const valueToRemove = qtyToRemove * pricePaidBase;

          const newStock = currentStock - qtyToRemove;
          const newTotalValue = currentTotalValue - valueToRemove;

          let newAvgCost = 0;
          if (newStock <= 0) {
            newAvgCost = Number(item.costBefore);
          } else {
            newAvgCost = newTotalValue / newStock;
          }

          if (newAvgCost < 0) newAvgCost = 0;

          await tx
            .update(products)
            .set({
              stock: newStock.toFixed(3),
              averageCost: newAvgCost.toFixed(4),
            })
            .where(eq(products.id, item.productId));

          // Catat mutasi pembatalan (audit trail)
          await tx.insert(stockMutations).values({
            productId: item.productId,
            variantId: item.variantId,
            type: "purchase_cancel",
            qtyBaseUnit: (-qtyToRemove).toFixed(4),
            unitFactorAtMutation: variant.conversionToBase,
            reference: `VOID-PO-${poId.toString().padStart(6, "0")}`,
            userId: existingOrder.userId,
          });
        }
      }

      // STEP 2: Hard-delete purchase_items, then purchase_orders
      await tx.delete(purchaseItems).where(eq(purchaseItems.purchaseId, poId));
      await tx.delete(purchaseOrders).where(eq(purchaseOrders.id, poId));
    });

    return NextResponse.json({
      success: true,
      message: "Pembelian berhasil dihapus permanen",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
