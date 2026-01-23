import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/drizzle/schema";
import { and, desc, lte, sql } from "drizzle-orm";
import { validateProductData } from "@/lib/validations/product";
import {
  formatMeta,
  getSearchAndOrderFTS,
  parsePagination,
} from "@/lib/query-helper";

// GET semua products dengan pagination dan search
export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const { searchFilter, searchOrder } = getSearchAndOrderFTS(
      params.search,
      params.order,
      params.orderBy,
      products,
    );

    const [productsData, totalRes, totalStockCount, countUnderMinimumStock] =
      await Promise.all([
        db.query.products.findMany({
          where: and(searchFilter, products.isActive),
          with: {
            unit: {
              columns: {
                id: true,
                name: true,
              },
            },
            category: {
              columns: {
                id: true,
                name: true,
              },
            },
            variants: {
              columns: {
                id: true,
                name: true,
                sku: true,
                conversionToBase: true,
                sellPrice: true,
              },
              with: {
                unit: {
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
          .from(products)
          .where(and(searchFilter, products.isActive)),
        db
          .select({ countStock: sql<number>`sum(stock)` })
          .from(products)
          .where(and(searchFilter, products.isActive)),
        db
          .select({ countUnderMinimumStock: sql<number>`count(*)` })
          .from(products)
          .where(
            and(
              searchFilter,
              products.isActive,
              lte(products.stock, products.minStock),
            ),
          ),
      ]);

    const totalCount = Number(totalRes[0]?.count || 0);
    const totalStock = Number(totalStockCount[0]?.countStock || 0);
    const totalUnderMinimumStock = Number(
      countUnderMinimumStock[0]?.countUnderMinimumStock || 0,
    );

    return NextResponse.json({
      success: true,
      data: productsData,
      analytics: {
        totalProducts: totalCount,
        totalStock: totalStock,
        underMinimumStock: totalUnderMinimumStock,
      },
      meta: formatMeta(totalCount, params.page, params.limit),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST tambah product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateProductData(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.format() || "Unknown error",
        },
        { status: 400 },
      );
    }

    const [newProduct] = await db
      .insert(products)
      .values(validation.data)
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newProduct,
        message: "Product created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error inserting product:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
