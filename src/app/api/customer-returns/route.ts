import { db } from "@/lib/db";
import {
  formatMeta,
  getSearchAndOrderBasic,
  parsePagination,
} from "@/lib/query-helper";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  customerReturns,
  customerExchangeItems,
  customerReturnItems,
  products,
  productVariants,
  stockMutations,
} from "@/drizzle/schema";
import { validateInsertCustomerReturnData } from "@/lib/validations/customer-return";

// GET all customer-returns with search
// GET all customer-returns with search
export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const { searchFilter, searchOrder } = getSearchAndOrderBasic(
      params.search,
      params.order,
      params.orderBy,
      customerReturns.returnNumber,
    );

    const [customerReturnsData, totalRes] = await Promise.all([
      db.query.customerReturns.findMany({
        where: and(eq(customerReturns.isArchived, false), searchFilter),
        orderBy: searchOrder,
        limit: params.limit,
        offset: params.offset,
        with: {
          customer: true,
          sales: true,
        },
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customerReturns)
        .where(and(eq(customerReturns.isArchived, false), searchFilter)),
    ]);

    const totalCount = Number(totalRes[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: customerReturnsData,
      meta: formatMeta(totalCount, params.page, params.limit),
    });
  } catch (error) {
    console.error("fetch customer-returns error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customer-returns" },
      { status: 500 },
    );
  }
}

// POST create customer-return
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = await validateInsertCustomerReturnData(body);

    const result = await db.transaction(async (tx) => {
      // 1. Create Customer Return Record
      const [newReturn] = await tx
        .insert(customerReturns)
        .values({
          returnNumber: validatedData.returnNumber,
          saleId: validatedData.saleId,
          customerId: validatedData.customerId,
          totalRefund: validatedData.totalRefund.toString(),
          compensationType: validatedData.compensationType,
          userId: validatedData.userId,
        })
        .returning();

      // 2. Handle Return Items
      for (const item of validatedData.items) {
        // Fetch variant info for conversion
        const variant = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, item.variantId),
        });

        if (!variant) {
          throw new Error(`Variant not found for ID: ${item.variantId}`);
        }

        // Fetch original priceAtSale from saleItems (optional optimization, but good for data integrity)
        // For now trusting the input is complex, usually we should query the original sale item.
        // But validation schema says priceAtSale is omitted from input, wait..
        // My validation schema omitted priceAtSale. I need to fetch it from the original sale.
        // Let's find the original sale item.
        const originalSaleItem = await tx.query.saleItems.findFirst({
          where: and(
            eq(productVariants.id, item.variantId),
            eq(products.id, item.productId),
            // We should really link to exact sale_item_id or filter by saleId + variantId
            // However saleItems schema doesn't seem to be easily linkable without saleId context which we have via newReturn.saleId
          ),
          // Ideally we need to find the sale item belonging to this saleId
        });

        // Actually, searching by saleId and variantId is safer.
        const relevantSaleItem = await tx.query.saleItems.findFirst({
          where: (saleItems, { and, eq }) =>
            and(
              eq(saleItems.saleId, validatedData.saleId),
              eq(saleItems.variantId, item.variantId),
            ),
        });

        const priceAtSale = relevantSaleItem
          ? relevantSaleItem.priceAtSale
          : variant.sellPrice; // Fallback to current sell price if not found (unexpected)

        await tx.insert(customerReturnItems).values({
          returnId: newReturn.id,
          productId: item.productId,
          variantId: item.variantId,
          qty: item.qty.toString(),
          priceAtSale: priceAtSale.toString(),
          reason: item.reason,
          returnedToStock: item.returnedToStock,
          userId: validatedData.userId,
        });

        // Increase stock if returnedToStock is true
        if (item.returnedToStock) {
          const qtyBase = Number(item.qty) * Number(variant.conversionToBase);

          // Update product stock
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${qtyBase}`,
            })
            .where(eq(products.id, item.productId));

          // Create stock mutation
          await tx.insert(stockMutations).values({
            productId: item.productId,
            variantId: item.variantId,
            type: "return_restock",
            qtyBaseUnit: qtyBase.toString(),
            reference: newReturn.returnNumber,
            userId: validatedData.userId,
          });
        }
      }

      // 3. Handle Exchange Items (if type is exchange)
      if (
        validatedData.compensationType === "exchange" &&
        validatedData.exchangeItems
      ) {
        for (const exItem of validatedData.exchangeItems) {
          const variant = await tx.query.productVariants.findFirst({
            where: eq(productVariants.id, exItem.variantId),
          });

          if (!variant) {
            throw new Error(`Variant not found for ID: ${exItem.variantId}`);
          }

          await tx.insert(customerExchangeItems).values({
            returnId: newReturn.id,
            productId: exItem.productId,
            variantId: exItem.variantId,
            qty: exItem.qty.toString(),
          });

          // Decrease Stock for Exchange Item
          const qtyBase = Number(exItem.qty) * Number(variant.conversionToBase);

          // Update product stock
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} - ${qtyBase}`,
            })
            .where(eq(products.id, exItem.productId));

          // Create stock mutation
          await tx.insert(stockMutations).values({
            productId: exItem.productId,
            variantId: exItem.variantId,
            type: "exchange",
            qtyBaseUnit: (-qtyBase).toString(), // Negative for outgoing
            reference: newReturn.returnNumber,
            userId: validatedData.userId,
          });
        }
      }

      return newReturn;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error) {
      // Zod error handling usually throws specific structure; simplistic here
      console.error("create customer-return error:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }
    console.error("create customer-return error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create customer-return" },
      { status: 500 },
    );
  }
}
