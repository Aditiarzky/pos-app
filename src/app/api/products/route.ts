import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/drizzle/schema";
import { desc, sql } from "drizzle-orm";
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
      products
    );

    const [productsData, totalRes] = await Promise.all([
      db.query.products.findMany({
        where: searchFilter,
        with: {
          unit: {
            columns: {
              name: true,
            },
          },
          category: {
            columns: {
              name: true,
            },
          },
          variants: true,
        },
        orderBy: searchOrder,
        limit: params.limit,
        offset: params.offset,
      }),

      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(searchFilter),
    ]);

    const totalCount = Number(totalRes[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: productsData,
      meta: formatMeta(totalCount, params.page, params.limit),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
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
        { status: 400 }
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
      { status: 201 }
    );
  } catch (error) {
    console.error("Error inserting product:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
