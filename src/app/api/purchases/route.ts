import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  products,
  purchaseOrders,
  purchaseItems,
  stockMutations,
  productVariants,
} from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { validateInsertPurchaseData } from "@/lib/validations/purchase";

// GET all purchase with search, pagination, and sorting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const order = searchParams.get("order") || "desc";
    const orderBy = searchParams.get("orderBy") || "createdAt";
    const search = searchParams.get("search")?.trim() || "";
    const offset = (page - 1) * limit;

    let searchFilter;
    let searchOrder;

    if (search) {
      // pecah search string menjadi kata-kata, tambahkan ':*' di tiap kata
      const formattedSearch = search
        .split(/\s+/)
        .map((word) => `${word}:*`)
        .join(" & ");

      const searchQuery = sql`to_tsquery('indonesian', ${formattedSearch})`;

      searchFilter = sql`${purchaseOrders.searchVector} @@ ${searchQuery}`;

      // urutkan berdasarkan rank
      searchOrder = (fields: any, { asc, desc }: any) => [
        order === "asc"
          ? asc(sql`ts_rank(${fields.searchVector}, ${searchQuery})`)
          : desc(sql`ts_rank(${fields.searchVector}, ${searchQuery})`),
      ];
    } else {
      searchFilter = undefined;
      searchOrder = (fields: any, { asc, desc }: any) => [
        order === "asc" ? asc(fields[orderBy]) : desc(fields[orderBy]),
      ];
    }

    const [purchasesData, totalRes] = await Promise.all([
      db.query.purchaseOrders.findMany({
        where: searchFilter,
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
            columns: {
              id: true,
              qty: true,
              price: true,
              subtotal: true,
            },
            with: {
              product: {
                columns: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: searchOrder,
        limit: limit,
        offset: offset,
      }),

      db
        .select({ count: sql<number>`count(*)` })
        .from(purchaseOrders)
        .where(searchFilter),
    ]);

    const totalCount = Number(totalRes[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: purchasesData,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST add purchase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = await validateInsertPurchaseData(body);
    const { supplierId, userId, items } = validation;

    const variantIds = items.map((i: any) => i.variantId);
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
            `Product/Variant ID ${item.productId}/${item.variantId} not found`
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
        let newAvgCost =
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
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Purchase Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
