import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  products,
  purchaseOrders,
  purchaseItems,
  stockMutations,
  productVariants,
} from "@/drizzle/schema";
import { and, eq, not, sql } from "drizzle-orm";
import {
  insertPurchaseItemType,
  validateInsertPurchaseData,
} from "@/lib/validations/purchase";
import {
  formatMeta,
  getSearchAndOrderBasic,
  parsePagination,
} from "@/lib/query-helper";
import { handleApiError } from "@/lib/api-utils";

// GET all purchase with search, pagination, and sorting
export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const { searchOrder } = getSearchAndOrderBasic(
      params.search,
      params.order,
      params.orderBy,
      purchaseOrders.orderNumber,
    );

    let searchFilter = undefined;
    if (params.search) {
      searchFilter = sql`(${purchaseOrders.orderNumber} ILIKE ${`%${params.search}%`} OR EXISTS (
        SELECT 1 FROM suppliers WHERE suppliers.id = ${purchaseOrders.supplierId} AND suppliers.name ILIKE ${`%${params.search}%`}
      ))`;
    }

    const [purchasesData, totalRes] = await Promise.all([
      db.query.purchaseOrders.findMany({
        where: and(searchFilter, not(purchaseOrders.isArchived)),
        with: {
          supplier: {
            columns: {
              id: true,
              name: true,
            },
          },
          user: {
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
                },
              },
              productVariant: {
                columns: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: searchOrder,
        limit: params.limit,
        offset: params.offset,
      }),

      db
        .select({ count: sql<number>`count(*)` })
        .from(purchaseOrders)
        .where(and(searchFilter, not(purchaseOrders.isArchived))),
    ]);

    const totalCount = Number(totalRes[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: purchasesData,
      analytics: {
        totalPurchases: totalCount,
      },
      meta: formatMeta(totalCount, params.page, params.limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST add purchase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = await validateInsertPurchaseData(body);
    const { supplierId, userId, items } = validation;

    const variantIds = items.map((i: insertPurchaseItemType) => i.variantId);
    if (new Set(variantIds).size !== variantIds.length) {
      throw new Error("Same variant cannot be added multiple times");
    }

    const result = await db.transaction(async (tx) => {
      // 1. Insert Header
      const [newOrder] = await tx
        .insert(purchaseOrders)
        .values({
          supplierId,
          userId,
          orderNumber: "TEMP",
          total: "0.00",
        })
        .returning();

      let grandTotal = 0;
      const createdItems = [];
      const createdMutations = [];

      for (const item of items) {
        const productData = await tx.query.products.findFirst({
          where: eq(products.id, item.productId),
        });

        const variantData = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, item.variantId),
        });

        if (!productData || !variantData) {
          throw new Error(
            `Product/Variant ID ${item.productId}/${item.variantId} not found`,
          );
        }

        const conversion = Number(variantData.conversionToBase);
        const qtyInBaseUnit = Number(item.qty) * conversion;
        const pricePerBaseUnit = Number(item.price) / conversion;
        const subtotal = Number(item.qty) * Number(item.price);
        grandTotal += subtotal;

        // Hitung HPP
        const currentStock = Number(productData.stock) || 0;
        const currentAvgCost = Number(productData.averageCost) || 0;

        const costBefore = currentAvgCost;

        const newStock = currentStock + qtyInBaseUnit;
        const newAvgCost =
          currentStock > 0
            ? (currentStock * currentAvgCost +
                qtyInBaseUnit * pricePerBaseUnit) /
              newStock
            : pricePerBaseUnit;

        // Update Produk (Stok & HPP)
        await tx
          .update(products)
          .set({
            stock: newStock.toFixed(3),
            averageCost: newAvgCost.toFixed(4),
            lastPurchaseCost: pricePerBaseUnit.toFixed(4),
          })
          .where(eq(products.id, item.productId));

        // Insert Detail Item
        const [newItem] = await tx
          .insert(purchaseItems)
          .values({
            purchaseId: newOrder.id,
            productId: item.productId,
            variantId: item.variantId,
            qty: item.qty.toFixed(3),
            price: item.price.toFixed(2),
            subtotal: subtotal.toFixed(2),
            costBefore: costBefore.toFixed(4),
          })
          .returning();
        createdItems.push(newItem);

        // Insert Mutasi Stok
        const [newMutation] = await tx
          .insert(stockMutations)
          .values({
            productId: item.productId,
            variantId: item.variantId,
            type: "purchase",
            qtyBaseUnit: qtyInBaseUnit.toFixed(4),
            reference: `PO-${newOrder.id.toString().padStart(6, "0")}`,
            userId: userId,
          })
          .returning();
        createdMutations.push(newMutation);
      }

      // Update Total Akhir & Order Number di Header
      const [finalOrder] = await tx
        .update(purchaseOrders)
        .set({
          total: grandTotal.toFixed(2),
          orderNumber: `PO-${newOrder.id.toString().padStart(6, "0")}`,
        })
        .where(eq(purchaseOrders.id, newOrder.id))
        .returning();

      // Return semua data yang terkumpul
      return {
        order: finalOrder,
        items: createdItems,
        mutations: createdMutations,
      };
    });

    return NextResponse.json(
      { success: true, data: result, message: "Purchase created successfully" },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
